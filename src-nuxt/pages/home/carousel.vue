<template>
  <div class="container">
    <!-- Spinner affiché lorsque isLoading est vrai (changement de fenetre window) -->
    <div v-if="windowStore.isLoading" class="spinner-overlay bg-blue-800">
      <CrzSpinner />
    </div>

    <!-- Carrousel -->
    <CrzSwiper
      v-if="!isLoadingCarousels && carouselsStore.carouselItems.length > 0"
      :carousels="carouselsStore.carouselItems"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'

import CrzSpinner from '#src-common/components/loaders/CrzSpinner.vue'

import CrzSwiper from '#src-nuxt/components/carousel/CrzSwiper.vue'
import { useGameCarouselStore } from '#src-nuxt/stores/game-carousel.store'
import { useWindowStore } from '#src-nuxt/stores/window.store'

/* LAYOUT - MIDDLEWARE */
definePageMeta({
  layout: 'layout-home',
  middleware: ['auth'],
  pageTransition: {
    name: 'fade-scale',
    mode: 'out-in',
  },
  layoutTransition: {
    name: 'slide-up',
    mode: 'out-in',
  },
})

/* REFS */
/**
 * isLoadingCarousels permet de savoir si les carrousels sont en cours de chargement
 * @type {Ref<boolean>}
 */
const isLoadingCarousels: Ref<boolean> = ref(true)

/* STORE */
const carouselsStore: any = useGameCarouselStore()
const windowStore: any = useWindowStore()

/* HOOKS CYCLE */
/**
 * Lifecycle hook: mounted
 * @returns {Promise<void>}
 */
onMounted(async (): Promise<void> => {
  await fetchCarousels()

  /**
   * IMPORTANT: Mettre à la fin de la méthode onMounted(), quand la page est totalement chargée.
   * On utilise cela si on vient de la page login et qu'on est redirigé sur la page home carrousel.
   */
  await nextTick(() => {
    windowStore.setLoading(false)
  })
})

/* METHODS */
/**
 * Fetch all carousels
 * @returns {Promise<void>}
 */
const fetchCarousels: () => Promise<void> = async (): Promise<void> => {
  try {
    await carouselsStore.getAllCarousels()
  } catch (error: any) {
    console.error('Carrousel page : ', error)
  } finally {
    /**
     * A la fin du chargement des carrousels, isLoadingCarousels est mis à false
     */
    isLoadingCarousels.value = false
  }
}
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

/* Spinner de chargement entre les fenetre window */
.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999999;
}
</style>
