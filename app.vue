<template>
  <div>
    <!-- Layout et pages de Nuxt -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'
import { enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { email } from '@vee-validate/rules'
import { defineRule } from 'vee-validate'
import { onBeforeUnmount, onMounted } from 'vue'

import type GameModel from '#src-common/core/models/GameModel'
import { GameService } from '#src-common/core/services/GameService'

import { TauriService } from '#src-core/services/TauriService'
import type { GameManifestLocal, GameProgressDownload } from '#src-core/services/TauriService'

import { useDownloadsStore } from '#src-nuxt/stores/downloads.store'
import type { ActiveDownloadGame } from '#src-nuxt/stores/downloads.store'

// define global rules
defineRule('email', email)

/* STORES */
const downloadsStore = useDownloadsStore()

/* DATA */
let unlisten: UnlistenFn | undefined = undefined
let unlisten2: UnlistenFn | undefined = undefined

/* CYCLE - HOOKS */
/**
 * On mounted
 * @returns {Promise<void>}
 */
onMounted(async (): Promise<void> => {
  // On vérifie si l'application est en autostart
  if (!(await isEnabled())) {
    await enable()
  }

  /**
   * Obligatoire de mettre dans app.vue pour écouter globalement les événements
   */
  unlisten = await listen('download-game-progress', async (event: any): Promise<void> => {
    if (event.payload) {
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
      const speed = event.payload.speed
      const progress = (event.payload.totalDownloaded / event.payload.gameBinarySize) * 100
      console.log(`Download Speed: ${speed.toFixed(2)} bytes/sec, Progress: ${progress.toFixed(2)}%`)

      // On ajoute le jeu dans les téléchargements actifs (en cours)
      downloadsStore.addActiveDownload(activeDownloadGame)

      // On met à jour la progression du téléchargement
      downloadsStore.updateDownloadProgress(
        gameProgressDownload.gameId,
        event.payload.totalDownloaded,
        speed,
        event.payload.gameBinarySize,
      )

      // On sauvegarde la progression du téléchargement
      await TauriService.saveGameProgressDownload(gameProgressDownload)
    }
  })

  /**
   * Obligatoire de mettre dans app.vue pour écouter globalement les événements
   */
  unlisten2 = await listen('game-installation-complete', async (event: any): Promise<void> => {
    if (event.payload) {
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
  })

  console.log('App.vue : mounted')
})

/**
 * On before unmount
 * @returns {void}
 */
onBeforeUnmount((): void => {
  if (unlisten) {
    unlisten()
  }

  if (unlisten2) {
    unlisten2()
  }
})
</script>
