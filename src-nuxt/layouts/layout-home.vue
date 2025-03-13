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

    <main class="flex h-full flex-1 overflow-hidden">
      <SideBarLeft class="h-full" />

      <div
        class="flex-grow overflow-x-hidden transition-all duration-300"
        :class="{
          'overflow-y-auto': !isCarouselPage,
          'overflow-y-hidden': isCarouselPage,
          'ml-[80px] mr-[80px]': windowWidth < 1125,
          'ml-[256px] mr-[80px]': windowWidth >= 1125 && windowWidth < 1448,
          'ml-[256px] mr-[256px]': windowWidth >= 1448,
        }"
      >
        <!-- Page Nuxt en cours -->
        <NuxtPage />
      </div>

      <SideBarRight class="h-full" />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router'

import SideBarLeft from '#src-nuxt/components/navigations/SideBarLeft.vue'
import SideBarRight from '#src-nuxt/components/navigations/SideBarRight.vue'
import WindowBar from '#src-nuxt/components/window-bar/WindowBar.vue'

/* DATA */
const route: RouteLocationNormalizedLoadedGeneric = useRoute()

/* REFS */
const windowWidth: Ref<number> = ref(window.innerWidth)
const isCarouselPage: Ref<boolean> = ref(route.path.includes('/home/carousel'))

/* LIFECYCLE HOOKS */
onMounted((): void => {
  // Mettre à jour la largeur initiale
  windowWidth.value = window.innerWidth

  // Ajouter un écouteur pour les redimensionnements
  window.addEventListener('resize', handleResize)
})

onUnmounted((): void => {
  // Nettoyer l'écouteur pour éviter les fuites de mémoire
  window.removeEventListener('resize', handleResize)
})

watch(
  (): string => route.path,
  (newPath: string): void => {
    // Mettre à jour la page actuelle pour savoir si c'est une page de carrousel, pour enlever le scroll vertical
    isCarouselPage.value = newPath.includes('/home/carousel')
  },
)

/* METHODS */
/**
 * Gérer le redimensionnement de la fenêtre
 * @returns {void}
 */
const handleResize: () => void = (): void => {
  windowWidth.value = window.innerWidth
}
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
