<template>
  <div class="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
    <div
      class="flex flex-col justify-center overflow-hidden bg-blue-400"
      role="progressbar"
      :style="`width: ${props.progress}%`"
      :aria-valuenow="props.progress"
      aria-valuemin="0"
      aria-valuemax="100"
    />
  </div>
</template>

<script lang="ts" setup>
/* INTERFACE */
/**
 * @interface Props
 * @property {number} progress - The progress value
 */
interface Props {
  progress: number
}

/* PROPS */
const props: Props = defineProps({
  progress: {
    type: Number,
    required: false,
    default: 0,
  },
})
</script>
