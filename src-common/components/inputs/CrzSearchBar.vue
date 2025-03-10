<template>
  <div
    class="grid w-full max-w-md grid-cols-[auto,1fr] items-center"
    :title="props.title"
    :style="{ height: props.height ? props.height + 'px' : '' }"
  >
    <div
      :style="{ height: props.height ? props.height + 'px' : '' }"
      class="flex h-full items-center rounded-l-md bg-amber-400 p-2"
    >
      <CrzIcon name="search" mode="stroke" color="#141724" />
    </div>
    <input
      ref="searchInput"
      type="search"
      @input="emitValue($event)"
      :value="props.value"
      :class="props.height ? 'h-full' : 'h-12'"
      class="relative flex w-full items-center justify-center rounded-md rounded-l-none border-2 border-transparent bg-zinc-900 pl-3 text-white outline-none placeholder:text-zinc-600 focus:border-amber-400"
      :placeholder="props.placeholder"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'

import CrzIcon from '#src-common/components/ui/CrzIcon.vue'

/* TYPES */
/**
 * Props
 * @type {Props}
 * @property {string | null} title - The title
 * @property {string} value - The value
 * @property {string} placeholder - The placeholder
 * @property {number | null} height - The height
 */
type Props = {
  title: string | undefined
  value: string
  placeholder: string
  height: number | null
}

/* PROPS */
const props: Props = defineProps({
  title: { type: String, default: null },
  value: { type: String, default: '' },
  placeholder: { type: String, default: 'Search (Ctrl + E)' },
  height: { type: Number, default: null },
})

/* EMIT */
const emit: (event: 'update:value', ...args: any[]) => void = defineEmits(['update:value'])

/* REFS */
const searchInput: Ref<HTMLInputElement | null> = ref<HTMLInputElement | null>(null)

/*METHODS*/
/**
 * Emit the value
 * @param {Event} event - The input event
 * @returns {void}
 */
const emitValue: (event: Event) => void = (event: Event): void => {
  emit('update:value', (event.target as HTMLInputElement).value)
}

/**
 * Handle the keydown event
 * @param {KeyboardEvent} event - The keydown event
 * @returns {void}
 */
const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
  if (event.ctrlKey && event.key.toLowerCase() === 'e') {
    event.preventDefault()
    if (searchInput.value) {
      searchInput.value.focus()
    }
  }
}

/* LIFECYCLE */
onMounted((): void => {
  window.addEventListener('keydown', handleKeyDown)
})
onUnmounted((): void => {
  window.removeEventListener('keydown', handleKeyDown)
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
