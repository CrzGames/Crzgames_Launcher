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
import { ref, onMounted, onUnmounted } from 'vue'
import CrzIcon from '@/common/components/ui/CrzIcon.vue'

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
