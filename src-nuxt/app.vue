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
import { enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { onBeforeUnmount, onMounted } from 'vue'

import CrzSpinner from '#src-common/components/loaders/CrzSpinner.vue'

import { useWindowStore } from '#src-nuxt/stores/window.store'

const unlistenTauriEvents: () => void = useNuxtApp().$unlistenTauriEvents

/* STORES */
const windowStore: any = useWindowStore()

/* HOOKS */
/**
 * On mounted
 * @returns {Promise<void>}
 */
onMounted(async (): Promise<void> => {
  await checkAndEnableAutostart()
  disabledContextMeuRightClick()
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
  if (import.meta.env.VITE_NODE_ENV === 'development') {
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
