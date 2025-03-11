<template>
  <div
    id="application-sidebar-left"
    :class="menuIsExpanded ? '' : 'w-[80px]'"
    class="fixed z-10 flex h-screen w-[256px] flex-col items-center justify-start overflow-hidden bg-blue-900/90 p-4 text-white transition-all duration-300"
    style="height: calc(100vh - 35px)"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <nav class="flex h-full w-full flex-col flex-wrap">
      <div class="flex h-full w-full flex-col items-center justify-between">
        <!-- START LINKS -->
        <div class="grid w-full gap-3">
          <div v-for="link in startLinks" :key="link.name" class="inline w-full">
            <RouterLink
              :to="link.to"
              :class="[
                isActive(link.to) ? 'bg-amber-400 text-zinc-900' : 'hover:bg-gray-700',
                menuIsExpanded ? 'px-3' : 'w-[45px] justify-center',
              ]"
              class="flex h-[45px] items-center gap-x-3.5 rounded-md text-sm bg-opacity-100 text-opacity-100"
            >
              <CrzIcon v-if="link.icon" :name="link.icon" mode="stroke" />
              <span v-if="menuIsExpanded" class="bg-opacity-100 text-opacity-100">
                {{ link.name }}
              </span>
            </RouterLink>
          </div>
        </div>

        <!-- BOTTOM LINKS -->
        <div class="grid w-full gap-3">
          <div v-for="link in bottomLinks" :key="link.name" class="inline w-full">
            <RouterLink
              :to="link.to"
              :class="[
                isActive(link.to) ? 'bg-amber-400 text-zinc-900' : 'hover:bg-gray-700',
                menuIsExpanded ? 'px-3' : 'w-[45px] justify-center',
              ]"
              class="flex h-[45px] items-center gap-x-3.5 rounded-md text-sm bg-opacity-100 text-opacity-100"
            >
              <CrzIcon v-if="link.icon" :name="link.icon" mode="stroke" />
              <span v-if="menuIsExpanded" class="bg-opacity-100 text-opacity-100">
                {{ link.name }}
              </span>
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'
import { useRoute } from 'vue-router'

import CrzIcon from '#src-common/components/ui/CrzIcon.vue'

/* TYPES */
/**
 * Link type
 * @type {object} - The link type
 * @property {string} name - The name of the link
 * @property {string} icon - The icon of the link
 * @property {string} to - The path of the link
 */
type Link = {
  name: string
  icon: string
  to: string
}

/* REFS */
const menuIsExpanded: Ref<boolean> = ref(window.innerWidth >= 1125)
const isHovered: Ref<boolean> = ref(false)

/* VARS */
const startLinks: Link[] = [
  {
    name: 'News',
    icon: 'book-open',
    to: `/home/carousel`,
  },
  {
    name: 'Browse',
    icon: 'grid',
    to: `/home/browse`,
  },
  {
    name: 'My Library',
    icon: 'layers',
    to: `/home/library`,
  },
]

const bottomLinks: Link[] = [
  {
    name: 'Download',
    icon: 'download',
    to: `/home/download-manager`,
  },
]

/* METHODS */
/**
 * Check if the link is active
 * @param {string} to - The link to check
 * @returns {boolean} - The result
 */
const isActive: (to: string) => boolean = (to: string): boolean => {
  return useRoute().path.includes(to)
}

/**
 * Update sidebar state
 * @returns {void}
 */
const updateSidebarState: () => void = (): void => {
  const isLargeScreen: boolean = window.innerWidth >= 1125
  menuIsExpanded.value = isLargeScreen || isHovered.value
}

/**
 * On mouse enter
 * @returns {void}
 */
const onMouseEnter: () => void = (): void => {
  isHovered.value = true
  updateSidebarState()
}

/**
 * On mouse leave
 * @returns {void}
 */
const onMouseLeave: () => void = (): void => {
  isHovered.value = false
  updateSidebarState()
}

/* LIFECYCLE HOOKS */
onMounted((): void => {
  updateSidebarState()
  window.addEventListener('resize', updateSidebarState)
})

onUnmounted((): void => {
  window.removeEventListener('resize', updateSidebarState)
})
</script>

<style scoped>
/* Personnalisation de la croix native pour WebKit (Chrome, Safari, Edge) */
input[type='search']::-webkit-search-cancel-button {
  -webkit-appearance: none; /* Supprime le style par défaut */
  height: 16px;
  width: 16px;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23F59E0B' stroke-width='2'><path d='M6 18L18 6M6 6l12 12'/></svg>")
    no-repeat center;
  background-size: contain;
  cursor: pointer;
}
</style>
