<template>
  <div>
    <!-- Spinner affiché lorsque isLoading est vrai (changement de fenetre window) -->
    <div v-if="windowStore.isLoading" class="spinner-overlay bg-blue-800">
      <CrzSpinner />
    </div>

    <!-- Layout et pages de Nuxt -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
import type { UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { CloseRequestedEvent, Window as TauriWindow } from '@tauri-apps/api/window'
import { enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { onBeforeUnmount, onMounted } from 'vue'

import CrzSpinner from '#src-common/components/loaders/CrzSpinner.vue'

import { useAuthStore } from '#src-nuxt/app/stores/auth.store'
import { useWindowStore } from '#src-nuxt/app/stores/window.store'

const unlistenTauriEvents: () => void = useNuxtApp().$unlistenTauriEvents

/* STORES */
const windowStore: any = useWindowStore()
const authStore: ReturnType<typeof useAuthStore> = useAuthStore()
let unlistenWindowCloseRequested: UnlistenFn | null = null
let isClosingWindowInProgress: boolean = false

/* HOOKS */
/**
 * On mounted
 * @returns {Promise<void>}
 */
onMounted(async (): Promise<void> => {
  await checkAndEnableAutostart()
  disabledContextMeuRightClick()
  await registerCloseRequestedPauseHandler()
})

/**
 * On before unmount
 * @returns {void}
 */
onBeforeUnmount(() => {
  /**
   * On arrête d'écouter les événements Tauri lorsqu'on quitte l'application.
   * Cela permet de ne pas avoir de fuites mémoires.
   */
  unlistenTauriEvents()

  if (unlistenWindowCloseRequested) {
    unlistenWindowCloseRequested()
    unlistenWindowCloseRequested = null
  }
})

/* METHODS */
/**
 * On vérifie si l'application est en autostart, c'est à dire si elle
 * se lance automatiquement au démarrage de l'ordinateur.
 * Si ce n'est pas le cas, on l'active.
 * @returns {Promise<void>}
 */
const checkAndEnableAutostart: () => Promise<void> = async (): Promise<void> => {
  try {
    if (!(await isEnabled())) {
      await enable()
    }
  } catch (error: any) {
    console.error('checkAndEnableAutostart Erreur lors de activation de autostart', error)
  }
}

/**
 * Désactiver le menu contextuel du clic droit de la souris sur l'application.
 * Donc recharger, ouvrir la console, etc.
 * @returns {void}
 */
const disabledContextMeuRightClick: () => void = (): void => {
  if (import.meta.env.VITE_NODE_ENV === 'development' || import.meta.env.VITE_NODE_ENV === 'staging') {
    return
  }

  document.addEventListener(
    'contextmenu',
    (e: MouseEvent): boolean => {
      e.preventDefault()
      return false
    },
    { capture: true },
  )
}

/**
 * Intercepte la fermeture de fenetre pour mettre les telechargements en pause.
 * @returns {Promise<void>}
 */
const registerCloseRequestedPauseHandler: () => Promise<void> = async (): Promise<void> => {
  try {
    const appWindow: TauriWindow = getCurrentWindow()
    unlistenWindowCloseRequested = await appWindow.onCloseRequested(
      async (event: CloseRequestedEvent): Promise<void> => {
        if (isClosingWindowInProgress) {
          return
        }

        event.preventDefault()
        isClosingWindowInProgress = true

        try {
          await authStore.pauseCurrentUserActiveDownloads()
        } finally {
          await appWindow.close()
        }
      },
    )
  } catch (error: any) {
    console.error('registerCloseRequestedPauseHandler error:', error)
  }
}
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
