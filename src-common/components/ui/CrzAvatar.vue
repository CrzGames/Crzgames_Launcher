<template>
  <img
    v-if="props.photo"
    :src="props.photo"
    class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-gray-600"
    :alt="name"
  />
  <span v-else class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-gray-600">
    <span class="text-sm font-medium leading-none text-white">
      {{ initials }}
    </span>
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

/* INTERFACE */
/**
 * Props interface
 * @interface Props
 * @property {string} name - The name of the user
 * @property {string} photo - The photo of the user
 */
interface Props {
  name: string
  photo: string
}

/* PROPS */
const props: Props = defineProps({
  name: {
    type: String,
    default: '',
  },
  photo: {
    type: String,
    default: '',
  },
})

/* COMPUTED */
const initials: ComputedRef<string> = computed(() => {
  if (props.name) {
    const nameParts: string[] = props.name
      .split(' ')
      .map((part: string): string => part.trim())
      .filter((part: string): boolean => part.length > 0)

    const firstInitial: string = nameParts[0]?.charAt(0) || ''
    const secondInitial: string = nameParts[1]?.charAt(0) || ''
    const initials: string = secondInitial ? `${firstInitial}${secondInitial}` : firstInitial

    return initials.toUpperCase()
  }
  return ''
})
</script>
