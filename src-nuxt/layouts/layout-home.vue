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
        <div v-if="useAppStore().pending" class="absolute left-1/2 top-1/2">
          <CrzSpinner />
        </div>

        <div v-show="!useAppStore().pending">
          <RouterView />
        </div>
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
