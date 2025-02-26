<template>
  <div
    id="application-sidebar-left"
    :class="menuIsExpanded ? '' : 'w-[80px]'"
    class="fixed z-10 flex h-screen w-[256px] flex-col items-center justify-start overflow-hidden bg-blue-900 p-4 text-white transition-all duration-300"
    style="height: calc(100vh - 35px)"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <nav class="flex h-full w-full flex-col flex-wrap">
      <div class="flex h-full w-full flex-col items-center justify-between">
        <!--  START LINKS -->
        <div class="grid w-full gap-3">
          <div v-for="link in startLinks" :key="link.name" class="inline w-full">
            <RouterLink
              :to="link.to"
              :class="[
                isActive(link.to) ? 'bg-amber-400 text-zinc-900' : 'hover:bg-gray-700',
                menuIsExpanded ? 'px-3' : 'w-[45px] justify-center',
              ]"
              class="flex h-[45px] items-center gap-x-3.5 rounded-md text-sm"
            >
              <CrzIcon v-if="link.icon" :name="link.icon" mode="stroke" />
              <span v-if="menuIsExpanded">
                {{ link.name }}
              </span>
            </RouterLink>
          </div>
        </div>

        <!--  BOTTOM LINKS      -->
        <div class="grid w-full gap-3">
          <div v-for="link in bottomLinks" :key="link.name" class="inline w-full">
            <RouterLink
              :to="link.to"
              :class="[
                isActive(link.to) ? 'bg-amber-400 text-zinc-900' : 'hover:bg-gray-700',
                menuIsExpanded ? 'px-3' : 'w-[45px] justify-center',
              ]"
              class="flex h-[45px] items-center gap-x-3.5 rounded-md text-sm"
            >
              <CrzIcon v-if="link.icon" :name="link.icon" mode="stroke" />
              <span v-if="menuIsExpanded">
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
import { useRoute } from 'vue-router'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import { ref } from 'vue'
import type { Ref } from 'vue'

/* TYPES */
/**
 * Link for routing in the sidebar
 * @type {object} Link
 * @property {string} name - The name of the link
 * @property {string} icon - The icon of the link
 * @property {string} to - The route of the link
 */
type Link = {
  name: string
  icon: string
  to: string
}

/* REFS */
const menuIsExpanded: Ref<boolean> = ref(false)

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

/*METHODS*/
/**
 * Check if the link is active
 * @param {string} to - The link to check
 * @returns {boolean} - The result
 */
const isActive: (to: string) => boolean = (to: string): boolean => {
  return useRoute().path.includes(to)
}

/**
 * On mouse enter for the sidebar
 * @returns {void}
 */
const onMouseEnter: () => void = (): void => {
  menuIsExpanded.value = true
}

/**
 * On mouse leave for the sidebar
 * @returns {void}
 */
const onMouseLeave: () => void = (): void => {
  menuIsExpanded.value = false
}
</script>
