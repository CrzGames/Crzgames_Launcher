<template>
  <span
    :class="`inline-flex w-fit items-center gap-1.5 ${props.close ? 'py-1 pl-3 pr-1' : padding} rounded-full text-xs font-medium ${bgColor} ${textColor}`"
  >
    <slot />

    <button
      v-if="props.close"
      @click.prevent.stop="$emit('close')"
      class="flex items-center justify-center rounded-full bg-gray-700 bg-opacity-40 p-0.5 hover:bg-gray-600"
    >
      <CrzIcon name="x" :width="14" :height="14" />
    </button>
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { ComputedRef, PropType } from 'vue'
import CrzIcon from '@/common/components/ui/CrzIcon.vue'

/* TYPES */
/**
 * Props
 * @type {object}
 * @property {string} variant - Badge variant
 * @property {string} size - Badge size
 * @property {boolean} close - Show close button
 */
type Props = {
  variant: 'gray' | 'red' | 'blue' | 'yellow' | 'green'
  size: 'sm' | 'md' | 'lg'
  close: boolean
}

/* PROPS */
const props: Props = defineProps({
  variant: {
    type: String as PropType<'gray' | 'red' | 'blue' | 'yellow' | 'green'>,
    default: 'blue',
  },
  size: {
    type: String as PropType<'sm' | 'md' | 'lg'>,
    default: 'md',
  },
  close: {
    type: Boolean,
    default: false,
  },
})

/* COMPUTED */
const textColor: ComputedRef<string> = computed(() => {
  return props.variant === 'yellow' || props.variant === 'green' ? 'text-black' : 'text-white'
})

const bgColor: ComputedRef<string> = computed(() => {
  switch (props.variant) {
    case 'gray':
      return 'bg-gray-700'
    case 'red':
      return 'bg-red-500'
    case 'blue':
      return 'bg-blue-500'
    case 'yellow':
      return 'bg-yellow-500'
    case 'green':
      return 'bg-green-500'
    default:
      return 'bg-blue-500'
  }
})

const padding: ComputedRef<string> = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'py-0.5 px-2'
    case 'md':
      return 'py-1.5 px-3'
    case 'lg':
      return 'py-2 px-4'
    default:
      return 'py-1.5 px-3'
  }
})
</script>
