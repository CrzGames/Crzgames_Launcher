<template>
  <div class="relative" ref="dropdown">
    <CrzSquareIconButton
      class="absolute bottom-1.5 right-2 border border-blue-900"
      tooltip="Other actions"
      variant="primary"
      iconMode="fill"
      iconName="ellipsis"
      @click="toggleMenu"
    />
    <transition name="fade">
      <div v-if="isOpen" class="dropdown-menu w-55 absolute right-0 z-20 mt-2 rounded-lg bg-gray-800 shadow-lg">
        <ul class="py-1">
          <li
            @click="createDesktopShortcut"
            class="cursor-pointer whitespace-nowrap px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            Create a desktop shortcut
          </li>
          <!-- Add more options here -->
          <li
            @click="uninstallGame"
            class="cursor-pointer whitespace-nowrap px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            Uninstall the game
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import CrzSquareIconButton from '#src-common/components/buttons/CrzSquareIconButton.vue'
import type { Ref } from 'vue'

/* REFS */
const isOpen: Ref<boolean> = ref(false)
const dropdown: Ref<HTMLElement | null> = ref(null)

/* EMITS */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  createDesktopShortcut: []
  uninstallGame: []
}>()

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
</script>

<style lang="scss" scoped>
.dropdown-menu {
  transform: translate(182px, -12px); /* Adjust this value to move the menu more to the right */
  background-color: #1c1c1e; /* Dark background color */
  border: 1px solid #3a3a3c; /* Border color to match the theme */
  padding: 8px; /* Add some padding */
}

.dropdown-menu ul {
  list-style: none; /* Remove default list styles */
  padding: 0; /* Remove default padding */
  margin: 0; /* Remove default margin */
}

.dropdown-menu li {
  padding: 8px 12px; /* Add padding to list items */
  border-radius: 4px; /* Add border radius to list items */
  transition: background-color 0.2s; /* Add transition for background color */
}

.dropdown-menu li:hover {
  background-color: #2c2c2e; /* Change background color on hover */
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
