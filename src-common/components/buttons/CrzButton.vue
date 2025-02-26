<template>
  <component
    :is="tag"
    :to="to"
    :disabled="isDisabled"
    :href="externalLink || to"
    :target="externalLink ? '_blank' : null"
    :class="[
      isDisabled ? 'cursor-not-allowed brightness-75' : `${hoverBgClass} active:translate-y-1`,
      load ? 'cursor-wait' : '',
      sizeClasses,
      bgClass,
    ]"
    class="flex translate-y-0 transform items-center justify-center rounded-md font-serif font-medium text-gray-900 duration-100"
  >
    <slot v-if="!load" />
    <CrzSpinner v-else variant="dark" :size="28" />
  </component>
</template>
<script lang="ts" setup>
import CrzSpinner from '#src-common/components/loaders/CrzSpinner.vue'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

/* PROPS */
// eslint-disable-next-line @typescript-eslint/typedef
const props = defineProps({
  outlined: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  load: { type: Boolean, default: false },
  to: { type: [String, Object], default: null },
  externalLink: { type: String, default: null },
  size: { type: String, default: null },
  variant: { type: String, default: 'primary' }, // primary, red, green, blue, none
})

/* COMPUTED */
const tag: ComputedRef<string> = computed((): string => {
  if (props.to) {
    return 'RouterLink'
  } else if (props.externalLink) {
    return 'a'
  }
  return 'button'
})

const isDisabled: ComputedRef<boolean> = computed((): boolean => {
  return props.disabled || props.load
})

const sizeClasses: ComputedRef<string> = computed((): string => {
  switch (props.size) {
    case 'sm':
      return 'py-1.5 px-4 text-xs'
    case 'md':
      return 'py-2.5 px-6 text-sm'
    case 'lg':
      return 'py-3 px-8 text-base'
    case 'xl':
      return 'py-4 px-16 text-lg'
    case '2xl':
      return 'py-3 px-8 text-base md:py-5 md:px-16 md:text-xl'
    default:
      return 'py-2.5 px-6 text-sm'
  }
})

const hoverBgClass: ComputedRef<string> = computed((): string => {
  if (props.variant === 'none') return '' // Aucun arrière-plan au survol pour "none"
  switch (props.variant) {
    case 'primary':
      return 'hover:bg-amber-500'
    case 'red':
      return 'hover:bg-red-600'
    case 'green':
      return 'hover:bg-green-500'
    case 'blue':
      return 'hover:bg-blue-500'
    default:
      return 'hover:bg-amber-500'
  }
})

const bgClass: ComputedRef<string> = computed((): string => {
  if (props.variant === 'none') return '' // Aucun arrière-plan pour "none"
  switch (props.variant) {
    case 'primary':
      return 'bg-amber-400'
    case 'red':
      return 'bg-red-500'
    case 'green':
      return 'bg-green-400'
    case 'blue':
      return 'bg-blue-400'
    default:
      return 'bg-amber-400'
  }
})
</script>
