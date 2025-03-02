<template>
  <div class="flex h-screen flex-col bg-blue-800">
    <WindowBar>
      <span
        data-tauri-drag-region
        class="flex h-full w-full items-center justify-center font-serif font-semibold text-white"
      >
        CrzGames
      </span>
    </WindowBar>

    <main class="flex h-full flex-1">
      <SideBarLeft />

      <div class="mx-[80px] flex-grow overflow-y-auto">
        <!-- Loader à l'intérieur de la page si une requête est en cours -->
        <div v-if="useAppStore().pending" class="absolute left-1/2 top-1/2">
          <CrzSpinner />
        </div>

        <!-- Page Nuxt en cours -->
        <NuxtPage v-show="!useAppStore().pending" />
      </div>

      <SideBarRight />
    </main>
  </div>
</template>

<script lang="ts" setup>
import CrzSpinner from '#src-common/components/loaders/CrzSpinner.vue'

import SideBarLeft from '#src-nuxt/components/navigations/SideBarLeft.vue'
import SideBarRight from '#src-nuxt/components/navigations/SideBarRight.vue'
import WindowBar from '#src-nuxt/components/window-bar/WindowBar.vue'
import { useAppStore } from '#src-nuxt/stores/app.store'
</script>

<style lang="scss">
/* Transition de page avec fondu + zoom */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s ease-in-out;
}
.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* Transition de mise en page avec glissement vers le haut */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s ease-in-out;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(50px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-50px);
}
</style>
