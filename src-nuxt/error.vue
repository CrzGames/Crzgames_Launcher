<template>
  <div>
    <div>{{ props.error?.statusCode }}</div>
    <div>{{ props.error?.message }}</div>
    <div v-html="props.error?.stack"></div>
    <button @click="handleError">Go back</button>
  </div>
</template>

<script lang="ts" setup>
import type { NuxtError } from '#app'

/**
 * Props définissant l'erreur Nuxt.
 */
const props: any = defineProps<{ error: NuxtError }>()

/**
 * Gère la suppression de l'erreur et redirige vers la page d'accueil.
 * @returns {void} Ne retourne rien.
 */
const handleError: () => void = (): void => {
  clearError({ redirect: '/' })
}
</script>
