import { defineNuxtPlugin } from '#app'
import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'

import type GameModel from '#src-common/core/models/GameModel'
import { GameService } from '#src-common/core/services/GameService'

import type { GameManifestLocal, GameProgressDownload } from '#src-core/services/TauriService'
import { TauriService } from '#src-core/services/TauriService'

import { useDownloadsStore } from '#src-nuxt/stores/downloads.store'

export default defineNuxtPlugin(async () => {
  let unlistenDownload: UnlistenFn | undefined = undefined
  let unlistenInstall: UnlistenFn | undefined = undefined

  /**
   * Écouter l'événement de progression du téléchargement
   */
  unlistenDownload = await listen('download-game-progress', (event: any) => {
    void handleDownloadProgress(event)
  })

  /**
   * Écouter l'événement d'installation terminée
   */
  unlistenInstall = await listen('game-installation-complete', (event: any) => {
    void handleGameInstallationComplete(event)
  })

  console.log('✅ Tauri events listener registered')

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

    const gameProgressDownload: GameProgressDownload = {
      userId: event.payload.userId,
      gameId: event.payload.gameId,
      gameTitle: event.payload.gameTitle,
      pathInstallLocation: event.payload.pathInstallLocation,
      totalSizeToDownload: event.payload.totalSizeToDownload,
      gameVersion: event.payload.gameVersion,
    }

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

    // Log a viré a terme
    const speed: any = event.payload.speed
    const progress: any = (event.payload.totalDownloaded / event.payload.gameBinarySize) * 100
    console.log(`Download Speed: ${speed.toFixed(2)} bytes/sec, Progress: ${progress.toFixed(2)}%`)

    // On ajoute le jeu dans les téléchargements actifs (en cours)
    downloadsStore.addActiveDownload(activeDownloadGame)

    // On met à jour la progression du téléchargement
    downloadsStore.updateDownloadProgress(
      gameProgressDownload.gameId,
      event.payload.totalDownloaded,
      event.payload.speed,
      event.payload.gameBinarySize,
    )

    // On sauvegarde la progression du téléchargement
    await TauriService.saveGameProgressDownload(gameProgressDownload)
  }
}

/**
 * Gérer l'événement de fin d'installation du jeu
 * @param {any} event - L'événement de fin d'installation du jeu
 * @returns {Promise<void>}
 */
const handleGameInstallationComplete: (event: any) => Promise<void> = async (event: any): Promise<void> => {
  if (event.payload) {
    const downloadsStore: any = useDownloadsStore()

    console.log('GAME DOWNLOAD SUCCESS and game is : ' + JSON.stringify(event.payload))

    const gameManifest: GameManifestLocal = {
      pathInstallLocation: event.payload.fileLocationDownload,
      gameId: event.payload.gameId,
      gameTitle: event.payload.gameTitle,
      gameBinarySize: event.payload.gameBinarySize,
      version: event.payload.gameVersion,
      files: [],
    }

    // On appel une dernière fois pour mettre à jour la progression à 100%
    downloadsStore.updateDownloadProgress(
      event.payload.gameId,
      event.payload.gameBinarySize,
      0,
      event.payload.gameBinarySize,
    )

    // On finalise le téléchargement
    await TauriService.finalizeDownload(event.payload.userId, gameManifest)

    // On ajoute le jeu dans les téléchargements terminés
    await downloadsStore.addCompleteDownload(gameManifest.gameId)
  }
}
