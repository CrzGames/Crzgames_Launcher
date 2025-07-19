<template>
  <swiper
    class="swiper"
    v-if="gameCarouselStore.carousels.length > 0"
    :navigation="hasSingleSlide ? false : navigation"
    :pagination="hasSingleSlide ? false : pagination"
    :autoplay="hasSingleSlide ? false : autoplay"
    :speed="500"
    :spaceBetween="spaceBetween"
    :modules="modules"
    :slidesPerView="slidesPerView"
    :centeredSlides="true"
    :simulateTouch="false"
    :initialSlide="1"
    @slideChange="handleSlideChange"
    @swiper="initializeSwiper"
  >
    <swiper-slide
      v-for="(carousel, index) in displayedCarousels"
      :key="index"
      class="flex items-center justify-center h-[480px] flex-col md:h-[720px]"
      @mouseover="handleMouseover($event)"
      @mouseleave="handleMouseleave"
      @click="onClickSlide(index, $event)"
      style="cursor: pointer"
      :style="carousel.id === -1 ? { 'background-color': '#2C3E50' } : {}"
    >
      <img
        v-if="carousel.imageFile && carousel.id !== -1"
        :src="carousel.imageFile.url"
        @dragstart.prevent
        class="absolute h-full max-h-full w-full max-w-full object-cover"
        :alt="(carousel.title ?? 'home-slide-image') + index"
      />
      <div
        data-swiper-parallax="-360"
        class="flex items-center justify-center h-full text-center md:pl-28 md:text-left"
      >
        <div class="flex max-w-3xl flex-col items-center px-3 md:block md:px-0">
          <h1
            v-if="carousel.title"
            data-swiper-parallax="-150"
            id="carousel-title"
            class="mb-6 font-serif text-4xl font-semibold leading-tight text-white drop-shadow-2xl md:text-6xl"
          >
            {{ carousel.title }}
          </h1>
          <p
            v-if="carousel.content"
            id="carousel-content"
            data-swiper-parallax="-300"
            class="mb-8 text-lg font-semibold text-gray-200 drop-shadow-2xl md:text-2xl"
          >
            {{ carousel.content }}
          </p>
          <CrzButton
            v-if="carousel.button_content"
            size="2xl"
            class="mb-8 w-fit md:mb-0 md:mt-3"
            data-swiper-parallax="-450"
            :external-link="carousel.button_url || undefined"
            @click.stop.prevent="onButtonClick(carousel.button_url)"
          >
            {{ carousel.button_content }}
          </CrzButton>
        </div>
      </div>
    </swiper-slide>
  </swiper>
</template>

<script lang="ts" setup>
import { open } from '@tauri-apps/plugin-shell'
import { DateTime } from 'luxon'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
// import required modules
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import type {
  AutoplayOptions,
  NavigationOptions,
  PaginationOptions,
  Swiper as SwiperClass,
  SwiperModule,
} from 'swiper/types'
import { Swiper, SwiperSlide } from 'swiper/vue'
import type { ComputedRef, Ref } from 'vue'
import { computed, onMounted, ref } from 'vue'
import { useGameCarouselStore } from '~/stores/gameCarousel.store'

import CrzButton from '#src-common/components/buttons/CrzButton.vue'
import type { GameCarouselModel } from '#src-common/core/models/GameCarouselModel'

// import Swiper core and required modules
const modules: SwiperModule[] = [Pagination, Navigation, Autoplay]

/* REFS */
const slidesPerView: Ref<number> = ref(1.2)

/* STORE */
// eslint-disable-next-line @typescript-eslint/typedef
const gameCarouselStore = useGameCarouselStore()

/* COMPUTED */
// Calcul du tableau modifié pour les carousels
const displayedCarousels: ComputedRef<GameCarouselModel[] | undefined> = computed(() => {
  const carousels: GameCarouselModel[] = gameCarouselStore.carousels

  if (carousels.length === 1) {
    // Si un seul slide actif, ajoutez deux slides fictifs (un avant et un après le slide actif)
    return [fakeSlide, ...carousels, fakeSlide]
  } else if (carousels.length >= 2) {
    // Si deux slides actifs (ou plus), ajoutez le dernier slide au début et le premier à la fin
    return [carousels[carousels.length - 1], ...carousels, carousels[0]]
  }

  return undefined
})

const hasSingleSlide: ComputedRef<boolean> = computed(() => gameCarouselStore.carousels.length === 1)

/* VARS */
let mySwiper2: SwiperClass | null = null
let spaceBetween: number = 20

