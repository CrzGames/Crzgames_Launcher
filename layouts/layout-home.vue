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
import { useAppStore } from '@/stores/app.store'
import SideBarRight from '@/components/navigations/SideBarRight.vue'
import SideBarLeft from '@/components/navigations/SideBarLeft.vue'
import WindowBar from '@/components/window-bar/WindowBar.vue'
import CrzSpinner from '~/common/components/loaders/CrzSpinner.vue'
</script>
