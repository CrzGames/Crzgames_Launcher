<template>
  <div class="container">
    <!-- Carrousel, si les carrousels sont chargés et qu'il y a des carrousels -->
    <CrzSwiper
      v-if="!isLoadingCarousels && carouselsStore.carousels.length > 0"
      :carousels="carouselsStore.carousels"
    />

    <!-- Spinner, si les carrousels sont en cours de chargement -->
    <CrzSpinner v-else-if="isLoadingCarousels" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import type { Ref } from 'vue'

import CrzSpinner from '#src-common/components/loaders/CrzSpinner.vue'

import { createLogger } from '#src-core/utils/logger'
import type { Logger } from '#src-core/utils/logger'

import CrzSwiper from '#src-nuxt/components/carousel/CrzSwiper.vue'
import { useGameCarouselStore } from '#src-nuxt/stores/gameCarousel.store'
import { useWindowStore } from '#src-nuxt/stores/window.store'

/* LAYOUT - MIDDLEWARE - TRANSITIONS */
definePageMeta({
  layout: 'layout-home',
  middleware: ['auth', 'navigation'],
  pageTransition: {
    name: 'fade-scale',
    mode: 'out-in',
  },
  layoutTransition: {
    name: 'slide-up',
    mode: 'out-in',
  },
})

/* DATA */
/**
 * Instance du logger pour tracer les evenements dans la page "Carrousel".
 * - Utilise createLogger avec un contexte "Carrousel".
 * @type {Logger}
 */
const logger: Logger = createLogger('Carrousel')

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
   * On utilise cela si on vient de la page login et qu'on est redirigé sur la page home/carousel.
   */
  await nextTick(() => {
    windowStore.setLoading(false)
  })
})

/* METHODS */
/**
 * Récupère les carrousels depuis le store.
 * @returns {Promise<void>}
 */
const fetchCarousels: () => Promise<void> = async (): Promise<void> => {
  try {
    await carouselsStore.getAllCarousels()
  } catch (error: any) {
    logger.error('[fetchCarousels] error : ', error)
  } finally {
    /**
     * A la fin du chargement des carrousels, isLoadingCarousels est
     * mis à false pour afficher le carrousel et non le spinner.
     */
    isLoadingCarousels.value = false
  }
}
</script>

<style lang="scss" scoped>
/* Positionnement du carrousel au centre de la page ou le spinner */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>