// Swiper options
const pagination: PaginationOptions = {
  enabled: true,
  clickable: true,
  bulletClass: 'swiper-pagination-bullet',
  bulletActiveClass: 'swiper-pagination-bullet-active',
}

const autoplay: AutoplayOptions = {
  delay: 5000,
  disableOnInteraction: false,
  pauseOnMouseEnter: true,
}

const navigation: NavigationOptions = {
  enabled: true,
}

const fakeSlide: GameCarouselModel = {
  id: -1,
  title: '',
  content: null,
  button_url: '',
  button_content: '',
  image_files_id: -1,
  logo_files_id: -1,
  imageFile: {
    // @ts-ignore
    id: -1,
    pathfilename: '',
    url: '',
    bucket_id: -1,
    bucket: {
      name: '',
      created_at: DateTime.now(),
      updated_at: DateTime.now(),
      totalObjects: 0,
      totalSize: 0,
      access: [],
    },
  },
  logoFile: {
    // @ts-ignore
    id: -1,
    pathfilename: '',
    url: '',
    bucket_id: -1,
    bucket: {
      name: '',
      created_at: DateTime.now(),
      updated_at: DateTime.now(),
      totalObjects: 0,
      totalSize: 0,
      access: [],
    },
  },
  created_at: '',
  updated_at: '',
}

/* HOOKS */
/**
 * On mounted hook
 * Handle the window resize event and adjust slidesPerView based on window width
 * @returns {Promise<void>}
 */
onMounted((): void => {
  updateArrowsPosition()
  window.addEventListener('resize', handleResize)
})

onUnmounted((): void => {
  window.removeEventListener('resize', handleResize)
})

/* METHODS */
/**
 * Handle the button click event
 * @param {string} url - The URL to open
 */
const onButtonClick: (url: string) => void = (url: string): void => {
  open(url).catch((error: any) => {
    console.error('Erreur lors de l’ouverture du lien:', error)
  })
}

/**
 * Handle the window resize event
 * Adjust slidesPerView based on window width
 * @returns {void}
 */
const handleResize: () => void = (): void => {
  // Adjust slidesPerView based on window width
  const width: number = window.innerWidth

  if (width > 1600) {
    slidesPerView.value = 1.5
    spaceBetween = 20
  } else if (width > 1000) {
    slidesPerView.value = 1.2
    spaceBetween = 20
  } else if (width > 720) {
    slidesPerView.value = 1.1
    spaceBetween = 10
  } else {
    slidesPerView.value = 1
  }

  // Obligatoire lors de la maximisation de la fenêtre window de Tauri
  setTimeout((): void => {
    updateArrowsPosition()
  }, 200)

  if (mySwiper2) {
    mySwiper2.update()
  }
}

/**
 * Initialize the Swiper instance
 * @param {SwiperClass} swiper - The Swiper instance
 * @returns {void}
 */
const initializeSwiper: (swiper: SwiperClass) => void = (swiper: SwiperClass): void => {
  mySwiper2 = swiper

  // Pour le bug de l'api si moins de 4 slide dans le Carousel alors on trik en ajouitant deux slide fictif donc on les enleve de la pagination
  const paginationElement: HTMLElement | null = document.querySelector('.swiper-pagination') as HTMLElement | null
  if (paginationElement) {
    paginationElement.classList.add('hidden-bullets')
  }

  // Ajoutez les écouteurs d'événements pour les boutons de navigation
  const swiperButtonPrev: HTMLElement | null = document.querySelector('.swiper-button-prev') as HTMLElement | null
  const swiperButtonNext: HTMLElement | null = document.querySelector('.swiper-button-next') as HTMLElement | null

  swiperButtonPrev?.addEventListener('click', handlePrevClick)
  swiperButtonNext?.addEventListener('click', handleNextClick)

  setTimeout(handleResize, 150)
}

/**
 * Handle the previous button click
 * @returns {void}
 */
const handlePrevClick: () => void = (): void => {
  if (mySwiper2) {
    if (mySwiper2.realIndex === 0) {
      mySwiper2.slideTo(gameCarouselStore.carousels.length, 600)
    }
  }
}

/**
 * Handle the next button click
 * @returns {void}
 */
const handleNextClick: () => void = (): void => {
  if (mySwiper2) {
    if (mySwiper2.realIndex === gameCarouselStore.carousels.length + 1) {
      mySwiper2.slideTo(1, 600)
    }
  }
}

/**
 * Handle the slide click event
 * @param {number} clickedIndex - The index of the clicked slide
 * @param {MouseEvent} event - The click event
 */
