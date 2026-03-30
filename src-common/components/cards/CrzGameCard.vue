<template>
  <component :is="tag" :to="to" class="grid w-full min-w-[170px] max-w-[320px] gap-2">
    <div
      class="relative aspect-[3/4] transform transition-transform duration-300 ease-in-out"
      :class="[
        props.showVideo ? 'overflow-hidden' : 'overflow-visible',
        props.enableHoverEffect ? 'hover:scale-105 hover:-translate-y-2' : '',
        props.visualGroupClass,
        !props.pictureFileUrl ? 'rounded-md bg-zinc-100' : '',
      ]"
      @mouseenter="playVideo"
      @mouseleave="resetVideo"
    >
      <!-- Étiquette "À VENIR" ou "NOUVEAU" -->
      <span
        v-if="props.upcomingGame"
        class="absolute left-2 top-2 z-20 rounded bg-yellow-500 px-2 py-1 text-xs font-bold text-white"
      >
        COMING SOON
      </span>
      <span
        v-else-if="props.newGame"
        class="absolute left-2 top-2 z-20 rounded bg-green-500 px-2 py-1 text-xs font-bold text-white"
      >
        NEW
      </span>

      <!-- Image de la couverture du jeu -->
      <img
        class="absolute inset-0 h-full w-full rounded-md object-cover"
        v-if="props.pictureFileUrl"
        :src="props.pictureFileUrl"
        v-show="!hover || !canShowTrailerVideo || !trailerFrameReady"
        :alt="`${props.title} game cover`"
      />

      <!-- Vidéo du jeu -->
      <video
        v-if="canShowTrailerVideo"
        loop
        muted
        playsinline
        preload="metadata"
        ref="gameVideoElement"
        class="absolute inset-0 h-full w-full rounded-md object-cover"
        v-show="hover"
        :poster="props.pictureFileUrl || undefined"
        @loadeddata="onTrailerLoadedData"
        @error="onTrailerPlaybackError"
      >
        <source :src="normalizedTrailerFileUrl || ''" :type="trailerMimeType || undefined" />
      </video>

      <!-- Logo du jeu -->
      <img
        v-if="props.logoFileUrl"
        class="absolute bottom-2 left-1/2 h-auto -translate-x-1/2 transform"
        :src="props.logoFileUrl"
        v-show="!hover || !canShowTrailerVideo || !trailerFrameReady"
        :alt="`${props.title} game logo`"
      />

      <!-- Bouton pour ajouter le jeu à la liste d'envie -->
      <CrzSquareIconButton
        v-if="props.showFavoritesGameButton"
        class="absolute bottom-2 border border-blue-900"
        :class="{
          'right-12': props.showPaidGameButton || props.showAddGameInLibraryButton,
          'right-2': !props.showPaidGameButton && !props.showAddGameInLibraryButton,
        }"
        tooltip="Add to my wishlist"
        variant="primary"
        iconMode="stroke"
        iconName="heart"
      />

      <!-- Bouton de téléchargement -->
      <CrzSquareIconButton
        v-if="props.showDownloadButton"
        class="absolute bottom-2 right-2 border border-blue-900"
        tooltip="Download"
        variant="primary"
        iconMode="stroke"
        iconName="download"
        @click="emit('download')"
      />

      <!-- Bouton pour lance le jeu -->
      <CrzSquareIconButton
        v-if="props.showPlayButton"
        class="absolute bottom-2 right-2 border border-blue-900"
        tooltip="Play"
        variant="primary"
        iconMode="stroke"
        iconName="play"
        @click="emit('play')"
      />

      <!-- Bouton pour ajouter le jeu à la bibliothèque -->
      <CrzSquareIconButton
        v-if="props.showAddGameInLibraryButton"
        class="absolute bottom-2 right-2 border border-blue-900"
        tooltip="Added to my game library"
        variant="primary"
        iconMode="stroke"
        iconName="plus"
        @click="emit('add-to-library')"
      />

      <!-- Bouton pour réparer le jeu installé dans la bibliothèque -->
      <CrzSquareIconButton
        v-if="props.showFixGameInstalledInLibraryButton"
        class="absolute bottom-2 right-12 border border-blue-900"
        tooltip="Modify installation path of the game or repair the installation"
        variant="primary"
        iconMode="fill"
        iconName="fix"
        @click="emit('fixGameInstalledInLibrary')"
      />

      <!-- Bouton pour ouvrir le menu "..." -->
      <EllipsisDropdownMenu
        v-if="shouldShowEllipsisMenu"
        @createDesktopShortcut="emit('createDesktopShortcut')"
        @uninstallGame="emit('uninstallGame')"
        @forceUpdateGame="emit('forceUpdateGame')"
      />
      <!-- Bouton pour acheter le jeu -->
      <a
        v-if="props.showPaidGameButton"
        :href="urlShop"
        target="_blank"
        rel="noopener noreferrer"
        class="cursor-pointer"
      >
        <CrzSquareIconButton
          class="absolute bottom-2 right-2 border border-blue-900"
          tooltip="Paid for the game"
          variant="primary"
          iconMode="fill"
          iconName="cart-plus"
        />
      </a>
    </div>

    <!-- Indicateur de mise à jour -->
    <div
      v-if="props.showUpdateIndicator"
      @click="emit('download')"
      style="margin-top: -10px; margin-bottom: -10px"
      class="mt-2 flex cursor-pointer items-center justify-center rounded bg-red-600 px-3 py-1 text-xs font-bold text-white"
    >
      <CrzIcon color="#ffffff" name="arrows-rotate" view-box="0 0 512 512" :width="14" :height="14" class="mr-2" />
      <span>Update Available</span>
    </div>

    <!-- Titre, sous-titre et plateformes -->
    <div>
      <h3
        v-if="props.title"
        :class="smallText ? 'text-sm sm:text-base' : 'text-base sm:text-xl'"
        class="mb-1.5 font-bold text-white"
      >
        {{ props.title }}
      </h3>
      <p
        v-if="props.showSubTitle"
        :class="smallText ? 'text-xs' : 'text-sm'"
        class="font-bold uppercase text-slate-400"
      >
        <span v-if="!hasSubTitle">
          {{ categoriesStr }}
        </span>
        <slot v-else name="subtitle" />
      </p>
      <div v-if="props.gamePlatform && showPlatforms" class="mt-4 flex flex-wrap items-center gap-4">
        <CrzPlatformsIcons :platforms="props.gamePlatform" />
      </div>
    </div>

    <!-- Effet de barre de chargement au-dessus du bouton -->
    <div v-if="props.showButtonDownloadProgress" class="relative w-full">
      <div class="download-progress-bar" :class="{ 'is-paused': props.isDownloadPaused }">
        <div class="progress" :class="{ 'is-paused': props.isDownloadPaused }"></div>
      </div>
    </div>

    <!-- Bouton "View Download" -->
    <button
      v-if="props.showButtonDownloadProgress"
      @click="goToPageDownloadManager"
      class="w-full px-4 py-2 bg-yellow-500 text-black text-sm font-medium rounded-md shadow-md hover:bg-yellow-600 transition duration-300"
    >
      {{ props.isDownloadPaused ? 'Resume Download' : 'View Download' }}
    </button>
  </component>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import type { ComputedRef, PropType, Ref } from 'vue'

