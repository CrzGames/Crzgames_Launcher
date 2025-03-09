<template>
  <main class="flex flex-col items-center justify-center min-h-screen bg-[#1b1e2f] text-white px-4">
    <!-- Icône "pas de wifi" -->
    <CrzIcon name="wifi-off" mode="stroke" color="red" class="w-16 h-16 mb-4" />

    <!-- Titre et texte mis à jour -->
    <h2 class="text-xl font-semibold mb-2 text-center">No Internet Connection</h2>
    <p class="text-center max-w-md">
      It seems you no longer have an Internet connection. Check your network, or restart the application to try again.
    </p>

    <!-- Bouton pour redémarrer l'application -->
    <CrzButton @click="restartApp" class="mt-6"> Restart Application </CrzButton>
  </main>
</template>

<script lang="ts" setup>
import { relaunch } from '@tauri-apps/plugin-process'

import CrzButton from '#src-common/components/buttons/CrzButton.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'

/**
 * Permet de redémarrer l'application, si l'utilisateur clique sur le bouton correspondant.
 * @returns {Promise<void>}
 */
const restartApp: () => Promise<void> = async (): Promise<void> => {
  try {
    await relaunch()
  } catch (error: any) {
    console.error('Erreur lors du redémarrage de l’application :', error)
  }
}
</script>