const onClickSlide: (clickedIndex: number, event: MouseEvent) => void = (
  clickedIndex: number,
  event: MouseEvent,
): void => {
  if (mySwiper2) {
    // Vérifier si le clic provient d'un bouton
    if ((event.target as HTMLElement).closest('button')) {
      return
    }

    // Si le slide cliqué est le slide actif (au centre)
    if (clickedIndex === mySwiper2.realIndex) {
      const url: string = gameCarouselStore.carousels[clickedIndex].button_url
      open(url).catch((error: any) => {
        console.error('Erreur lors de l’ouverture du lien:', error)
      })
    } else if (window.innerWidth < 1000) {
      return
    }
    // Gestion des slides fictifs
    else if (clickedIndex === 0) {
      mySwiper2.slideTo(gameCarouselStore.carousels.length, 600, false)
    } else if (clickedIndex === mySwiper2.slides.length - 1) {
      mySwiper2.slideTo(1, 600, false)
    }
    // Si le slide cliqué n'est pas le slide actif
    else {
      const slideWidth: number = mySwiper2.width
      const clickPosition: number = event.clientX

      // Si le clic est sur la moitié droite du slide
      if (clickPosition > slideWidth / 2) {
        mySwiper2.slideNext(600)
      }
      // Si le clic est sur la moitié gauche du slide
      else {
        mySwiper2.slidePrev(600)
      }
    }
  }
}

/**
 * Update the position of the navigation arrows
 * @returns {void}
 * @description This method calculates the position of the navigation arrows based on the width of the slides and the container
 */
const updateArrowsPosition: () => void = (): void => {
  requestAnimationFrame((): void => {
    const swiperContainer: HTMLElement | null = document.querySelector('.swiper')
    const swiperButtonPrev: HTMLElement | null = document.querySelector('.swiper-button-prev')
    const swiperButtonNext: HTMLElement | null = document.querySelector('.swiper-button-next')

    if (swiperContainer && swiperButtonPrev && swiperButtonNext && mySwiper2) {
      const slideWidth: number = mySwiper2.slides[mySwiper2.activeIndex].offsetWidth
      const slideSpace: number = (swiperContainer.offsetWidth - slideWidth) / 2

      swiperButtonPrev.style.left = `${slideSpace - swiperButtonPrev.offsetWidth / 2}px`
      swiperButtonNext.style.right = `${slideSpace - swiperButtonNext.offsetWidth / 2}px`
    }
  })
}

/**
 * Reset the opacity of all slides to 0.5
 * @returns {void}
 */
const resetAllSlidesOpacity: () => void = (): void => {
  const slides: NodeListOf<HTMLElement> | null = document.querySelectorAll(
    '.swiper-slide',
  ) as NodeListOf<HTMLElement> | null

  if (slides) {
    slides.forEach((slide: HTMLElement): void => {
      slide.style.opacity = '0.5'
    })
  }
}

/**
 * Handle the slide change event and update the opacity of the slides
 * @returns {void}
 */
const handleSlideChange: () => void = (): void => {
  if (mySwiper2) {
    resetAllSlidesOpacity()

    // Pour autoplay pour éviter de voir les slider fake
    if (mySwiper2.realIndex === 1 || mySwiper2.realIndex === mySwiper2.slides.length - 2) {
      mySwiper2.autoplay.stop()
    }

    // Use requestAnimationFrame to ensure style changes are applied on the next repaint
    requestAnimationFrame((): void => {
      const activeSlide: HTMLElement | null = document.querySelector('.swiper-slide-active') as HTMLElement | null
      if (activeSlide) {
        activeSlide.style.opacity = '1'
      }
    })
  }
}

/**
 * Reset the transformation of all slides
 * @returns {void}
 */
const resetAllSlidesTransformations: () => void = (): void => {
  const slides: NodeListOf<HTMLElement> | null = document.querySelectorAll(
    '.swiper-slide',
  ) as NodeListOf<HTMLElement> | null

  if (slides) {
    slides.forEach((slide: HTMLElement): void => {
      slide.style.transform = 'translateX(0)'
    })
  }
}

/**
 * Handle the mouseover event on a slide and update the opacity of the slides
 * @param {MouseEvent} event - The mouseover event
 * @returns {void}
 */