import CrzSquareIconButton from '#src-common/components/buttons/CrzSquareIconButton.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'
import CrzPlatformsIcons from '#src-common/components/ui/CrzPlatformsIcons.vue'
import type GameCategoryModel from '#src-common/core/models/GameCategoryModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'

import EllipsisDropdownMenu from '#src-nuxt/app/components/menus/EllipsisDropdownMenu.vue'

/* TYPES */
/**
 * Props
 * @type {object}
 * @property {string | null} visualGroupClass - Visual group class
 * @property {string | null} pictureFileUrl - Picture file url
 * @property {boolean} smallText - Small text
 * @property {string | null} trailerFileUrl - Trailer file url
 * @property {string | null} logoFileUrl - Logo file url
 * @property {GameCategoryModel[] | null} gameCategory - Game category
 * @property {GamePlatformModel[] | null} gamePlatform - Game platform
 * @property {string | null} title - Title
 * @property {boolean} showPlatforms - Show platforms
 * @property {boolean} showVideo - Show video
 * @property {boolean} showSubTitle - Show subtitle
 * @property {object | string | null} to - To
 * @property {boolean} showDownloadButton - Show download button
 * @property {boolean} showPlayButton - Show play button
 * @property {boolean} showAddGameInLibraryButton - Show add game in library button
 * @property {boolean} upcomingGame - Upcoming game
 * @property {boolean} newGame - New game
 * @property {boolean} showPaidGameButton - Show paid game button
 * @property {boolean} showFixGameInstalledInLibraryButton - Show fix game installed in library button
 * @property {boolean} showEllipsisButton - Show ellipsis button
 * @property {boolean} showUpdateIndicator - Show update indicator
 * @property {boolean} showFavoritesGameButton - Affiche le boutton "coeur" pour ajouter le jeu a la liste d'envie
 * @property {boolean} enableHoverEffect - Enable lors du survol de la carte de jeu un effet de zoom et de translation ou non
 * @property {boolean} showButtonDownloadProgress - Show download progress
 */
