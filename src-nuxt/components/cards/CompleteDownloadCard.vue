<template>
  <div class="flex items-center gap-4 rounded-2xl bg-zinc-900 p-4 w-full max-w-xl shadow-lg">
    <!-- Image du jeu avec une meilleure visibilité -->
    <div class="relative w-24 h-32 flex-shrink-0">
      <img
        v-if="props.imageUrl"
        :src="props.imageUrl"
        :alt="props.title"
        class="w-full h-full rounded-md object-cover border border-gray-700 shadow-md"
      />
    </div>

    <!-- Informations du jeu -->
    <div class="flex flex-col flex-1">
      <h2 v-if="props.title" class="text-lg font-bold text-white truncate">
        {{ props.title }}
      </h2>
      <p class="text-sm text-gray-400">Download complete</p>
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