const handleMouseover: (event: MouseEvent) => void = (event: MouseEvent): void => {
  if (gameCarouselStore.carousels.length <= 1 || window.innerWidth < 1000) return

  resetAllSlidesOpacity()

  const slide: HTMLElement = event.currentTarget as HTMLElement
  slide.style.opacity = '1'
  slide.style.transition = 'opacity 0.3s ease, transform 0.3s ease'

  // Si c'est le slide actif, nous ne faisons rien de plus
  if (slide.classList.contains('swiper-slide-active')) {
    resetAllSlidesTransformations() // On réinitialise la transformation des autres slides
    return
  }

  const mouseX: number = event.clientX
  const slideRect: DOMRect = slide.getBoundingClientRect()
  const slideCenter: number = slideRect.left + slideRect.width / 2

  const transformValue: string = mouseX < slideCenter ? 'translateX(-20px)' : 'translateX(20px)'

  // Décaler toutes les diapositives en fonction de la position de la souris
  const allSlides: NodeListOf<HTMLElement> | null = document.querySelectorAll(
    '.swiper-slide',
  ) as NodeListOf<HTMLElement> | null
  if (allSlides) {
    allSlides.forEach((eachSlide: HTMLElement): void => {
      eachSlide.style.transform = transformValue
    })
  }

  maintainActiveSlideOpacity()
}

/**
 * Reset the opacity of all slides when the mouse leaves
 * @returns {void}
 */
const handleMouseleave: () => void = (): void => {
  resetAllSlidesOpacity()
  resetAllSlidesTransformations()
  maintainActiveSlideOpacity()
}

/**
 * Ensure that the active slide maintains an opacity of 1
 * @returns {void}
 */
const maintainActiveSlideOpacity: () => void = (): void => {
  const activeSlide: HTMLElement | null = document.querySelector('.swiper-slide-active') as HTMLElement | null

  if (activeSlide) {
    activeSlide.style.opacity = '1'
  }
}
</script>

<style lang="scss">
.swiper-horizontal > .swiper-pagination-bullets .swiper-pagination-bullet,
.swiper-pagination-horizontal.swiper-pagination-bullets .swiper-pagination-bullet {
  margin: 12px 8px;
}
.swiper-pagination .swiper-pagination-bullet {
  opacity: 1;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  height: 12px;
  max-width: 100px;
  outline: none;
  padding: 0;
  transition: background 0.3s;
  width: 100%;
  background: #8697aa;
}

.swiper-pagination .swiper-pagination-bullet.swiper-pagination-bullet-active {
  background: #fff;
}

.swiper-button-prev,
.swiper-button-next {
  height: 56px;
  width: 56px;
  background: #e0a100;
  text-align: center;
  border-radius: 100%;
  &::after {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &:hover {
    background: #f59e0b;
  }
  &:active {
    transform: translateY(0.25rem);
  }
}

.swiper-button-prev,
.swiper-button-next {
  height: 56px;
  width: 56px;
  background: #e0a100;
  text-align: center;
  border-radius: 100%;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  &::after {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &:hover {
    background: #f59e0b;
  }
  &:active {
    transform: translateY(calc(-50% + 0.25rem));
  }
}

.swiper-button-prev {
  &::after {
    content: url('~~/src-nuxt/public/images/arrow-left.svg');
  }
}

.swiper-button-next {
  &::after {
    content: url('~~/src-nuxt/public/images/arrow-right.svg');
  }
}

.swiper-slide {
  transition:
    transform 0.5s,
    opacity 0.5s;
  opacity: 0.5;
}

.swiper-slide-active,
.swiper-slide-hover-left,
.swiper-slide-hover-right {
  opacity: 1;
}

.swiper-pagination-bullet {
  &:hover,
  &-active {
    background: #fff;
  }
}

.hidden-bullets .swiper-pagination-bullet:nth-child(1),
.hidden-bullets .swiper-pagination-bullet:nth-last-child(1) {
  display: none;
}

// TODO: A enlever si besoin à tester
@media (min-width: 1600px) {
  /*.swiper-button-prev {
    left: calc(15%) !important;
  }

  .swiper-button-next {
    right: calc(15%) !important;
  }*/
}

/* Media query pour les appareils avec une hauteur inférieure à 740px */
@media screen and (max-height: 740px) {
  .swiper {
    height: calc(100vh - 35px); /* Le carousel prendra toute la hauteur disponible - 35px (pour les 3 petit points) */
  }
}

/* Media query pour les appareils avec une hauteur supérieure à 740px */
@media screen and (min-height: 741px) {
  .swiper {
    height: calc(80vh); /* Le carousel prendra 70% de la hauteur disponible */
  }
}

#carousel-title {
  font-size: clamp(1.2rem, 3vw, 2.5rem) !important; /* Réduit la taille max */
}
#carousel-content {
  font-size: clamp(0.9rem, 1.8vw, 1.3rem) !important; /* Diminue légèrement */
}

.swiper {
  width: 100%;
  aspect-ratio: 16 / 9; /* Maintient un ratio stable pour toutes les tailles d'écran */
  max-height: 720px; /* Limite la hauteur pour les grands écrans */
}
</style>