type Props = {
  visualGroupClass: string | null
  pictureFileUrl: string | null
  smallText: boolean
  trailerFileUrl: string | null
  logoFileUrl: string | null
  gameCategory: GameCategoryModel[] | null
  gamePlatform: GamePlatformModel[] | null
  title: string | null
  showPlatforms: boolean
  showVideo: boolean
  showSubTitle: boolean
  to: Object | string | null
  showDownloadButton: boolean
  showPlayButton: boolean
  showAddGameInLibraryButton: boolean
  showPaidGameButton: boolean
  showFixGameInstalledInLibraryButton: boolean
  showEllipsisButton: boolean
  showUpdateIndicator: boolean
  upcomingGame: boolean
  newGame: boolean
  showFavoritesGameButton: boolean
  enableHoverEffect: boolean
  showButtonDownloadProgress: boolean
  isDownloadPaused: boolean
}

/* REFS */
const hover: Ref<boolean> = ref(false)
const gameVideoElement: Ref<HTMLVideoElement | null> = ref(null)
const resetTimeout: Ref<NodeJS.Timeout | null> = ref(null)
const trailerPlaybackFailed: Ref<boolean> = ref(false)
const trailerFrameReady: Ref<boolean> = ref(false)

/* PROPS */
const props: Props = defineProps({
  visualGroupClass: {
    type: String,
    required: false,
    default: null,
  },
  pictureFileUrl: {
    type: String,
    required: false,
    default: null,
  },
  smallText: {
    type: Boolean,
    required: false,
    default: false,
  },
  trailerFileUrl: {
    type: String,
    required: false,
    default: null,
  },
  logoFileUrl: {
    type: String,
    required: false,
    default: null,
  },
  gameCategory: {
    type: Array as PropType<GameCategoryModel[]>,
    required: false,
    default: null,
  },
  gamePlatform: {
    type: Array as PropType<GamePlatformModel[]>,
    required: false,
    default: null,
  },
  title: {
    type: String,
    required: false,
    default: null,
  },
  showPlatforms: {
    type: Boolean,
    default: true,
  },
  showVideo: {
    type: Boolean,
    default: true,
  },
  showSubTitle: {
    type: Boolean,
    default: true,
  },
  to: {
    type: [Object, String] as PropType<Object | string>,
    default: null,
  },
  showDownloadButton: {
    type: Boolean,
    default: false,
  },
  showPlayButton: {
    type: Boolean,
    default: false,
  },
  showAddGameInLibraryButton: {
    type: Boolean,
    default: false,
  },
  showPaidGameButton: {
    type: Boolean,
    default: false,
  },
  showFixGameInstalledInLibraryButton: {
    type: Boolean,
    default: false,
  },
  showEllipsisButton: {
    type: Boolean,
    default: false,
  },
  showUpdateIndicator: {
    type: Boolean,
    default: false,
  },
  upcomingGame: {
    type: Boolean,
    default: false,
  },
  newGame: {
    type: Boolean,
    default: false,
  },
  showFavoritesGameButton: {
    type: Boolean,
    default: false,
  },
  enableHoverEffect: {
    type: Boolean,
    default: false,
  },
  showButtonDownloadProgress: {
    type: Boolean,
    default: false,
  },
  isDownloadPaused: {
    type: Boolean,
    default: false,
  },
})

