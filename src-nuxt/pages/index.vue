<template>
  <main class="relative">
    <CrzLogo2 />

    <div class="relative flex h-full flex-col items-center justify-center" style="margin-top: -100px">
      <AutoUpdateLoader />
      <p class="mt-8 text-center font-sans text-lg text-white">{{ updateStatus }}</p>
      <p class="mt-2 text-center font-sans text-lg text-white">{{ updateStatusDownload }}</p>
    </div>
  </main>
</template>

<script lang="ts" setup>
import CrzLogo2 from '#src-common/components/ui/CrzLogo2.vue'
import { TauriService } from '#src-core/services/TauriService'
import AutoUpdateLoader from '#src-nuxt/components/loaders/AutoUpdateLoader.vue'
import { relaunch } from '@tauri-apps/plugin-process'
import type { DownloadEvent, Update } from '@tauri-apps/plugin-updater'
import { check } from '@tauri-apps/plugin-updater'
import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'

/* REFS */
const updateStatus: Ref<string> = ref('Check for update...')
const updateStatusDownload: Ref<string> = ref('')

/* DATA */
// eslint-disable-next-line eslint-plugin-unused-imports/no-unused-vars
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
      updateStatus.value = `Update v${update.version} found.`

      await update.downloadAndInstall((downloadEvent: DownloadEvent): void => {
        if (downloadEvent.event === 'Started') {
          updateStatusDownload.value = 'Download started...'
          contentLengthUpdate = downloadEvent.data.contentLength
        } else if (downloadEvent.event === 'Progress') {
          if (contentLengthUpdate) {
            const totalDownloaded: number = downloadEvent.data.chunkLength
            const progressPercentage: number = (totalDownloaded / contentLengthUpdate) * 100
            updateStatusDownload.value = `Download progress: ${progressPercentage.toFixed(2)}%`
          }
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (downloadEvent.event === 'Finished') {
          updateStatusDownload.value = 'Download completed.'
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
