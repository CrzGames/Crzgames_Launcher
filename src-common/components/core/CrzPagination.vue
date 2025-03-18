<template>
  <div class="flex items-center justify-between w-full px-4 py-2 bg-[#141724] text-white">
    <!-- Range Indicator -->
    <span class="text-sm">Showing results {{ perPage * currentPage - perPage + 1 }} to {{ to }} of {{ total }}.</span>

    <!-- Navigation Buttons and Page Numbers -->
    <div class="flex items-center gap-2">
      <!-- First Button -->
      <button
        @click="changePage(1)"
        :disabled="currentPage === 1"
        class="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
        </svg>
      </button>

      <!-- Previous Button -->
      <button
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Page Numbers -->
      <template v-for="(item, index) in visiblePages" :key="index">
        <button
          v-if="typeof item === 'number'"
          @click="changePage(item)"
          :class="[
            'w-8 h-8 flex items-center justify-center rounded transition',
            item === currentPage ? 'bg-[#FF9800] text-black font-semibold' : 'hover:bg-gray-700',
          ]"
          :disabled="item === currentPage"
        >
          {{ item }}
        </button>
      </template>

      <!-- Next Button -->
      <button
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Last Button -->
      <button
        @click="changePage(totalPages)"
        :disabled="currentPage === totalPages"
        class="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5-5 5M6 7l5 5-5 5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type ComputedRef, computed } from 'vue'

/**
 * Props pour le composant CrzPagination.
 * @type {object} CrzPaginationProps
 * @property {number} total - Nombre total d'éléments.
 * @property {number} perPage - Nombre d'éléments par page.
 * @property {number} currentPage - Numéro de la page actuelle.
 * @property {(page: number) => void} [onPageChange] - Fonction de rappel optionnelle déclenchée lors du changement de page.
 */
type CrzPaginationProps = {
  total: number
  perPage: number
  currentPage: number
  onPageChange?: (page: number) => void
}

/**
 * Define props with strong typing.
 */
const props: CrzPaginationProps = defineProps<CrzPaginationProps>()

/**
 * Define emits for the component.
 * @type {{ 'update:currentPage': (page: number) => void }}
 */
const emit: any = defineEmits<{
  'update:currentPage': (page: number) => void
}>()

/**
 * Computed property for the total number of pages.
 * @returns {ComputedRef<number>} - Le nombre total de pages.
 */
const totalPages: ComputedRef<number> = computed((): number => {
  const pages: number = Math.max(1, Math.ceil(props.total / props.perPage))
  return pages
})

/**
 * Computed property for the ending index of the current page range.
 * @returns {ComputedRef<number>} - L'index de fin de la plage actuelle.
 */
const to: ComputedRef<number> = computed((): number => {
  const val: number = Math.min(props.currentPage * props.perPage, props.total)
  return val
})

/**
 * Computed property for the visible page numbers to display.
 * Limits to 5 pages centered around the current page for better navigation.
 * @returns {ComputedRef<number[]>} - Liste des numéros de page visibles.
 */
const visiblePages: ComputedRef<number[]> = computed((): number[] => {
  const pages: number[] = []
  const maxVisible: number = 7 // Limite à 10 pages visibles
  const halfVisible: number = Math.floor(maxVisible / 2)

  // Calcul du début et de la fin des pages visibles
  let start: number = Math.max(1, props.currentPage - halfVisible)
  let end: number = start + maxVisible - 1

  // Ajuste si on dépasse le total des pages
  if (end > totalPages.value) {
    end = totalPages.value
    start = Math.max(1, end - maxVisible + 1)
  }

  // Ajoute les pages visibles
  for (let i: number = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

/**
 * Handles page change by emitting the new page number and calling the onPageChange callback if provided.
 * @param {number} page - Le nouveau numéro de page à naviguer.
 * @returns {void}
 */
const changePage: (page: number) => void = (page: number): void => {
  if (page > 0 && page <= totalPages.value) {
    emit('update:currentPage', page)
    if (props.onPageChange) {
      props.onPageChange(page)
    }
  }
}
</script>
