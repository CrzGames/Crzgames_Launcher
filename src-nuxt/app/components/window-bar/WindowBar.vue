<template>
  <div class="flex h-9 select-none items-center justify-between bg-black text-center relative" data-tauri-drag-region>
    <!-- Fake div pour équilibrer l'espace à gauche -->
    <div class="w-[96px]"></div>

    <!-- Texte CrzGames parfaitement centré -->
    <div
      class="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center h-full"
      data-tauri-drag-region
    >
      <slot></slot>
    </div>

    <!-- Boutons de la barre window de l'application -->
    <div class="flex h-full items-center space-x-1 flex-shrink-0">
      <!-- Bouton de minimisation -->
      <div
        @click="btnMinimizeWindow"
        class="titlebar-button flex h-full w-8 items-center justify-center hover:bg-gray-800"
        id="titlebar-minimize"
      >
        <CrzIcon name="title-bar-minimize" color="#85868a" mode="stroke" :width="17" :height="17" />
      </div>

      <!-- Bouton de maximisation -->
      <div
        v-if="route.path !== '/login'"
        @click="btnMaximizeWindow"
        class="titlebar-button flex h-full w-8 items-center justify-center hover:bg-gray-800"
        id="titlebar-maximize"
      >
        <CrzIcon name="title-bar-maximize" color="#85868a" mode="stroke" :width="13" :height="13" />
      </div>

      <!-- Bouton de fermeture de la fenêtre -->
      <div
        @click="btnCloseWindow"
        class="titlebar-button ml-1 flex h-full w-8 items-center justify-center hover:bg-gray-800"
        id="titlebar-close"
      >
        <CrzIcon name="title-bar-close" color="#85868a" mode="stroke" :width="17" :height="17" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Window } from '@tauri-apps/api/window'
import { useRoute } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import CrzIcon from '#src-common/components/ui/CrzIcon.vue'

const appWindow: Window = new Window('main')
const route: RouteLocationNormalizedLoaded = useRoute()

/**
 * Minimize the window.
 * @returns {Promise<void>}
 */
const btnMinimizeWindow: () => Promise<void> = (): Promise<void> => appWindow.minimize()
/**
 * Maximize the window.
 * @returns {Promise<void>}
 */
const btnMaximizeWindow: () => Promise<void> = (): Promise<void> => appWindow.toggleMaximize()
/**
 * Close the window.
 * @returns {Promise<void>}
 */
const btnCloseWindow: () => Promise<void> = (): Promise<void> => appWindow.hide()
</script>

<style lang="scss" scoped>
#titlebar-minimize:hover svg,
#titlebar-close:hover svg {
  stroke: #ffff;
}
</style>
