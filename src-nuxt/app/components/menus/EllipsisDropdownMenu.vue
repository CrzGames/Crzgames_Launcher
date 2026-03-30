<template>
  <div class="absolute bottom-2 right-[5.5rem] z-30" ref="dropdown">
    <button
      type="button"
      class="flex h-8 w-8 translate-y-0 transform items-center justify-center rounded-md border border-blue-900 bg-amber-400 pb-[2px] text-xl leading-none text-gray-900 duration-100 hover:bg-amber-500 active:translate-y-1"
      title="Other actions"
      aria-label="Other actions"
      @click="toggleMenu"
    >
      ...
    </button>
    <transition name="fade">
      <div
        v-if="isOpen"
        class="absolute left-0 top-full z-40 mt-2 w-45 rounded-lg border border-[#3a3a3c] bg-[#1c1c1e] p-2 shadow-lg"
      >
        <ul class="py-1">
          <li
            @click="createDesktopShortcut"
            class="cursor-pointer whitespace-nowrap px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
          >
            Create a desktop shortcut
          </li>
          <!-- Add more options here -->
          <li
            @click="uninstallGame"
            class="cursor-pointer whitespace-nowrap px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
          >
            Uninstall the game
          </li>
          <li
            v-if="isForceUpdateActionVisible"
            @click="forceUpdateGame"
            class="cursor-pointer whitespace-nowrap px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
          >
            Force update check
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Ref } from 'vue'

/* REFS */
const isOpen: Ref<boolean> = ref(false)
const dropdown: Ref<HTMLElement | null> = ref(null)

/* EMITS */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  createDesktopShortcut: []
  uninstallGame: []
  forceUpdateGame: []
}>()

const isForceUpdateActionVisible: boolean =
  import.meta.env.VITE_NODE_ENV === 'development' || import.meta.env.VITE_NODE_ENV === 'staging'

/* METHODS */
/**
 * Open or close the dropdown menu
 * @returns {void}
 */
const toggleMenu: () => void = (): void => {
  isOpen.value = !isOpen.value
}

/**
 * Close the menu if clicked outside
 * @param {MouseEvent} event - The mouse event
 */
const handleClickOutside: (event: MouseEvent) => void = (event: MouseEvent): void => {
  if (dropdown.value && !dropdown.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

/**
 * Create a desktop shortcut
 * @returns {void}
 */
const createDesktopShortcut: () => void = (): void => {
  emit('createDesktopShortcut')
  isOpen.value = false // Close the menu
}

/**
 * Uninstall the game
 * @returns {void}
 */
const uninstallGame: () => void = (): void => {
  emit('uninstallGame')
  isOpen.value = false // Close the menu
}

/**
 * Force update check against remote manifest
 * @returns {void}
 */
const forceUpdateGame: () => void = (): void => {
  emit('forceUpdateGame')
  isOpen.value = false // Close the menu
}
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
