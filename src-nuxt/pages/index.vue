<template>
  <main class="relative">
    <CrzLogo2 />

    <div class="relative flex h-full flex-col items-center justify-center">
      <!-- Loader de mise à jour automatique -->
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

/* REFS */
const updateStatus: Ref<string> = ref('Check for update...')
const updateStatusDownload: Ref<string> = ref('')
const downloadProgress: Ref<number> = ref(0)
const updateAvailable: Ref<boolean> = ref(false) // Indique si une MAJ est disponible

/* DATA */
// Taille total de la mise à jour qui à était trouvé
let contentLengthUpdate: number | undefined = undefined

/* METHODS */
/**
 * Check for updates and update the launcher if available.
 * @returns {Promise<void>}
 */
const autoUpdateLauncher: () => Promise<void> = async (): Promise<void> => {
  // ByPass auto update in development mode
  if (import.meta.env.VITE_NODE_ENV === 'development') {
    try {
      await TauriService.adjustWindowToLogin(400, 585)
    } catch (error) {
      console.error('autoUpdateLauncher error:', error)
    }

    return
  }

  try {
    const update: Update | null = await check()

    if (update?.available) {
      updateAvailable.value = true
      updateStatus.value = `Update v${update.version} found.`

      await update.downloadAndInstall((downloadEvent: DownloadEvent): void => {
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

      await relaunch()
    } else {
      updateStatus.value = 'Launcher already up to date.'
    }

    // Adjust window size and navigate to login page
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
onMounted((): void => {
  autoUpdateLauncher()
})
</script>
