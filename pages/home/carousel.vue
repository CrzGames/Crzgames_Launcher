<template>
  <div class="container">
    <!-- Afficher le loader lorsque isLoading est vrai -->
    <CrzSpinner v-if="isLoading" />

    <!-- Carrousel -->
    <CrzSwiper v-if="!isLoading && carouselsStore.carouselItems.length > 0" :carousels="carouselsStore.carouselItems" />
  </div>
</template>

<script lang="ts" setup>
import CrzSwiper from '~/components/carousel/CrzSwiper.vue'
import { onMounted } from 'vue'
import { useGameCarouselStore } from '@/stores/game-carousel.store'
import { useWindowStore } from '@/stores/window.store'
import CrzSpinner from '~/common/components/loaders/CrzSpinner.vue'

/* STORES */
// eslint-disable-next-line @typescript-eslint/typedef
const windowStore = useWindowStore()

/* LAYOUT - MIDDLEWARE */
definePageMeta({
  layout: 'layout-home',
  middleware: ['auth'],
})

/* REFS */
const isLoading: Ref<boolean> = ref(true)

/*STORE*/
// eslint-disable-next-line @typescript-eslint/typedef
const carouselsStore = useGameCarouselStore()

/* HOOKS CYCLE */
/**
 * Fetch all carousels
 * @returns {Promise<void>}
 */
onMounted(async (): Promise<void> => {
  windowStore.setLoading(false) // Pour la fenetre window
  isLoading.value = true // Pour les données de la page

  try {
    await carouselsStore.getAllCarousels()
  } catch (error) {
    console.error('Carrousel page : ', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
@media (min-height: 721px) {
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
}
</style>
