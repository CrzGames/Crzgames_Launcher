<template>
  <div class="flex flex-wrap items-center gap-3 rounded-2xl bg-zinc-900">
    <img v-if="props.imageUrl" :src="props.imageUrl" :alt="props.title" class="h-20 w-16 rounded-md object-cover" />
    <div class="flex max-w-lg flex-1 flex-col gap-1">
      <h2 v-if="props.title" class="text-sm font-bold">
        {{ props.title }}
      </h2>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * Complete download card component
 * @type {Props}
 * @property {string | null} imageUrl - The image url
 * @property {string | null} title - The title
 */
type Props = {
  imageUrl: string | undefined
  title: string | undefined
}

/* PROPS */
const props: Props = defineProps({
  imageUrl: {
    type: String,
    required: false,
    default: null,
  },
  title: {
    type: String,
    required: false,
    default: null,
  },
})
</script>
