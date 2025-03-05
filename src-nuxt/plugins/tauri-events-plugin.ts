import { defineNuxtPlugin } from '#app'
import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'

import type GameModel from '#src-common/core/models/GameModel'
import { GameService } from '#src-common/core/services/GameService'

import type { GameManifestLocal, GameProgressDownload } from '#src-core/services/TauriService'
import { TauriService } from '#src-core/services/TauriService'
import { createLogger } from '#src-core/utils/logger'
import type { Logger } from '#src-core/utils/logger'

import { useDownloadsStore } from '#src-nuxt/stores/downloads.store'

/**
 * Instance du logger pour tracer les evenements des events Tauri
 * - Utilise createLogger avec un contexte specifique à "TauriEvents"
 * @type {Logger}
 */
const logger: Logger = createLogger('TauriEvents')

/**
 * Gestionnaire de téléchargements actifs et terminés pour les jeux
 * - Utilise le store 'downloadsStore' pour ajouter, mettre à jour et supprimer les téléchargements actifs et terminés
 * - Utilise les services 'GameService' et 'TauriService' pour récupérer les informations des jeux et les sauvegarder
 */
export default defineNuxtPlugin(async () => {
  let unlistenDownload: UnlistenFn | undefined = undefined
  let unlistenInstall: UnlistenFn | undefined = undefined

  /**
   * Écouter l'événement de progression du téléchargement d'un jeu
   */
  unlistenDownload = await listen('download-game-progress', (event: any) => {
    void handleDownloadProgress(event)
  })

  /**
   * Écouter l'événement d'installation terminée d'un jeu
   */
  unlistenInstall = await listen('game-installation-complete', (event: any) => {
    void handleGameInstallationComplete(event)
  })

  /**
   * Nettoyage des événements quand l'application est détruite
   */
  return {
    provide: {
      /**
       * Arrêter d'écouter les événements Tauri
       * @returns {void}
       */
      unlistenTauriEvents: (): void => {
        unlistenDownload()
        unlistenInstall()
      },
    },
  }
})

/**
 * Gérer la progression du téléchargement
 * @param {any} event - L'événement de progression du téléchargement
 * @returns {Promise<void>}
 */
const handleDownloadProgress: (event: any) => Promise<void> = async (event: any): Promise<void> => {
  if (event.payload) {
    const downloadsStore: any = useDownloadsStore()

    /**
     * On construit l'objet 'GameProgressDownload' pour l'utiliser dans la méthode 'saveGameProgressDownload' en-dessous
     * pour sauvegarder la progression du téléchargement sur le système de l'utilisateur
     */
    const gameProgressDownload: GameProgressDownload = {
      userId: event.payload.userId,
      gameId: event.payload.gameId,
      gameTitle: event.payload.gameTitle,
      pathInstallLocation: event.payload.pathInstallLocation,
      totalSizeToDownload: event.payload.totalSizeToDownload,
      gameVersion: event.payload.gameVersion,
    }

    /**
     * On construit l'objet 'ActiveDownloadGame' pour le stocker dans le store 'downloadsStore'
     * utiliser en-dessous pour ajouter au "téléchargements actifs" (en cours de téléchargement)
     */
    const game: GameModel = await GameService.getGameById(event.payload.gameId)
    const activeDownloadGame: ActiveDownloadGame = {
      pathInstallLocation: event.payload.pathInstallLocation,
      gameId: event.payload.gameId,
      gameTitle: event.payload.gameTitle,
      gamePictureUrl: game.pictureFile.url,
      isPlaying: true,
      progress: event.payload.progress,
      totalDownloadedBytesNow: event.payload.totalDownloaded,
      totalSizeToDownload: event.payload.totalSizeToDownload,
      gameBinarySize: event.payload.gameBinarySize,
      speed: event.payload.speed,
      remainingTime: '',
    }

    /**
     * Log
     * Afficher la vitesse de téléchargement et la progression du téléchargement
     */
    const speed: any = event.payload.speed
    const progress: any = (event.payload.totalDownloaded / event.payload.gameBinarySize) * 100
    logger.debug(`Download Speed: ${speed.toFixed(2)} bytes/sec, Progress: ${progress.toFixed(2)}%`)

    /**
     * La première fois que l'on reçoit un événement de progression de téléchargement, donc depuis cette méthode
     * on ajoute le téléchargement actif dans le store, par rapport au jeu via son 'gameId'
     * Dans la méthode 'addActiveDownload' du store, on vérifie si le jeu est déjà dans le tableau
     * des téléchargements actifs, si oui on le remplace, sinon on l'ajoute
     */
    downloadsStore.addActiveDownload(activeDownloadGame)

    /**
     * On met à jour la progression du téléchargement dans le store, par rapport au jeu via son 'gameId'
     * Permet d'afficher la progression du téléchargement dans l'interface utilisateur de la page "Download Manager"
     */
    downloadsStore.updateDownloadProgress(
      gameProgressDownload.gameId,
      event.payload.totalDownloaded,
      event.payload.speed,
      event.payload.gameBinarySize,
    )

    /**
     * On sauvegarde la progression du téléchargement sur le système de l'utilisateur
     * pour pouvoir reprendre le téléchargement en cas de coupure de connexion, pc éteint, etc.
     */
    await TauriService.saveGameProgressDownload(gameProgressDownload)
  }
}

/**
 * Gérer l'événement de fin d'installation d'un jeu
 * @param {any} event - L'événement de fin d'installation du jeu
 * @returns {Promise<void>}
 */
const handleGameInstallationComplete: (event: any) => Promise<void> = async (event: any): Promise<void> => {
  if (event.payload) {
    const downloadsStore: any = useDownloadsStore()

    /**
     * Log
     * Afficher le jeu téléchargé et installé avec succès
     */
    logger.info('Game downloaded and installed successfully:' + JSON.stringify(event.payload))

    /**
     * On construit l'objet 'GameManifestLocal' pour l'utiliser dans la méthode 'finalizeDownload' en-dessous
     * pour finaliser le téléchargement du jeu sur le système de l'utilisateur
     * et pour l'ajouter dans les téléchargements terminés
     */
    const gameManifest: GameManifestLocal = {
      pathInstallLocation: event.payload.fileLocationDownload,
      gameId: event.payload.gameId,
      gameTitle: event.payload.gameTitle,
      gameBinarySize: event.payload.gameBinarySize,
      version: event.payload.gameVersion,
      files: [],
    }

    /**
     * On appel une dernière fois pour mettre à jour la progression du téléchargement à 100%
     */
    downloadsStore.updateDownloadProgress(
      event.payload.gameId,
      event.payload.gameBinarySize,
      0,
      event.payload.gameBinarySize,
    )

    /**
     * Finalise le téléchargement du jeu en supprimant le jeu des "progressions de téléchargement" sur
     * le système de l'utilisateur
     * Et en sauvegardant le jeu dans la liste des jeux installés sur le système de l'utilisateur
     */
    await TauriService.finalizeDownload(event.payload.userId, gameManifest)

    /**
     * On ajoute le jeu dans les téléchargements terminés pour pouvoir le retrouver dans la page "Download Manager"
     * et on le retire des téléchargements actifs
     */
    await downloadsStore.addCompleteDownload(gameManifest.gameId)
  }
}
