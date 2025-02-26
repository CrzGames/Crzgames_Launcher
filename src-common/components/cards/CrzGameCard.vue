<template>
  <component :is="tag" :to="to" class="grid max-w-sm gap-4">
    <div
      class="relative aspect-[3/4] transform transition-transform duration-300 ease-in-out hover:scale-102"
      :class="[props.visualGroupClass, !props.pictureFileUrl ? 'rounded-md bg-zinc-100' : '']"
      @mouseover="playVideo"
      @mouseout="resetVideo"
    >
      <!-- Étiquette "À VENIR" ou "NOUVEAU" -->
      <span
        v-if="props.upcomingGame"
        class="absolute left-2 top-2 rounded bg-yellow-500 px-2 py-1 text-xs font-bold text-white"
      >
        COMING SOON
      </span>
      <span
        v-else-if="props.newGame"
        class="absolute left-2 top-2 rounded bg-green-500 px-2 py-1 text-xs font-bold text-white"
      >
        NEW
      </span>

      <!-- Image de la couverture du jeu -->
      <img
        class="h-full w-full rounded-md object-cover"
        v-if="props.pictureFileUrl"
        :src="props.pictureFileUrl"
        v-show="!hover"
        :alt="`${props.title} game cover`"
      />

      <!-- Vidéo du jeu -->
      <video
        v-if="showVideo && props.trailerFileUrl"
        muted
        loop
        ref="gameVideoElement"
        class="h-full w-full rounded-md object-cover"
        v-show="hover"
        :src="props.trailerFileUrl"
      />
      <img
        v-if="props.logoFileUrl"
        class="absolute bottom-2 left-1/2 h-auto -translate-x-1/2 transform"
        :src="props.logoFileUrl"
        :alt="`${props.title} game logo`"
      />
      <CrzSquareIconButton
        v-if="props.showDownloadButton"
        class="absolute bottom-2 right-2 border border-blue-900"
        tooltip="Download"
        variant="primary"
        iconMode="stroke"
        iconName="download"
        @click="emit('download')"
      />
      <CrzSquareIconButton
        v-if="props.showPlayButton"
        class="absolute bottom-2 right-2 border border-blue-900"
        tooltip="Play"
        variant="primary"
        iconMode="stroke"
        iconName="play"
        @click="emit('play')"
      />
      <CrzSquareIconButton
        v-if="props.showAddGameInLibraryButton"
        class="absolute bottom-2 right-2 border border-blue-900"
        tooltip="Added to my game library"
        variant="primary"
        iconMode="stroke"
        iconName="plus"
        @click="emit('add-to-library')"
      />
      <CrzSquareIconButton
        v-if="props.showFixGameInstalledInLibraryButton"
        class="absolute bottom-2 right-12 border border-blue-900"
        tooltip="Modify installation path of the game or repair the installation"
        variant="primary"
        iconMode="fill"
        iconName="fix"
        @click="emit('fixGameInstalledInLibrary')"
      />
      <EllipsisDropdownMenu
        v-if="props.showEllipsisButton"
        class="absolute right-20 border border-blue-900"
        @createDesktopShortcut="emit('createDesktopShortcut')"
        @uninstallGame="emit('uninstallGame')"
      />
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
  </component>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import type { Ref, PropType, ComputedRef } from 'vue'
import CrzPlatformsIcons from '#src-common/components/ui/CrzPlatformsIcons.vue'
import type GameCategoryModel from '#src-common/core/models/GameCategoryModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'
import CrzSquareIconButton from '#src-common/components/buttons/CrzSquareIconButton.vue'
import EllipsisDropdownMenu from '#src-nuxt/components/menus/EllipsisDropdownMenu.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'

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
}

/* REFS */
const hover: Ref<boolean> = ref(false)
const gameVideoElement: Ref<HTMLVideoElement | null> = ref(null)

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

/* METHODS */
/**
 * Play the video
 * @returns {void}
 */
const playVideo: () => void = (): void => {
  if (!props.showVideo) return

  hover.value = true
  const video: HTMLVideoElement | null = gameVideoElement.value

  if (video !== null) {
    video.play()
  }
}

/**
 * Reset the video
 * @returns {void}
 */
const resetVideo: () => void = (): void => {
  hover.value = false
  const video: HTMLVideoElement | null = gameVideoElement.value

  if (video) {
    video.pause()
    video.currentTime = 0
  }
}
</script>
