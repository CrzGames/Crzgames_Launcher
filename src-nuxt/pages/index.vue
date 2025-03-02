<template>
  <main class="relative">
    <!-- Spinner affiché lorsque isLoading est vrai (changement de fenetre window) -->
    <div v-if="windowStore.isLoading" class="spinner-overlay bg-blue-800">
      <CrzSpinner />
    </div>

    <!-- Logo CrzGames -->
    <CrzLogo2 />

    <div class="relative flex h-full flex-col items-center justify-center">
      <!-- Loader -->
      <AutoUpdateLoader />

      <!-- Affichage du statut de la mise à jour -->
      <p class="mt-4 text-center font-sans text-lg text-white">{{ updateStatus }}</p>

      <!-- Affichage de la barre de progression uniquement si une mise à jour est en cours -->
      <div v-if="updateAvailable" class="w-64 h-3 bg-gray-700 rounded-full overflow-hidden mt-4">
        <div class="h-full bg-blue-500 transition-all duration-200" :style="{ width: downloadProgress + '%' }"></div>
      </div>

      <!-- Affichage du statut de téléchargement uniquement si une mise à jour est en cours -->
      <p class="mt-4 text-center font-sans text-white">{{ updateStatusDownload }}</p>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { relaunch } from '@tauri-apps/plugin-process'
import type { DownloadEvent, Update } from '@tauri-apps/plugin-updater'
import { check } from '@tauri-apps/plugin-updater'
import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'

import CrzLogo2 from '#src-common/components/ui/CrzLogo2.vue'

import { TauriService } from '#src-core/services/TauriService'

import AutoUpdateLoader from '#src-nuxt/components/loaders/AutoUpdateLoader.vue'

/* STORE */
const windowStore: any = useWindowStore()

/* REFS */
/**
 * Le statut de la mise à jour.
 * @type {Ref<string>}
 */
const updateStatus: Ref<string> = ref('Check for update...')

/**
 * Le statut du téléchargement de la mise à jour.
 * @type {Ref<string>}
 */
const updateStatusDownload: Ref<string> = ref('')

/**
 * La progression du téléchargement de la mise à jour en pourcentage (0-100).
 * @type {Ref<number>}
 */
const downloadProgress: Ref<number> = ref(0)

/**
 * Indique si une mise à jour est disponible.
 * @type {Ref<boolean>}
 */
const updateAvailable: Ref<boolean> = ref(false)

/* DATA */
/**
 * La taille du contenu de la mise à jour.
 * @type {number | undefined}
 */
let contentLengthUpdate: number | undefined = undefined

/* METHODS */
/**
 * Check si une mise à jour est disponible et la télécharge et l'installe si c'est le cas.
 * @returns {Promise<void>}
 */
const autoUpdateLauncher: () => Promise<void> = async (): Promise<void> => {
  /**
   * Si l'application est en mode développement, on bypass la vérification de mise à jour.
   * On ajuste la taille de la fenêtre de l'application pour la page de connexion et
   * on va sur la page de connexion.
   */
  if (import.meta.env.VITE_NODE_ENV === 'development') {
    try {
      await TauriService.adjustWindowToLogin(400, 585)
    } catch (error) {
      console.error('autoUpdateLauncher error:', error)
    }

    return
  }

  try {
    /**
     * On vérifie si une mise à jour est disponible.
     */
    const update: Update | null = await check()

    /**
     * Si une mise à jour est disponible, on télécharge et on installe la mise à jour, puis on relance l'application.
     * Sinon, on affiche un message indiquant que le launcher est déjà à jour et on redirige l'utilisateur sur la page de connexion.
     */
    if (update?.available) {
      updateAvailable.value = true
      updateStatus.value = `Update v${update.version} found.`

      /**
       * On télécharge et on installe la mise à jour.
       */
      await update.downloadAndInstall((downloadEvent: DownloadEvent): void => {
        /**
         * STARTED: Le téléchargement de la mise à jour à commencé
         * PROGRESS: Le téléchargement de la mise à jour est en cours
         * FINISHED: Le téléchargement de la mise à jour est terminé
         */
        if (downloadEvent.event === 'Started') {
          updateStatusDownload.value = 'Download started...'
          contentLengthUpdate = downloadEvent.data.contentLength
          downloadProgress.value = 0
        } else if (downloadEvent.event === 'Progress') {
          if (contentLengthUpdate) {
            const totalDownloaded: number = downloadEvent.data.chunkLength
            const progressPercentage: number = (totalDownloaded / contentLengthUpdate) * 100
            updateStatusDownload.value = `Download progress: ${progressPercentage.toFixed(2)}%`
            downloadProgress.value = Math.min(progressPercentage, 100)
          }
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (downloadEvent.event === 'Finished') {
          updateStatusDownload.value = 'Download completed.'
          downloadProgress.value = 100
        }
      })

      /**
       * On relance l'application pour appliquer la mise à jour.
       */
      await relaunch()
    } else {
      updateStatus.value = 'Launcher already up to date.'
    }

    /**
     * On ajuste la taille de la fenêtre de l'application pour la page de connexion
     * après la mise à jour du launcher et on redirige l'utilisateur sur la page de connexion.
     */
    await TauriService.adjustWindowToLogin(400, 585)
  } catch (error) {
    console.error('Update error:', error)
    updateStatus.value = 'Error checking for updates.'
  }
}

/* HOOKS */
/**
 * Lifecycle hook: mounted
 * @returns {void}
 */
onMounted(async (): Promise<void> => {
  await autoUpdateLauncher()
})
</script>

<style lang="scss" scoped>
/* Spinner de chargement entre les fenetre window */
.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999999;
}
</style>