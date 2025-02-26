<template>
  <div
    class="inline-block animate-spin rounded-full border-[3px] border-current border-t-transparent"
    role="status"
    aria-label="loading"
    :style="style"
    :class="classes"
  >
    <span class="sr-only">Loading...</span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

/**
 * @interface Props
 * @property {string} variant - The spinner variant
 * @property {number} size - The spinner size
 */
interface Props {
  variant: string
  size: number
}

/**
 * @interface Classes
 * @property {boolean} text-amber-400 - The amber color
 * @property {boolean} text-slate-100 - The slate color
 * @property {boolean} text-gray-900 - The gray color
 */
interface Classes {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'text-amber-400': boolean
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'text-slate-100': boolean
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'text-gray-900': boolean
}

const props: Props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: Number, default: 56 },
})

const style: ComputedRef<Record<string, string>> = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  stroke: `#FDB44B`,
}))

const classes: ComputedRef<Classes> = computed(
  (): Classes => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'text-amber-400': props.variant === 'primary',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'text-slate-100': props.variant === 'light',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'text-gray-900': props.variant === 'dark',
  }),
)
</script>
