import { invoke } from '@tauri-apps/api/core'
import { LogicalSize } from '@tauri-apps/api/dpi'
import { appConfigDir, join, sep } from '@tauri-apps/api/path'
import { Window } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-dialog'
import type { RemoveOptions } from '@tauri-apps/plugin-fs'
import { BaseDirectory, exists, mkdir, readDir, readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'
import type { Arch, OsType, Platform } from '@tauri-apps/plugin-os'
import { arch, hostname, platform, type } from '@tauri-apps/plugin-os'
import { Base64 } from 'js-base64'
import { useWindowStore } from '~~/src-nuxt/app/stores/window.store'

import { CloudStorageS3Service } from '#src-common/core/services/CloudStorageS3Service'

import { createLogger } from '#src-core/utils/logger'
import type { Logger } from '#src-core/utils/logger'
import CookieService from '#src-common/core/services/CookieService'

const logger: Logger = createLogger('TauriService')

/**
 * Statut de connexion de l'utilisateur
 * @property {string} Online - L'utilisateur est en ligne
 * @property {string} Unavailable - L'utilisateur est indisponible
 * @property {string} Invisible - L'utilisateur est invisible
 */
export type UserConnectedStatus = 'Online' | 'Unavailable' | 'Invisible'

/**
 * Entree locale de statut de connexion scopee par utilisateur.
 */
type UserStatusConnectedEntry = {
  userId: number
  status: UserConnectedStatus
}

/**
 * Informations sur le systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me d'exploitation
 * @property {string} os - SystÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me d'exploitation
 * @property {Platform} platform - Plateforme
 * @property {string} architecture - Architecture du systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me
 * @property {string | null} hostname - Nom d'hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´te
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
 * Resultat de verification d'ecriture sur un chemin d'installation.
 * @property {boolean} isWritable - Le chemin est accessible en ecriture
 * @property {string} [error] - Message d'erreur detaille en cas d'echec
 */
export type InstallPathAccessResult = {
  isWritable: boolean
  error?: string
}

/**
 * Sauvegarde d'un jeu entiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨rement installÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©
 * @property {number} user_id - Identifiant de l'utilisateur
 * @property {GameManifestLocal} gameManifest - Fichier manifest.json stringifiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© du jeu, pour le pc local de l'utilisateur
 * permet de comparer par rapport ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  celui du Server pour voir si il reste des fichiers ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©charger
 */
export type GameInstalled = {
  user_id: number
  gameManifest: GameManifestLocal
}

/**
 * Progression du tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement du jeu (en cours), sauvegardÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e dans un
 * fichier JSON dans le dossier de configuration de l'application
 * @property {number} userId - Identifiant de l'utilisateur
 * @property {string} pathInstallLocation - Emplacement d'installation du jeu
 * @property {number} gameId - Identifiant du jeu
 * @property {string} gameTitle - Titre du jeu
 * @property {string} gameVersion - Version du jeu (ex: v1.0.0)
 * @property {number} totalSizeToDownload - Taille totale du jeu ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©charger
 */
export type GameProgressDownload = {
  userId: number
  pathInstallLocation: string
  gameId: number
  gameTitle: string
  gameVersion: string
  totalSizeToDownload: number
  totalDownloadedBytesNow?: number
}

/**
 * Type reprÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sentant un fichier avec son nom et son hash.
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
 * Type reprÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sentant la structure des donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es de la version
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
 * Type reprÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sentant la structure des donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es de la version du jeu (manifest.json) cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© serveur.
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
 * Options de lancement pour le tÃƒÂ©lÃƒÂ©chargement d'un jeu.
 * @property {boolean} [navigateToDownloadManager] - Rediriger automatiquement vers Download Manager
 * @property {SystemOSInfo} [systemOSInfo] - Infos systeme deja resolues pour eviter un appel supplementaire
 */
export type DownloadGameOptions = {
  navigateToDownloadManager?: boolean
  systemOSInfo?: SystemOSInfo
}

/**
 * Service Tauri
 * @class TauriService
 */
export class TauriService {
  /**
   * RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨re les informations d'espace disque pour un chemin d'installation spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cifique
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
   * SÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lectionne le chemin d'installation et vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifie l'espace disque
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

      logger.debug(`Selected directory for install game: ${selectedPath}`)
      const freeSpace: unknown = await invoke('check_disk_space', { path: mountPoint })
      logger.debug(`Espace libre sur le disque: ${freeSpace} bytes`)

      return {
        pathSystem: selectedPath,
        diskFreeSpace: freeSpace,
      } as PathInstallLocation
    } catch (error) {
      console.error('selectPathForInstallAndCheckSpace Error:', error)
    }
  }

  /**
   * RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨re le chemin de l'exÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cutable du launcher lui-mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªme
   * @returns {Promise<PathInstallLocation | undefined>} - Emplacement de l'exÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cutable
   */
  public static async getLauncherExecutablePathDirectory(): Promise<PathInstallLocation | undefined> {
    try {
      const appConfigPath: string = await appConfigDir()
      if (!appConfigPath) throw new Error('Failed to resolve app config directory')

      const normalizedBasePath: string = appConfigPath.replace(/[\\/]+$/, '')
      const defaultInstallPath: string = `${normalizedBasePath}${sep()}games`
      await mkdir(defaultInstallPath, { recursive: true })

      return await this.getDiskSpaceForInstallPath(defaultInstallPath)
    } catch (error) {
      console.error('getLauncherExecutablePathDirectory Error:', error)
    }
  }

  /**
   * RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨re les informations sur le systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me d'exploitation
   * @returns {Promise<SystemOSInfo | undefined>} - Informations sur le systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me d'exploitation
   */
  /**
   * Verifie que le chemin d'installation est accessible en ecriture.
   * @param {string} pathInstallLocation - Chemin d'installation cible
   * @returns {Promise<InstallPathAccessResult>} - Etat d'acces en ecriture
   */
  public static async checkInstallPathWriteAccess(pathInstallLocation: string): Promise<InstallPathAccessResult> {
    try {
      if (!pathInstallLocation) {
        return {
          isWritable: false,
          error: 'Installation path not provided',
        }
      }

      const normalizedPath: string = this.normalizePath(pathInstallLocation)
      await mkdir(normalizedPath, { recursive: true })

      const probeFilename: string = `.__crzgames_write_probe_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`
      const probeFilePath: string = this.normalizePath(`${normalizedPath}${sep()}${probeFilename}`)

      await writeTextFile(probeFilePath, 'crzgames-write-probe')
      await remove(probeFilePath, { recursive: false } as RemoveOptions)

      return { isWritable: true }
    } catch (error: unknown) {
      return {
        isWritable: false,
        error: String(error),
      }
    }
  }

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
   * TÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©charge et dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©compresse le jeu sur le systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me de l'utilisateur
   * @param {string} bucketName - Nom du bucket S3
   * @param {string} pathFilename - Chemin du fichier ou du dossier ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©charger
   * @param {string | undefined} fileLocationDownload - Emplacement ou les fichiers seront installer sur le pc de l'utilisateur
   * @param {boolean} desktopShortcut - CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©er un raccourci sur le bureau
   * @param {string} gameTitle - Titre du jeu
   * @param {string} gameVersion - Version du jeu
   * @param {number} gameBinarySize - Taille du jeu
   * @param {number} gameId - Identifiant du jeu
   * @param {number} userId - Identifiant de l'utilisateur
   * @param {FileDetails[]} filesToDownload - Liste des fichiers ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©charger
   * @param {GameManifestRemote} gameManifestRemote - Fichier manifest.json du jeu cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© serveur
   * @param {DownloadGameOptions} [options] - Options de navigation et infos systeme deja resolues
   * @returns {Promise<void>} - Promesse resolue
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
    options?: DownloadGameOptions,
  ): Promise<void> {
    try {
      const shouldNavigateToDownloadManager: boolean = options?.navigateToDownloadManager ?? true
      const userSystemOSInfo: SystemOSInfo | undefined = options?.systemOSInfo ?? (await this.getSystemOSCurrent())
      const apiURL: string = import.meta.env.VITE_API_BASE_URL_S3_DOWNLOAD as string
      const authToken: string | undefined = CookieService.getCookie('authToken')

      if (!userSystemOSInfo) {
        console.error('Failed to resolve OS info for download_and_update_game')
        return
      }

      if (!authToken) {
        console.error('Missing auth token for download_and_update_game')
        return
      }

      logger.debug(
        `[downloadGame] request bucket=${bucketName} path=${pathFilename} os=${userSystemOSInfo.os} arch=${userSystemOSInfo.architecture} gameId=${gameId} userId=${userId} version=${gameVersion} files=${filesToDownload.length}`,
      )

      void invoke('download_and_update_game', {
        bucketName,
        pathFilename,
        os: userSystemOSInfo.os,
        osArchitecture: userSystemOSInfo.architecture,
        apiUrl: apiURL,
        authToken,
        fileLocationDownload,
        filesToDownload,
        desktopShortcut,
        gameTitle,
        gameVersion,
        gameBinarySize,
        gameId,
        userId,
        gameManifestRemote,
      }).catch((error: unknown): void => {
        const errorMessage: string = String(error).toLowerCase()
        const isExpectedInterruption: boolean =
          errorMessage.includes('download paused') || errorMessage.includes('download canceled')

        if (isExpectedInterruption) {
          logger.info(`download_and_update_game interrupted: ${String(error)}`)
          return
        }

        console.error('download_and_update_game failed:', error)
      })

      if (shouldNavigateToDownloadManager) {
        await navigateTo('/home/download-manager')
      }
    } catch (error) {
      console.error('Failed to download and decompress game', error)
    }
  }

  /**
   * Lance le jeu
   * @param {string | undefined} pathFileSystem - Emplacement du fichier systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
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
   * Verifie si le processus du jeu est actuellement en cours d'execution.
   * @param {string} pathInstallLocation - Le chemin d'installation du jeu
   * @param {number} [gameId] - Identifiant canonique du jeu (optionnel)
   * @returns {Promise<boolean>} - True si le jeu est deja en cours.
   */
  public static async isGameRunning(pathInstallLocation: string): Promise<boolean> {
    try {
      return await invoke<boolean>('is_game_running', { pathInstallLocation })
    } catch (error) {
      console.error('isGameRunning error : ', error)
      return false
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

      // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifiez si le dossier existe, sinon crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ez-le
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
   * VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifie si le fichier ou le dossier existe
   * @param {string} filePath - Chemin du fichier
   * @returns {Promise<boolean | undefined>} - VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rification de l'existence du fichier ou du dossier
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
   * RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨re les progressions de tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement des jeux sur le systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me de l'utilisateur
   * @param {number} userId - Identifiant de l'utilisateur
   * @returns {Promise<GameProgressDownload[] | undefined>} - Progressions de tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement des jeux
   */
  public static async getGameProgressDownloads(userId: number): Promise<GameProgressDownload[] | undefined> {
    try {
      const filePath: string = 'gameProgressDownload.json'

      // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)

      if (exist) {
        // Si le fichier existe, lire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)

        if (data) {
          const downloads: GameProgressDownload[] = JSON.parse(data) as GameProgressDownload[]

          // Filtrer les tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargements pour l'utilisateur connectÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©
          return downloads.filter((download: GameProgressDownload): boolean => download.userId === userId)
        }
      }
    } catch (error) {
      console.error('Failed to get game progress downloads', error)
    }
  }

  /**
   * Sauvegarde la progression du tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement du jeu dans un fichier JSON,
   * sur le systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me de l'utilisateur
   * @param {GameProgressDownload} gameProgressDownload - Progression du tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement du jeu
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async saveGameProgressDownload(gameProgressDownload: GameProgressDownload): Promise<void> {
    try {
      const filePath: string = 'gameProgressDownload.json'
      let gameProgressDownloads: GameProgressDownload[] = []

      // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        // Si le fichier existe, lire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)
        if (data) gameProgressDownloads = JSON.parse(data)
      }

      // Filtrer les jeux existants pour enlever ceux qui ont le mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªme titre que le nouveau jeu
      gameProgressDownloads = gameProgressDownloads.filter(
        (game: GameProgressDownload): boolean =>
          !(game.gameId === gameProgressDownload.gameId && game.userId === gameProgressDownload.userId),
      )

      // Ajouter le nouveau jeu ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  la liste
      gameProgressDownloads.push({
        userId: gameProgressDownload.userId,
        pathInstallLocation: gameProgressDownload.pathInstallLocation,
        gameId: gameProgressDownload.gameId,
        gameTitle: gameProgressDownload.gameTitle,
        gameVersion: gameProgressDownload.gameVersion,
        totalSizeToDownload: gameProgressDownload.totalSizeToDownload,
        totalDownloadedBytesNow: gameProgressDownload.totalDownloadedBytesNow,
      })

      // ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°crire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es mises ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour dans le fichier
      await TauriService.writeTextFile(filePath, JSON.stringify(gameProgressDownloads))
    } catch (error) {
      console.error('Failed to save game progress download', error)
    }
  }

  /**
   * Supprime la progression du tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement du jeu
   * @param {number} gameId - Identifiant du jeu
   * @param {number} userId - Identifiant de l'utilisateur
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async removeGameProgressDownload(gameId: number, userId: number): Promise<void> {
    try {
      const filePath: string = 'gameProgressDownload.json'
      let gameProgressDownloads: GameProgressDownload[] = []

      // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        // Si le fichier existe, lire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)
        if (data) gameProgressDownloads = JSON.parse(data)
      }

      // Filtrer les jeux existants pour enlever ceux qui ont le mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªme titre que le nouveau jeu
      gameProgressDownloads = gameProgressDownloads.filter(
        (game: GameProgressDownload): boolean => !(game.gameId === gameId && game.userId === userId),
      )

      // ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°crire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es mises ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour dans le fichier
      await TauriService.writeTextFile(filePath, JSON.stringify(gameProgressDownloads))
    } catch (error) {
      console.error('Failed to remove game progress download', error)
    }
  }

  /**
   * Sauvegarde du jeu lorsque le tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement est terminÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©
   * @param {GameInstalled} gameInstalled - Sauvegarde du jeu
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async saveGameInstalled(gameInstalled: GameInstalled): Promise<void> {
    try {
      const filePath: string = 'gamesInstalled.json'
      let gamesInstalled: GameInstalled[] = []

      // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        // Si le fichier existe, lire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)
        if (data) gamesInstalled = JSON.parse(data)
      }

      // Filtrer les jeux existants pour enlever ceux qui ont le mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªme titre que le nouveau jeu
      gamesInstalled = gamesInstalled.filter(
        (game: GameInstalled): boolean =>
          !(game.gameManifest.gameId === gameInstalled.gameManifest.gameId && game.user_id === gameInstalled.user_id),
      )

      // Ajouter le nouveau jeu ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  la liste
      gamesInstalled.push({
        user_id: gameInstalled.user_id,
        gameManifest: gameInstalled.gameManifest,
      })

      // ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°crire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es mises ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour dans le fichier
      await TauriService.writeTextFile(filePath, JSON.stringify(gamesInstalled))
    } catch (error) {
      console.error('Failed to save game', error)
    }
  }

  /**
   * Supprime le jeu installÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© de la liste des jeux installÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s
   * @param {number} gameId - Identifiant du jeu
   * @param {number} [userId] - Identifiant de l'utilisateur
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async removeGameInstalled(gameId: number, userId?: number): Promise<void> {
    try {
      const filePath: string = 'gamesInstalled.json'
      let gamesInstalled: GameInstalled[] = []

      // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        // Si le fichier existe, lire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)
        if (data) gamesInstalled = JSON.parse(data)
      }

      // Filtrer les jeux existants pour enlever ceux qui ont le mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªme titre que le nouveau jeu
      gamesInstalled = gamesInstalled.filter((game: GameInstalled): boolean => {
        if (game.gameManifest.gameId !== gameId) {
          return true
        }

        if (typeof userId === 'number') {
          return game.user_id !== userId
        }

        return true
      })

      // ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°crire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es mises ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour dans le fichier
      await TauriService.writeTextFile(filePath, JSON.stringify(gamesInstalled))
    } catch (error) {
      console.error('Failed to remove game', error)
    }
  }

  /**
   * RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨re les sauvegardes des jeux
   * @param {number} [userId] - Identifiant de l'utilisateur
   * @returns {Promise<GameInstalled[] | undefined>} - Sauvegardes des jeux
   */
  public static async getGamesInstalled(userId?: number): Promise<GameInstalled[] | undefined> {
    try {
      const filePath: string = 'gamesInstalled.json'

      // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)

      if (exist) {
        // Si le fichier existe, lire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es existantes
        const data: string | undefined = await TauriService.readTextFile(filePath)

        if (data) {
          const gamesInstalled: GameInstalled[] = JSON.parse(data) as GameInstalled[]
          if (typeof userId === 'number') {
            return gamesInstalled.filter((game: GameInstalled): boolean => game.user_id === userId)
          }
          return gamesInstalled
        }
      }
    } catch (error) {
      console.error('Failed to save games', error)
    }
  }

  /**
   * Supprime la connexion automatique
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async removeStayLoggedIn(): Promise<void> {
    try {
      const filePath: string = 'stayLoggedIn.json'

      // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si le fichier existe
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
   * Set les identifiants de connexion enregistrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s sur le systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me du joueur
   * @param {Credentials} credentials - Informations d'identification
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async setStayLoggedIn(credentials: Credentials): Promise<void> {
    try {
      const filePath: string = 'stayLoggedIn.json'

      // ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°crire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es dans le fichier
      await TauriService.writeTextFile(filePath, Base64.encode(JSON.stringify(credentials)))
    } catch (error) {
      console.error('setStayLoggedIn error : ', error)
    }
  }

  /**
   * RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨re les identifiants de connexion enregistrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s sur le systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me du joueur
   * @returns {Promise<Credentials | undefined>} - Informations d'identification
   */
  public static async getStayLoggedIn(): Promise<Credentials | undefined> {
    try {
      const filePath: string = 'stayLoggedIn.json'

      // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier si le fichier existe
      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        // Si le fichier existe, lire les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es existantes
        const encodedData: string | undefined = await TauriService.readTextFile(filePath)

        if (encodedData) {
          // DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©coder les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es en base64
          const decodedData: string = Base64.decode(encodedData)

          // Parser les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es JSON
          return JSON.parse(decodedData) as Credentials
        }
      }

      return undefined
    } catch (error) {
      console.error('getStayLoggedIn error: ', error)
    }
  }

  /**
   * Normalise le contenu du fichier statusConnected.json en liste d'entrees par utilisateur.
   * Compatible avec l'ancien format { status: "Online" }.
   * @param {unknown} rawData - Donnees parsees du JSON
   * @param {number} [fallbackUserId] - User courant utilise pour migrer l'ancien format
   * @returns {UserStatusConnectedEntry[]} - Entrees normalisees
   */
  private static normalizeStatusConnectedEntries(
    rawData: unknown,
    fallbackUserId?: number,
  ): UserStatusConnectedEntry[] {
    const validStatusValues: UserConnectedStatus[] = ['Online', 'Unavailable', 'Invisible']

    if (Array.isArray(rawData)) {
      return rawData.filter(
        (item: unknown): item is UserStatusConnectedEntry =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as UserStatusConnectedEntry).userId === 'number' &&
          validStatusValues.includes((item as UserStatusConnectedEntry).status),
      )
    }

    if (
      typeof rawData === 'object' &&
      rawData !== null &&
      validStatusValues.includes((rawData as { status: UserConnectedStatus }).status) &&
      typeof fallbackUserId === 'number'
    ) {
      return [
        {
          userId: fallbackUserId,
          status: (rawData as { status: UserConnectedStatus }).status,
        },
      ]
    }

    return []
  }

  /**
   * Enregistrer le statut de connexion de l'utilisateur dans un fichier
   * @param {UserConnectedStatus} status - Statut de connexion
   * @param {number} userId - Identifiant de l'utilisateur
   * @returns {Promise<void>} - Promesse resolue
   */
  public static async setStatusConnected(status: UserConnectedStatus, userId: number): Promise<void> {
    try {
      const filePath: string = 'statusConnected.json'
      let statusEntries: UserStatusConnectedEntry[] = []

      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        const data: string | undefined = await TauriService.readTextFile(filePath)
        if (data) {
          statusEntries = this.normalizeStatusConnectedEntries(JSON.parse(data), userId)
        }
      }

      statusEntries = statusEntries.filter((entry: UserStatusConnectedEntry): boolean => entry.userId !== userId)
      statusEntries.push({ userId, status })

      await TauriService.writeTextFile(filePath, JSON.stringify(statusEntries))
    } catch (error) {
      console.error('setStatusConnected error : ', error)
    }
  }

  /**
   * Recupere le statut de connexion de l'utilisateur dans un fichier
   * @param {number} userId - Identifiant de l'utilisateur
   * @returns {Promise<UserConnectedStatus | undefined>} - Statut de connexion
   */
  public static async getStatusConnected(userId: number): Promise<UserConnectedStatus | undefined> {
    try {
      const filePath: string = 'statusConnected.json'

      const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
      if (exist) {
        const data: string | undefined = await TauriService.readTextFile(filePath)

        if (data) {
          const statusEntries: UserStatusConnectedEntry[] = this.normalizeStatusConnectedEntries(
            JSON.parse(data),
            userId,
          )
          return statusEntries.find((entry: UserStatusConnectedEntry): boolean => entry.userId === userId)?.status
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
   * @param {number} width - Largeur de la fenetre
   * @param {number} height - Hauteur de la fenetre
   * @returns {Promise<void>} - Promesse resolue
   */
  public static async adjustWindowToLogin(width: number, height: number): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/typedef
    const windowStore = useWindowStore()
    windowStore.setLoading(true)

    const appWindow: Window = new Window('main')

    const newSize: LogicalSize = new LogicalSize(width, height)
    await appWindow.setSize(newSize)
    await appWindow.center()

    await navigateTo('/login')
  }

  /**
   * Recuperer la fenetre actuelle et la redimensionner quand on vient de login vers la page home (carousel)
   * @param {number} width - Largeur de la fenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªtre
   * @param {number} height - Hauteur de la fenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªtre
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async adjustWindowToHome(width: number, height: number): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/typedef
    const windowStore = useWindowStore()
    windowStore.setLoading(true)

    const appWindow: Window = new Window('main')

    const newSize: LogicalSize = new LogicalSize(width, height)
    await appWindow.setSize(newSize)
    await appWindow.setResizable(true)
    await appWindow.setMinSize(new LogicalSize(1042, 660))
    await appWindow.center()

    await navigateTo('/home/carousel')
  }

  /**
   * Recuperer la fenetre actuelle et la redimensionner quand on vient de home vers la page login
   * @param {number} width - Largeur de la fenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªtre
   * @param {number} height - Hauteur de la fenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªtre
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async adjustWindowHomeToLogin(width: number, height: number): Promise<void> {
    useWindowStore().setLoading(true)

    const appWindow: Window = new Window('main')

    const newSize: LogicalSize = new LogicalSize(width, height)
    await appWindow.setSize(newSize)
    await appWindow.setResizable(false)
    await appWindow.center()

    await navigateTo('/login')
  }

  /**
   * Recuperer la fenetre actuelle et la redimensionner quand on vient de home vers la page login
   * @param {number} width - Largeur de la fenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªtre
   * @param {number} height - Hauteur de la fenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªtre
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
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
   * Envoie une notification qui crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e une pop up sur le systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me !
   * @param {string} title - Titre de la notification
   * @param {string} body - Corps de la notification
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async sendNotification(title: string, body: string): Promise<void> {
    try {
      // Avez-vous la permission d'envoyer une notification ?
      let permissionGranted: boolean = await isPermissionGranted()

      // Le cas ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ant on la demande
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
   * TÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©charge le fichier manifest.json du jeu depuis le serveur
   * @param {string} bucketName - Nom du bucket S3
   * @param {string} pathFilename - Chemin du fichier manifest.json
   * @returns {Promise<GameManifestRemote | undefined>} - Fichier manifest.json du jeu cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© serveur ou undefined
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
   * VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifie les fichiers manquants sur le systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me de l'utilisateur
   * @param {string} fileLocationDownload - Emplacement ou les fichiers seront installer sur le pc de l'utilisateur
   * @param {GameManifestLocal} localManifest - Fichier manifest_local.json du jeu cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© client
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
   * Verifie si un dossier contient au moins un fichier (recursif).
   * @param {string} directoryPath - Chemin du dossier a analyser
   * @returns {Promise<boolean>} - True si au moins un fichier est present
   */
  public static async hasAnyFileInDirectory(directoryPath: string): Promise<boolean> {
    try {
      const scanDirectory: (currentPath: string) => Promise<boolean> = async (currentPath: string): Promise<boolean> => {
        const entries = await readDir(currentPath)
        for (const entry of entries) {
          const entryPath: string = await join(currentPath, entry.name)
          if (entry.isFile) {
            return true
          }

          if (entry.isDirectory) {
            const hasAnyFileInSubDirectory: boolean = await scanDirectory(entryPath)
            if (hasAnyFileInSubDirectory) {
              return true
            }
          }
        }

        return false
      }

      return await scanDirectory(directoryPath)
    } catch (error) {
      console.error('hasAnyFileInDirectory error:', error)
      return false
    }
  }

  /**
   * Compare les fichiers locaux et distants pour dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©terminer les fichiers ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©charger
   * @param {GameManifestLocal} localManifest - Fichier manifest_local.json du jeu cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© client
   * @param {GameManifestRemote} remoteManifest - Fichier manifest.json du jeu cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© serveur
   * @param {string} fileLocationDownload - Le chemin du dossier d'installation
   * @returns {FileDetails[]} - Liste des fichiers ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©charger
   */
  public static async getFilesToDownload(
    localManifest: GameManifestLocal,
    remoteManifest: GameManifestRemote,
    fileLocationDownload: string,
  ): Promise<FileDetails[]> {
    // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier les fichiers manquants sur le disque
    const missingFiles: FileDetails[] = await this.getMissingFiles(fileLocationDownload, localManifest)
    logger.debug(`Missing files count: ${missingFiles.length}`)

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
   * Finalise le tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement du jeu en supprimant le jeu des progressions de tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement
   * et en sauvegardant le jeu dans la liste des jeux installÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s sur le systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me de l'utilisateur
   * @param {number} userId - Identifiant de l'utilisateur
   * @param {GameManifestLocal} gameManifest - Fichier manifest.json du jeu cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© client
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async finalizeDownload(userId: number, gameManifest: GameManifestLocal): Promise<void> {
    // Supprimer uniquement la progression du jeu pour l'utilisateur courant,
    // sans effacer les progressions des autres utilisateurs locaux.
    const filePath: string = 'gameProgressDownload.json'
    let allGameProgressDownloads: GameProgressDownload[] = []
    const exist: boolean | undefined = await TauriService.isExistFileOrFolder(filePath)
    if (exist) {
      const data: string | undefined = await TauriService.readTextFile(filePath)
      if (data) {
        allGameProgressDownloads = JSON.parse(data)
      }
    }

    allGameProgressDownloads = allGameProgressDownloads.filter(
      (game: GameProgressDownload): boolean => !(game.gameId === gameManifest.gameId && game.userId === userId),
    )
    await this.writeTextFile(filePath, JSON.stringify(allGameProgressDownloads))
    await this.saveGameInstalled({
      user_id: userId,
      gameManifest: gameManifest,
    })

    await this.sendNotification('CrzGames', `${gameManifest.gameTitle} has been successfully installed`)
  }

  /**
   * Normalise le chemin du fichier en fonction du systÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨me d'exploitation
   * @param {string} path - Chemin d'installation du jeu
   * @returns {Promise<string>} - Chemin normalisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©
   */
  private static normalizePath(path: string): string {
    const separator: string = sep()
    return path.replace(/[/\\]/g, separator)
  }

  /**
   * RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨re le fichier manifest_local.json ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  partir du pathInstallLocation
   * @param {string} pathInstallLocation - Chemin d'installation du jeu
   * @returns {Promise<GameManifestLocal | undefined>} - Le manifeste du jeu ou undefined
   */
  public static async getContentLocalManifest(pathInstallLocation: string): Promise<GameManifestLocal | undefined> {
    try {
      const manifestFileName: string = 'manifest_local.json'
      const normalizedPath: string = this.normalizePath(pathInstallLocation)
      const manifestPath: string = this.normalizePath(`${normalizedPath}${sep()}${manifestFileName}`)

      logger.debug(`Trying to read manifest from path: ${manifestPath}`)

      const manifestExists: boolean = await exists(manifestPath)
      if (!manifestExists) {
        return undefined
      }

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
   * CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e un raccourci sur le bureau pour le jeu installÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©
   * @param {string} pathInstallLocationGame - Chemin d'installation du jeu
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
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
   * Met en pause le tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement du jeu
   * @param {number} gameId - L'ID du jeu
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
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
   * Met en pause plusieurs telechargements en meme temps.
   * @param {number[]} gameIds - Identifiants de jeux a mettre en pause
   * @returns {Promise<void>} - Promesse resolue
   */
  public static async pauseMultipleDownloads(gameIds: number[]): Promise<void> {
    const uniqueGameIds: number[] = [...new Set(gameIds)].filter((gameId: number): boolean => Number.isFinite(gameId))

    await Promise.allSettled(uniqueGameIds.map((gameId: number): Promise<void> => this.pauseDownloadGame(gameId)))
  }

  /**
   * Reprend le tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement du jeu
   * @param {number} gameId - L'ID du jeu
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
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
   * Annule le tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©chargement du jeu
   * @param {number} gameId - L'ID du jeu
   * @param {string} pathInstallLocation - Emplacement d'installation du jeu
   * @param {number} [userId] - Identifiant de l'utilisateur
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async cancelDownloadGame(gameId: number, pathInstallLocation: string, userId?: number): Promise<void> {
    try {
      await invoke('cancel_download', { gameId })
      await TauriService.removeGameInstalled(gameId, userId)
      await this.uninstallGame(pathInstallLocation)
    } catch (error) {
      console.error('cancelDownloadGame error:', error)
    }
  }

  /**
   * DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©sinstalle le jeu
   * @param {string} pathInstallLocation - Le chemin d'installation du jeu
   * @returns {Promise<void>} - Promesse rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©solue
   */
  public static async uninstallGame(pathInstallLocation: string, gameId?: number): Promise<void> {
    try {
      await invoke('uninstall_game', { pathInstallLocation, gameId })
    } catch (error) {
      console.error('uninstallGame error:', error)
      throw error
    }
  }
}