/* DATA */
const urlShop: string = import.meta.env.VITE_WEBSITE_BASE_URL_SHOP

/* EMITS */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  download: []
  play: []
  'add-to-library': []
  fixGameInstalledInLibrary: []
  'open-ellipsis-menu': []
  createDesktopShortcut: []
  uninstallGame: []
  forceUpdateGame: []
}>()

/*COMPUTED*/
// eslint-disable-next-line @typescript-eslint/typedef
const slots = useSlots()
const hasSubTitle: ComputedRef<boolean> = computed(() => {
  return !!slots.subtitle
})
const categoriesStr: ComputedRef<string | undefined> = computed(() => {
  if (!props.gameCategory) return undefined
  return props.gameCategory.map((category: GameCategoryModel) => category.name).join(' / ')
})

const tag: ComputedRef<'div' | 'RouterLink'> = computed(() => {
  if (props.to) {
    return 'RouterLink'
  }
  return 'div'
})

const normalizedTrailerFileUrl: ComputedRef<string | null> = computed((): string | null => {
  const rawTrailerUrl: string = String(props.trailerFileUrl || '').trim()
  if (!rawTrailerUrl || rawTrailerUrl === 'null' || rawTrailerUrl === 'undefined') {
    return null
  }

  return rawTrailerUrl
})

const trailerMimeType: ComputedRef<string | null> = computed((): string | null => {
  const trailerUrl: string | null = normalizedTrailerFileUrl.value
  if (!trailerUrl) {
    return null
  }

  const pathWithoutQueryAndHash: string = trailerUrl.split('#')[0]?.split('?')[0] || trailerUrl
  const extension: string = pathWithoutQueryAndHash.split('.').pop()?.toLowerCase() || ''

  if (extension === 'mp4' || extension === 'm4v') {
    return 'video/mp4'
  }
  if (extension === 'webm') {
    return 'video/webm'
  }
  if (extension === 'ogv' || extension === 'ogg') {
    return 'video/ogg'
  }

  return null
})

const canShowTrailerVideo: ComputedRef<boolean> = computed((): boolean => {
  return props.showVideo && !!normalizedTrailerFileUrl.value && !trailerPlaybackFailed.value
})

const shouldShowEllipsisMenu: ComputedRef<boolean> = computed((): boolean => {
  // Fallback: cards in My Library "installed" / "needs update" should always expose this menu.
  return props.showEllipsisButton || props.showPlayButton || props.showUpdateIndicator
})

watch(
  () => props.trailerFileUrl,
  (): void => {
    trailerPlaybackFailed.value = false
    trailerFrameReady.value = false
    hover.value = false
  },
)

/* METHODS */
/**
 * Play the video
 * @returns {void}
 */
