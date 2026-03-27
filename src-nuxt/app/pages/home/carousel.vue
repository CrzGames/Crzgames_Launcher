<template>
  <div class="container">
    <!-- Boutons navigation ajouté ici -->
    <NavigationPages class="navigation-pages" />

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
import NavigationPages from '~/components/navigations/NavigationPages.vue'

import CrzSpinner from '#src-common/components/loaders/CrzSpinner.vue'

import { createLogger } from '#src-core/utils/logger'
import type { Logger } from '#src-core/utils/logger'

import CrzSwiper from '#src-nuxt/app/components/carousel/CrzSwiper.vue'
import { useGameCarouselStore } from '#src-nuxt/app/stores/gameCarousel.store'
import { useWindowStore } from '#src-nuxt/app/stores/window.store'

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
const CAROUSEL_IMAGES_PRELOAD_TIMEOUT_MS: number = 8000
const MIN_CAROUSEL_SPINNER_MS: number = 250

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
  await scrollToTop()
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
  const spinnerStartAt: number = Date.now()

  try {
    await carouselsStore.getAllCarousels()
  } catch (error: any) {
    logger.error('[fetchCarousels] error : ', error)
  } finally {
    await nextTick()
    await preloadCarouselImages()

    const elapsedMs: number = Date.now() - spinnerStartAt
    if (elapsedMs < MIN_CAROUSEL_SPINNER_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_CAROUSEL_SPINNER_MS - elapsedMs))
    }

    /**
     * A la fin du chargement des carrousels, isLoadingCarousels est
     * mis � false pour afficher le carrousel et non le spinner.
     */
    isLoadingCarousels.value = false
  }
}

const preloadCarouselImages: () => Promise<void> = async (): Promise<void> => {
  const imageUrls: string[] = getCarouselImageUrls()
  if (imageUrls.length === 0) {
    return
  }

  await Promise.race([
    Promise.all(imageUrls.map((url: string) => preloadImage(url))),
    new Promise<void>((resolve) => setTimeout(resolve, CAROUSEL_IMAGES_PRELOAD_TIMEOUT_MS)),
  ])
}

const getCarouselImageUrls: () => string[] = (): string[] => {
  const urls: Set<string> = new Set()

  for (const carousel of carouselsStore.carousels as Array<{ imageFile?: { url?: string } }>) {
    const url: string | undefined = carousel?.imageFile?.url
    if (url) {
      urls.add(url)
    }
  }

  return Array.from(urls)
}

const preloadImage: (url: string) => Promise<void> = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    const image: HTMLImageElement = new Image()
    let settled: boolean = false

    const done = (): void => {
      if (settled) {
        return
      }

      settled = true
      resolve()
    }

    image.onload = done
    image.onerror = done
    image.src = url

    if (image.complete) {
      done()
    }
  })
}

/**
 * Défilement vers le haut de la page avec un effet de défilement doux.
 * @returns {Promise<void>}
 */
const scrollToTop: () => Promise<void> = async (): Promise<void> => {
  await nextTick()

  // Trouver le conteneur scrollable défini dans layout-home.vue
  const scrollableContainer: HTMLElement | null = document.querySelector(
    '.main-content-scrollable',
  ) as HTMLElement | null

  if (scrollableContainer) {
    // Utiliser scrollTo sur le conteneur scrollable avec behavior: 'smooth'
    scrollableContainer.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
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
  position: relative;
}

/* Par défaut, navigation est caché */
.navigation-pages {
  display: none;
}

/* Affiche NavigationPages uniquement au-dessus de 741px */
@media screen and (min-height: 741px) {
  .navigation-pages {
    display: flex;
    position: absolute;
    top: 20px;
    left: 20px;
  }
}
</style>

