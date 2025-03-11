import { invoke } from '@tauri-apps/api/core'
import { LogicalSize } from '@tauri-apps/api/dpi'
import { appConfigDir, sep } from '@tauri-apps/api/path'
import { Window } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-dialog'
import type { RemoveOptions } from '@tauri-apps/plugin-fs'
import { BaseDirectory, exists, mkdir, readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'
import type { Arch, OsType, Platform } from '@tauri-apps/plugin-os'
import { arch, hostname, platform, type } from '@tauri-apps/plugin-os'
import { Base64 } from 'js-base64'
import { useWindowStore } from '~~/src-nuxt/stores/window.store'

import { CloudStorageS3Service } from '#src-common/core/services/CloudStorageS3Service'

/**
 * Statut de connexion de l'utilisateur
 * @property {string} Online - L'utilisateur est en ligne
 * @property {string} Unavailable - L'utilisateur est indisponible
 * @property {string} Invisible - L'utilisateur est invisible
 */
export type UserConnectedStatus = 'Online' | 'Unavailable' | 'Invisible'

/**
 * Informations sur le système d'exploitation
 * @property {string} os - Système d'exploitation
 * @property {Platform} platform - Plateforme
 * @property {string} architecture - Architecture du système
 * @property {string | null} hostname - Nom d'hôte
 */
export type SystemOSInfo = {
  os: string
  platform: Platform
  architecture: Arch
  hostname: string | null
}

/**
 * Emplacement d'installation du jeu
 * @property {string} pathSystem - Chemin choisi par l'utilisateur pour l'installation du jeu
 * @property {number} diskFreeSpace - Espace libre sur le disque dur qui contient le chemin d'installation
 */
export type PathInstallLocation = {
  pathSystem: string
  diskFreeSpace?: number
}

/**
 * Sauvegarde d'un jeu entièrement installé
 * @property {number} user_id - Identifiant de l'utilisateur
 * @property {GameManifestLocal} gameManifest - Fichier manifest.json stringifié du jeu, pour le pc local de l'utilisateur
 * permet de comparer par rapport à celui du Server pour voir si il reste des fichiers à télécharger
 */
export type GameInstalled = {
  user_id: number
  gameManifest: GameManifestLocal
}

/**
 * Progression du téléchargement du jeu (en cours), sauvegardée dans un
 * fichier JSON dans le dossier de configuration de l'application
 * @property {number} userId - Identifiant de l'utilisateur
 * @property {string} pathInstallLocation - Emplacement d'installation du jeu
 * @property {number} gameId - Identifiant du jeu
 * @property {string} gameTitle - Titre du jeu
 * @property {string} gameVersion - Version du jeu (ex: v1.0.0)
 * @property {number} totalSizeToDownload - Taille totale du jeu à télécharger
 */
export type GameProgressDownload = {
  userId: number
  pathInstallLocation: string
  gameId: number
  gameTitle: string
  gameVersion: string
  totalSizeToDownload: number
}

/**
 * Type représentant un fichier avec son nom et son hash.
 * @type {object} FileDetails
 * @property {string} name - Nom du fichier
 * @property {string} hash - Hash du fichier
 * @property {number} size - Taille du fichier en octets
 */
export type FileDetails = {
  name: string
  hash: string
  size: number
}

/**
 * Type représentant la structure des données de la version
 * du jeu (manifest_local.json) dans le dossier d'installation du jeu.
 * @type {object} GameManifest
 * @property {string} pathInstallLocation - Emplacement d'installation du jeu
 * @property {number} gameId - Identifiant du jeu
 * @property {string} gameTitle - Titre du jeu
 * @property {number} gameBinarySize - Taille du jeu
 * @property {string} version - Version du jeu (ex: v1.0.0)
 * @property {FileDetails[]} files - Liste des fichiers de la version du jeu
 */
export type GameManifestLocal = {
  pathInstallLocation: string
  gameId: number
  gameTitle: string
  gameBinarySize: number
  version: string
  files: FileDetails[]
}

/**
 * Type représentant la structure des données de la version du jeu (manifest.json) côté serveur.
 * @type {object} GameManifestRemote
 * @property {string} version - Version du jeu (ex: v1.0.0)
 * @property {FileDetails[]} files - Liste des fichiers de la version du jeu
 */
export type GameManifestRemote = {
  version: string
  files: FileDetails[]
}

/**
 * Informations d'identification
 * @property {string} email - Adresse e-mail
 * @property {string} password - Mot de passe
 */
export type Credentials = {
  email: string
  password: string
}

/**
 * Service Tauri
 * @class TauriService
 */
export class TauriService {
  /**
   * Récupère les informations d'espace disque pour un chemin d'installation spécifique
   * @param {string} pathInstallLocation - Chemin d'installation du jeu
   * @returns {Promise<PathInstallLocation | undefined>} - Informations sur l'emplacement du chemin d'installation
   */
  public static async getDiskSpaceForInstallPath(
    pathInstallLocation: string,
  ): Promise<PathInstallLocation | undefined> {
    try {
      if (!pathInstallLocation) throw new Error('Installation path not provided')

      const systemOSInfo: SystemOSInfo | undefined = await this.getSystemOSCurrent()
      if (!systemOSInfo) throw new Error('Failed to get system OS info')

      let mountPoint: string | undefined

      if (systemOSInfo.os.toLowerCase().includes('windows')) {
        const match: RegExpMatchArray | null = pathInstallLocation.match(/^[a-zA-Z]:\\/)
        if (match) mountPoint = match[0] // For Windows, get the drive letter
      } else {
        mountPoint = '/' // For macOS/Linux, use root as the mount point
      }

      if (!mountPoint) throw new Error(`Could not determine mount point for path: ${pathInstallLocation}`)

      const freeSpace: unknown = await invoke('check_disk_space', { path: mountPoint })

      return {
        pathSystem: pathInstallLocation,
        diskFreeSpace: freeSpace,
      } as PathInstallLocation
    } catch (error) {
      console.error('getDiskSpaceForInstallPath Error:', error)
    }
  }

  /**
   * Sélectionne le chemin d'installation et vérifie l'espace disque
   * @returns {Promise<PathInstallLocation | undefined>} - Emplacement d'installation
   */
  public static async selectPathForInstallAndCheckSpace(): Promise<PathInstallLocation | undefined> {
    try {
      const selectedPath: string | string[] | null = await open({
        directory: true,
        multiple: false,
        defaultPath: await appConfigDir(),
      })

      const systemOSInfo: SystemOSInfo | undefined = await this.getSystemOSCurrent()
      if (!systemOSInfo) throw new Error('Failed to get system OS info')

      let mountPoint: string | undefined = undefined

      if (typeof selectedPath === 'string') {
        if (systemOSInfo.os.toLowerCase().includes('windows')) {
          const match: RegExpMatchArray | null = selectedPath.match(/^[a-zA-Z]:\\/)
          if (match) {
            mountPoint = match[0] // For Windows, get the drive letter
          }
        } else {
          mountPoint = '/' // For macOS/Linux, use root as the mount point
        }
      } else {
        throw new Error(`Invalid selectedPath: ${selectedPath}`)
      }

      if (!mountPoint) throw new Error(`Could not determine mount point for selected path: ${selectedPath}`)

      console.log('Selected directory for install game :', selectedPath)
      const freeSpace: unknown = await invoke('check_disk_space', { path: mountPoint })
      console.log(`Espace libre sur le disque: ${freeSpace} bytes`)

      return {
        pathSystem: selectedPath,
        diskFreeSpace: freeSpace,
      } as PathInstallLocation
    } catch (error) {
      console.error('selectPathForInstallAndCheckSpace Error:', error)
    }
  }

  /**
   * Récupère le chemin de l'exécutable du launcher lui-même
   * @returns {Promise<PathInstallLocation | undefined>} - Emplacement de l'exécutable
   */
  public static async getLauncherExecutablePathDirectory(): Promise<PathInstallLocation | undefined> {
    try {
      const defaultPath: string = await invoke('get_launcher_path_directory')
      if (!defaultPath) throw new Error('Failed to get the launcher default path')

      const systemOSInfo: SystemOSInfo | undefined = await this.getSystemOSCurrent()
      if (!systemOSInfo) throw new Error('Failed to get system OS info')

      let mountPoint: string | undefined

      if (systemOSInfo.os.toLowerCase().includes('windows')) {
        const match: RegExpMatchArray | null = defaultPath.match(/^[a-zA-Z]:\\/)
        if (match) mountPoint = match[0] // For Windows, get the drive letter
      } else {
        mountPoint = '/' // For macOS/Linux, use root as the mount point
      }

      if (!mountPoint) throw new Error(`Could not determine mount point for default path: ${defaultPath}`)

      const freeSpace: unknown = await invoke('check_disk_space', { path: mountPoint })

      return {
        pathSystem: defaultPath,
        diskFreeSpace: freeSpace,
      } as PathInstallLocation
    } catch (error) {
      console.error('getLauncherExecutablePathDirectory Error:', error)
    }
  }

  /**
   * Récupère les informations sur le système d'exploitation
   * @returns {Promise<SystemOSInfo | undefined>} - Informations sur le système d'exploitation
   */
  public static async getSystemOSCurrent(): Promise<SystemOSInfo | undefined> {
    try {
      const currentPlatform: Platform = await platform()
      const currentArch: Arch = await arch()
      const currentHostname: string | null = await hostname()
      const currentOS: OsType = await type()

      return {
        os: currentOS,
        platform: currentPlatform,
        architecture: currentArch,
        hostname: currentHostname,
      } as SystemOSInfo
    } catch (error) {
      console.error('getSystemOSCurrent Error : ', error)
    }
  }

  /**
   * Télécharge et décompresse le jeu sur le système de l'utilisateur
   * @param {string} bucketName - Nom du bucket S3
   * @param {string} pathFilename - Chemin du fichier ou du dossier à télécharger
   * @param {string | undefined} fileLocationDownload - Emplacement ou les fichiers seront installer sur le pc de l'utilisateur
   * @param {boolean} desktopShortcut - Créer un raccourci sur le bureau
   * @param {string} gameTitle - Titre du jeu
   * @param {string} gameVersion - Version du jeu
   * @param {number} gameBinarySize - Taille du jeu
   * @param {number} gameId - Identifiant du jeu
   * @param {number} userId - Identifiant de l'utilisateur
   * @param {FileDetails[]} filesToDownload - Liste des fichiers à télécharger
   * @param {GameManifestRemote} gameManifestRemote - Fichier manifest.json du jeu côté serveur
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async downloadGame(
    bucketName: string,
    pathFilename: string,
    fileLocationDownload: string | undefined,
    desktopShortcut: boolean,
    gameTitle: string,
    gameVersion: string,
    gameBinarySize: number,
    gameId: number,
    userId: number,
    filesToDownload: FileDetails[],
    gameManifestRemote: GameManifestRemote,
  ): Promise<void> {
    try {
      const userSystemOSInfo: SystemOSInfo | undefined = await this.getSystemOSCurrent()
      const apiURL: string = import.meta.env.VITE_API_BASE_URL_S3_DOWNLOAD as string

      console.log({
        bucketName,
        pathFilename,
        os: userSystemOSInfo?.os,
        os_architecture: userSystemOSInfo?.architecture,
        apiUrl: apiURL,
        fileLocationDownload,
        filesToDownload,
        gameVersion,
        gameBinarySize,
        gameId,
        userId,
      })

      if (userSystemOSInfo) {
        invoke('download_and_update_game', {
          bucketName,
          pathFilename,
          os: userSystemOSInfo.os,
          osArchitecture: userSystemOSInfo.architecture,
          apiUrl: apiURL,
          fileLocationDownload,
          filesToDownload,
          desktopShortcut,
          gameTitle,
          gameVersion,
          gameBinarySize,
          gameId,
          userId,
          gameManifestRemote,
        })

        navigateTo('/home/download-manager')
      }
    } catch (error) {
      console.error('Failed to download and decompress game', error)
    }
  }

  /**
   * Lance le jeu
   * @param {string | undefined} pathFileSystem - Emplacement du fichier système
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async launchGame(pathFileSystem: string | undefined): Promise<void> {
    try {
      await invoke('launch_game', { fileLocationDownload: pathFileSystem })
    } catch (error) {
      console.error('launchGame error : ', error)
      throw error
    }
  }

  /**
   * Ecriture de fichier
   * @param {string} nameFile - Nom du fichier
   * @param {string} contents - Contenu du fichier
   */
  public static async writeTextFile(nameFile: string, contents: string): Promise<void> {
    try {
      // Obtient le chemin du dossier de configuration de l'application
      const configDirPath: string = await appConfigDir()

      // Vérifiez si le dossier existe, sinon créez-le
      await mkdir(configDirPath, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
      })

      await writeTextFile(nameFile, contents, {
        baseDir: BaseDirectory.AppData, // Exemple Windows = %APPDATA%/com.crzgames.launcher/..
      })
    } catch (error) {
      console.error('writeTextFile error : ', error)
    }
  }

  /**
   * Lecture de fichier
   * @param {string} filePath - Chemin du fichier
   * @returns {Promise<string | undefined>} - Contenu du fichier
   */
  public static async readTextFile(filePath: string): Promise<string | undefined> {
    try {
      return await readTextFile(filePath, {
        baseDir: BaseDirectory.AppData, // Exemple Windows = %APPDATA%/com.crzgames.launcher/..
      })
    } catch (error) {
      console.error('readTextFile error : ', error)
    }
  }

  /**
   * Vérifie si le fichier ou le dossier existe
   * @param {string} filePath - Chemin du fichier
   * @returns {Promise<boolean | undefined>} - Vérification de l'existence du fichier ou du dossier
   */
  public static async isExistFileOrFolder(filePath: string): Promise<boolean | undefined> {
    try {
      return await exists(filePath, {
        baseDir: BaseDirectory.AppData, // Exemple Windows = %APPDATA%/com.crzgames.launcher/..
      })
    } catch (error) {
      console.error('isExistFileOrFolder error : ', error)
    }
  }

  /**
   * Récupère les progressions de téléchargement des jeux sur le système de l'utilisateur
   * @param {number} userId - Identifiant de l'utilisateur
   * @returns {Promise<GameProgressDownload[] | undefined>} - Progressions de téléchargement des jeux
   */
  public static async getGameProgressDownloads(userId: number): Promise<GameProgressDownload[] | undefined> {
    try {
      const filePath: string = 'gameProgressDownload.json'

      // Vérifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)

      if (exist) {
        // Si le fichier existe, lire les données existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)

        if (data) {
          const downloads: GameProgressDownload[] = JSON.parse(data) as GameProgressDownload[]

          // Filtrer les téléchargements pour l'utilisateur connecté
          return downloads.filter((download: GameProgressDownload): boolean => download.userId === userId)
        }
      }
    } catch (error) {
      console.error('Failed to get game progress downloads', error)
    }
  }

  /**
   * Sauvegarde la progression du téléchargement du jeu dans un fichier JSON,
   * sur le système de l'utilisateur
   * @param {GameProgressDownload} gameProgressDownload - Progression du téléchargement du jeu
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async saveGameProgressDownload(gameProgressDownload: GameProgressDownload): Promise<void> {
    try {
      const filePath: string = 'gameProgressDownload.json'
      let gameProgressDownloads: GameProgressDownload[] = []

      // Vérifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        // Si le fichier existe, lire les données existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)
        if (data) gameProgressDownloads = JSON.parse(data)
      }

      // Filtrer les jeux existants pour enlever ceux qui ont le même titre que le nouveau jeu
      gameProgressDownloads = gameProgressDownloads.filter(
        (game: GameProgressDownload): boolean => game.gameId !== gameProgressDownload.gameId,
      )

      // Ajouter le nouveau jeu à la liste
      gameProgressDownloads.push({
        userId: gameProgressDownload.userId,
        pathInstallLocation: gameProgressDownload.pathInstallLocation,
        gameId: gameProgressDownload.gameId,
        gameTitle: gameProgressDownload.gameTitle,
        gameVersion: gameProgressDownload.gameVersion,
        totalSizeToDownload: gameProgressDownload.totalSizeToDownload,
      })

      // Écrire les données mises à jour dans le fichier
      await TauriService.writeTextFile(filePath, JSON.stringify(gameProgressDownloads))
    } catch (error) {
      console.error('Failed to save game progress download', error)
    }
  }

  /**
   * Supprime la progression du téléchargement du jeu
   * @param {number} gameId - Identifiant du jeu
   * @param {number} userId - Identifiant de l'utilisateur
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async removeGameProgressDownload(gameId: number, userId: number): Promise<void> {
    try {
      const filePath: string = 'gameProgressDownload.json'
      let gameProgressDownloads: GameProgressDownload[] = []

      // Vérifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        // Si le fichier existe, lire les données existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)
        if (data) gameProgressDownloads = JSON.parse(data)
      }

      // Filtrer les jeux existants pour enlever ceux qui ont le même titre que le nouveau jeu
      gameProgressDownloads = gameProgressDownloads.filter(
        (game: GameProgressDownload): boolean => game.gameId !== gameId && game.userId !== userId,
      )

      // Écrire les données mises à jour dans le fichier
      await TauriService.writeTextFile(filePath, JSON.stringify(gameProgressDownloads))
    } catch (error) {
      console.error('Failed to remove game progress download', error)
    }
  }

  /**
   * Sauvegarde du jeu lorsque le téléchargement est terminé
   * @param {GameInstalled} gameInstalled - Sauvegarde du jeu
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async saveGameInstalled(gameInstalled: GameInstalled): Promise<void> {
    try {
      const filePath: string = 'gamesInstalled.json'
      let gamesInstalled: GameInstalled[] = []

      // Vérifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        // Si le fichier existe, lire les données existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)
        if (data) gamesInstalled = JSON.parse(data)
      }

      // Filtrer les jeux existants pour enlever ceux qui ont le même titre que le nouveau jeu
      gamesInstalled = gamesInstalled.filter(
        (game: GameInstalled): boolean => game.gameManifest.gameId !== gameInstalled.gameManifest.gameId,
      )

      // Ajouter le nouveau jeu à la liste
      gamesInstalled.push({
        user_id: gameInstalled.user_id,
        gameManifest: gameInstalled.gameManifest,
      })

      // Écrire les données mises à jour dans le fichier
      await TauriService.writeTextFile(filePath, JSON.stringify(gamesInstalled))
    } catch (error) {
      console.error('Failed to save game', error)
    }
  }

  /**
   * Supprime le jeu installé de la liste des jeux installés
   * @param {number} gameId - Identifiant du jeu
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async removeGameInstalled(gameId: number): Promise<void> {
    try {
      const filePath: string = 'gamesInstalled.json'
      let gamesInstalled: GameInstalled[] = []

      // Vérifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        // Si le fichier existe, lire les données existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)
        if (data) gamesInstalled = JSON.parse(data)
      }

      // Filtrer les jeux existants pour enlever ceux qui ont le même titre que le nouveau jeu
      gamesInstalled = gamesInstalled.filter((game: GameInstalled): boolean => game.gameManifest.gameId !== gameId)

      // Écrire les données mises à jour dans le fichier
      await TauriService.writeTextFile(filePath, JSON.stringify(gamesInstalled))
    } catch (error) {
      console.error('Failed to remove game', error)
    }
  }

  /**
   * Récupère les sauvegardes des jeux
   * @returns {Promise<GameInstalled[] | undefined>} - Sauvegardes des jeux
   */
  public static async getGamesInstalled(): Promise<GameInstalled[] | undefined> {
    try {
      const filePath: string = 'gamesInstalled.json'

      // Vérifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)

      if (exist) {
        // Si le fichier existe, lire les données existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)

        if (data) {
          return JSON.parse(data) as GameInstalled[]
        }
      }
    } catch (error) {
      console.error('Failed to save games', error)
    }
  }

  /**
   * Supprime la connexion automatique
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async removeStayLoggedIn(): Promise<void> {
    try {
      const filePath: string = 'stayLoggedIn.json'

      // Vérifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        const removeOptions: RemoveOptions = {
          baseDir: BaseDirectory.AppData,
          recursive: true,
        }
        await remove(filePath, removeOptions)
      }
    } catch (error) {
      console.error('removeStayLoggedIn error : ', error)
    }
  }

  /**
   * Set les identifiants de connexion enregistrés sur le système du joueur
   * @param {Credentials} credentials - Informations d'identification
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async setStayLoggedIn(credentials: Credentials): Promise<void> {
    try {
      const filePath: string = 'stayLoggedIn.json'

      // Écrire les données dans le fichier
      await TauriService.writeTextFile(filePath, Base64.encode(JSON.stringify(credentials)))
    } catch (error) {
      console.error('setStayLoggedIn error : ', error)
    }
  }

  /**
   * Récupère les identifiants de connexion enregistrés sur le système du joueur
   * @returns {Promise<Credentials | undefined>} - Informations d'identification
   */
  public static async getStayLoggedIn(): Promise<Credentials | undefined> {
    try {
      const filePath: string = 'stayLoggedIn.json'

      // Vérifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        // Si le fichier existe, lire les données existantes
        const encodedData: string | undefined = await TauriService.readTextFile(filePath)

        if (encodedData) {
          // Décoder les données en base64
          const decodedData: string = Base64.decode(encodedData)

          // Parser les données JSON
          return JSON.parse(decodedData) as Credentials
        }
      }

      return undefined
    } catch (error) {
      console.error('getStayLoggedIn error: ', error)
    }
  }

  /**
   * Enregistrer le statut de connexion de l'utilisateur dans un fichier
   * @param {UserConnectedStatus} status - Statut de connexion
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async setStatusConnected(status: UserConnectedStatus): Promise<void> {
    try {
      const filePath: string = 'statusConnected.json'

      // Écrire le statut dans le fichier
      await TauriService.writeTextFile(filePath, JSON.stringify({ status }))
    } catch (error) {
      console.error('setStatusConnected error : ', error)
    }
  }

  /**
   * Récupère le statut de connexion de l'utilisateur dans un fichier
   * @returns {Promise<UserConnectedStatus | undefined>} - Statut de connexion
   */
  public static async getStatusConnected(): Promise<UserConnectedStatus | undefined> {
    try {
      const filePath: string = 'statusConnected.json'

      // Vérifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        // Si le fichier existe, lire les données existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)

        if (data) {
          // Parser les données JSON
          const statusData: any = JSON.parse(data)
          return statusData.status as UserConnectedStatus
        }
      }

      return undefined
    } catch (error) {
      console.error('getStatusConnected error : ', error)
    }
  }

  /**
   * Recuperer la fenetre actuelle et la redimensionner quand
   * on est sur la page de auto update du launcher vers login
   * @param {number} width - Largeur de la fenêtre
   * @param {number} height - Hauteur de la fenêtre
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async adjustWindowToLogin(width: number, height: number): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/typedef
    const windowStore = useWindowStore()
    windowStore.setLoading(true)

    const appWindow: Window = new Window('main')

    const newSize: LogicalSize = new LogicalSize(width, height)
    await appWindow.setSize(newSize)
    await appWindow.center()

    navigateTo('/login')
  }

  /**
   * Recuperer la fenetre actuelle et la redimensionner quand on vient de login vers la page home (carousel)
   * @param {number} width - Largeur de la fenêtre
   * @param {number} height - Hauteur de la fenêtre
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async adjustWindowToHome(width: number, height: number): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/typedef
    const windowStore = useWindowStore()
    windowStore.setLoading(true)

    const appWindow: Window = new Window('main')

    const newSize: LogicalSize = new LogicalSize(width, height)
    await appWindow.setSize(newSize)
    await appWindow.setResizable(true)
    await appWindow.setMinSize(new LogicalSize(1038, 660))
    await appWindow.center()

    navigateTo('/home/carousel')
  }

  /**
   * Recuperer la fenetre actuelle et la redimensionner quand on vient de home vers la page login
   * @param {number} width - Largeur de la fenêtre
   * @param {number} height - Hauteur de la fenêtre
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async adjustWindowHomeToLogin(width: number, height: number): Promise<void> {
    useWindowStore().setLoading(true)

    const appWindow: Window = new Window('main')

    const newSize: LogicalSize = new LogicalSize(width, height)
    await appWindow.setSize(newSize)
    await appWindow.setResizable(false)
    await appWindow.center()

    navigateTo('/login')
  }

  /**
   * Recuperer la fenetre actuelle et la redimensionner quand on vient de home vers la page login
   * @param {number} width - Largeur de la fenêtre
   * @param {number} height - Hauteur de la fenêtre
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async adjustWindowHomeToLoginForMiddleware(width: number, height: number): Promise<void> {
    useWindowStore().setLoading(true)

    const appWindow: Window = new Window('main')

    const newSize: LogicalSize = new LogicalSize(width, height)
    await appWindow.setSize(newSize)
    await appWindow.setResizable(false)
    await appWindow.center()
  }

  /**
   * Envoie une notification qui crée une pop up sur le système !
   * @param {string} title - Titre de la notification
   * @param {string} body - Corps de la notification
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async sendNotification(title: string, body: string): Promise<void> {
    try {
      // Avez-vous la permission d'envoyer une notification ?
      let permissionGranted: boolean = await isPermissionGranted()

      // Le cas échéant on la demande
      if (!permissionGranted) {
        const permission: NotificationPermission = await requestPermission()
        permissionGranted = permission === 'granted'
      }

      // Une fois la permission obtenue, on envoie la notification
      if (permissionGranted) {
        sendNotification({ title: title, body: body })
      }
    } catch (error) {
      console.error('sendNotification error : ', error)
    }
  }

  /**
   * Télécharge le fichier manifest.json du jeu depuis le serveur
   * @param {string} bucketName - Nom du bucket S3
   * @param {string} pathFilename - Chemin du fichier manifest.json
   * @returns {Promise<GameManifestRemote | undefined>} - Fichier manifest.json du jeu côté serveur ou undefined
   */
  public static async downloadGameManifestRemote(
    bucketName: string,
    pathFilename: string,
  ): Promise<GameManifestRemote | undefined> {
    try {
      return (await CloudStorageS3Service.getFileContentInBucket(
        bucketName,
        pathFilename + 'manifest.json',
      )) as GameManifestRemote
    } catch (error) {
      console.error('Failed to download manifest', error)
      return undefined
    }
  }

  /**
   * Vérifie les fichiers manquants sur le système de l'utilisateur
   * @param {string} fileLocationDownload - Emplacement ou les fichiers seront installer sur le pc de l'utilisateur
   * @param {GameManifestLocal} localManifest - Fichier manifest_local.json du jeu côté client
   * @returns {Promise<FileDetails[]>} -
   */
  public static async getMissingFiles(
    fileLocationDownload: string,
    localManifest: GameManifestLocal,
  ): Promise<FileDetails[]> {
    try {
      return await invoke('check_missing_files', {
        fileLocationDownload: fileLocationDownload,
        localManifest: localManifest,
      })
    } catch (error) {
      console.error('Failed to check missing files:', error)
      return []
    }
  }

  /**
   * Compare les fichiers locaux et distants pour déterminer les fichiers à télécharger
   * @param {GameManifestLocal} localManifest - Fichier manifest_local.json du jeu côté client
   * @param {GameManifestRemote} remoteManifest - Fichier manifest.json du jeu côté serveur
   * @param {string} fileLocationDownload - Le chemin du dossier d'installation
   * @returns {FileDetails[]} - Liste des fichiers à télécharger
   */
  public static async getFilesToDownload(
    localManifest: GameManifestLocal,
    remoteManifest: GameManifestRemote,
    fileLocationDownload: string,
  ): Promise<FileDetails[]> {
    // Vérifier les fichiers manquants sur le disque
    const missingFiles: FileDetails[] = await this.getMissingFiles(fileLocationDownload, localManifest)
    console.log('Missing files:', missingFiles)

    const localFiles: Map<string, string> = new Map(
      localManifest.files.map((file: FileDetails) => [file.name, file.hash]),
    )

    missingFiles.forEach((file: FileDetails): void => {
      localFiles.delete(file.name)
    })

    return remoteManifest.files.filter(
      (file: FileDetails) =>
        localFiles.get(file.name) !== file.hash ||
        missingFiles.some((mf: FileDetails): boolean => mf.name === file.name),
    )
  }

  /**
   * Finalise le téléchargement du jeu en supprimant le jeu des progressions de téléchargement
   * et en sauvegardant le jeu dans la liste des jeux installés sur le système de l'utilisateur
   * @param {number} userId - Identifiant de l'utilisateur
   * @param {GameManifestLocal} gameManifest - Fichier manifest.json du jeu côté client
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async finalizeDownload(userId: number, gameManifest: GameManifestLocal): Promise<void> {
    // Supprimer le jeu des progressions de téléchargement
    let gameProgressDownloads: GameProgressDownload[] = (await this.getGameProgressDownloads(userId)) || []
    gameProgressDownloads = gameProgressDownloads.filter(
      (game: GameProgressDownload): boolean => game.gameId !== gameManifest.gameId,
    )
    await this.writeTextFile('gameProgressDownload.json', JSON.stringify(gameProgressDownloads))

    // Sauvegarder le jeu dans la liste des jeux installés
    await this.saveGameInstalled({
      user_id: userId,
      gameManifest: gameManifest,
    })

    await this.sendNotification('CrzGames', `${gameManifest.gameTitle} has been successfully installed`)
  }

  /**
   * Normalise le chemin du fichier en fonction du système d'exploitation
   * @param {string} path - Chemin d'installation du jeu
   * @returns {Promise<string>} - Chemin normalisé
   */
  private static normalizePath(path: string): string {
    const separator: string = sep()
    return path.replace(/[/\\]/g, separator)
  }

  /**
   * Récupère le fichier manifest_local.json à partir du pathInstallLocation
   * @param {string} pathInstallLocation - Chemin d'installation du jeu
   * @returns {Promise<GameManifestLocal | undefined>} - Le manifeste du jeu ou undefined
   */
  public static async getContentLocalManifest(pathInstallLocation: string): Promise<GameManifestLocal | undefined> {
    try {
      const manifestFileName: string = 'manifest_local.json'
      const normalizedPath: string = this.normalizePath(pathInstallLocation)
      const manifestPath: string = this.normalizePath(`${normalizedPath}${sep()}${manifestFileName}`)

      console.log('Trying to read manifest from path:', manifestPath)

      // Lire le fichier manifest_local.json
      const manifestContent: string | undefined = await readTextFile(manifestPath)

      if (manifestContent) {
        return JSON.parse(manifestContent) as GameManifestLocal
      }
    } catch (error) {
      console.error('Failed to get local manifest', error)
      throw error
    }
  }

  /**
   * Crée un raccourci sur le bureau pour le jeu installé
   * @param {string} pathInstallLocationGame - Chemin d'installation du jeu
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async createShortcutOnDesktop(pathInstallLocationGame: string): Promise<void> {
    try {
      await invoke('create_shortcut', { directoryPath: pathInstallLocationGame })
    } catch (error) {
      console.error('Create shortcut on desktop error : ', error)
      throw error
    }
  }

  /**
   * Met en pause le téléchargement du jeu
   * @param {number} gameId - L'ID du jeu
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async pauseDownloadGame(gameId: number): Promise<void> {
    try {
      await invoke('pause_download', { gameId })
    } catch (error) {
      console.error('pauseDownloadGame error:', error)
      throw error
    }
  }

  /**
   * Reprend le téléchargement du jeu
   * @param {number} gameId - L'ID du jeu
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async resumeDownloadGame(gameId: number): Promise<void> {
    try {
      await invoke('resume_download', { gameId })
    } catch (error) {
      console.error('resumeDownloadGame error:', error)
      throw error
    }
  }

  /**
   * Annule le téléchargement du jeu
   * @param {number} gameId - L'ID du jeu
   * @param {string} pathInstallLocation - Emplacement d'installation du jeu
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async cancelDownloadGame(gameId: number, pathInstallLocation: string): Promise<void> {
    try {
      await invoke('cancel_download', { gameId })
      await TauriService.removeGameInstalled(gameId)
      await this.uninstallGame(pathInstallLocation)
    } catch (error) {
      console.error('cancelDownloadGame error:', error)
    }
  }

  /**
   * Désinstalle le jeu
   * @param {string} pathInstallLocation - Le chemin d'installation du jeu
   * @returns {Promise<void>} - Promesse résolue
   */
  public static async uninstallGame(pathInstallLocation: string): Promise<void> {
    try {
      await invoke('uninstall_game', { pathInstallLocation })
    } catch (error) {
      console.error('uninstallGame error:', error)
      throw error
    }
  }
}
