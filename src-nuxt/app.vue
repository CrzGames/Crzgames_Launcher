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

const { $unlistenTauriEvents } = useNuxtApp()

/* STORES */
const windowStore: any = useWindowStore()

/* CYCLE - HOOKS */
/**
 * On mounted
 * @returns {Promise<void>}
 */
onMounted(async (): Promise<void> => {
  await checkAndEnableAutostart()
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
  $unlistenTauriEvents()
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