const playVideo: () => void = (): void => {
  if (!canShowTrailerVideo.value) return

  // Annule tout timeout de réinitialisation en attente
  if (resetTimeout.value !== null) {
    clearTimeout(resetTimeout.value)
    resetTimeout.value = null
  }

  hover.value = true
  const video: HTMLVideoElement | null = gameVideoElement.value
  if (video) {
    video.muted = true
    video.play().catch((error: unknown): void => {
      // AbortError est fréquent lors de transitions rapides de hover; ce n'est pas une panne média.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      hover.value = false

      if (error instanceof DOMException && error.name === 'NotSupportedError') {
        trailerPlaybackFailed.value = true
        console.warn(`[CrzGameCard] Trailer source unsupported for "${props.title || 'unknown game'}".`)
        return
      }

      trailerPlaybackFailed.value = true
      console.error('Error playing video:', error)
    })
  }
}

/**
 * Reset the video with debounce
 * @returns {void}
 */
const resetVideo: () => void = (): void => {
  if (!canShowTrailerVideo.value) {
    hover.value = false
    return
  }

  // Ajoute un léger délai avant de réinitialiser la vidéo
  if (resetTimeout.value === null) {
    resetTimeout.value = setTimeout(() => {
      hover.value = false
      const video: HTMLVideoElement | null = gameVideoElement.value
      if (video) {
        video.pause()
        video.currentTime = 0
      }
      resetTimeout.value = null
    }, 100) // Délai de 100ms
  }
}

/**
 * Marque la video comme indisponible lorsqu'une erreur media survient.
 * @returns {void}
 */
const onTrailerPlaybackError: () => void = (): void => {
  trailerPlaybackFailed.value = true
  trailerFrameReady.value = false
  hover.value = false
}

/**
 * Marque la video comme prete des que la premiere frame est disponible.
 * @returns {void}
 */
const onTrailerLoadedData: () => void = (): void => {
  trailerFrameReady.value = true
}

/**
 * Redirige l'utilisateur vers la page du gestionnaire de téléchargement
 * @returns {Promise<void>}
 */
const goToPageDownloadManager: () => Promise<void> = async (): Promise<void> => {
  await navigateTo('/home/download-manager')
}
</script>

<style scoped>
/* Conteneur de la barre de chargement */
.download-progress-bar {
  width: 100%;
  height: 4px; /* Barre plus fine */
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  position: absolute;
  bottom: -8px;
  box-shadow: 0 0 6px rgba(255, 223, 89, 0.4);
}

/* Effet de progression ajusté */
.download-progress-bar .progress {
  width: 35%; /* Barre de remplissage plus courte */
  height: 100%;
  background: linear-gradient(90deg, #facc15, #eab308, #ffcc00);
  animation:
    progressAnimation 2.5s infinite ease-in-out,
    glowAnimation 1.5s infinite alternate;
}

.download-progress-bar.is-paused {
  background: rgba(249, 115, 22, 0.25);
  box-shadow: 0 0 6px rgba(249, 115, 22, 0.45);
}

.download-progress-bar .progress.is-paused {
  width: 100%;
  background: linear-gradient(90deg, #fb923c, #f97316, #ea580c);
  animation: pausedGlowAnimation 1.6s infinite ease-in-out;
}

/* Animation de déplacement fluide avec disparition complète */
@keyframes progressAnimation {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  } /* Départ invisible */
  10% {
    opacity: 1;
  } /* Apparition rapide */
  50% {
    transform: translateX(50%);
    opacity: 1;
  } /* Milieu */
  90% {
    opacity: 1;
  } /* Maintien */
  100% {
    transform: translateX(200%);
    opacity: 0;
  } /* Disparition complète */
}

@keyframes pausedGlowAnimation {
  0% {
    opacity: 0.45;
  }
  50% {
    opacity: 0.95;
  }
  100% {
    opacity: 0.45;
  }
}

/* Effet de lueur subtil */
@keyframes glowAnimation {
  0% {
    box-shadow: 0 0 4px rgba(255, 223, 89, 0.3);
  }
  100% {
    box-shadow: 0 0 10px rgba(255, 223, 89, 0.7);
  }
}
</style>
