<template>
  <div class="flex items-center gap-4 rounded-2xl bg-zinc-900 p-4 w-full max-w-xl shadow-lg">
    <!-- Image du jeu avec un meilleur affichage -->
    <div class="relative w-24 h-32 flex-shrink-0">
      <img
        v-if="props.imageUrl"
        :src="props.imageUrl"
        :alt="props.title"
        class="w-full h-full rounded-md object-cover border border-gray-700 shadow-md"
      />
    </div>

    <!-- Informations du jeu -->
    <div class="flex flex-1 flex-col gap-2">
      <h2 v-if="props.title" class="text-lg font-bold text-white truncate">
        {{ props.title }}
      </h2>

      <!-- Barre de progression -->
      <ProgressBar v-if="props.showProgress" :progress="props.progress" />

      <!-- Informations supplémentaires -->
      <div class="grid gap-2">
        <div class="flex justify-between">
          <p class="font-serif text-sm font-medium text-zinc-400">Status:</p>
          <p class="font-medium">{{ props.isPlaying ? 'Downloading' : 'Paused' }}</p>
        </div>
        <div v-if="props.isPlaying" class="flex justify-between">
          <p class="font-serif text-sm font-medium text-zinc-400">Remaining time:</p>
          <p class="font-medium">{{ props.remainingTime }}</p>
        </div>
        <div class="flex justify-between">
          <p class="font-serif text-sm font-medium text-zinc-400">Downloaded:</p>
          <p class="font-medium">{{ props.downloaded }} / {{ props.total }}</p>
        </div>
      </div>
    </div>

    <!-- Boutons d'action -->
    <div class="flex flex-col items-center gap-2">
      <PlayPauseButton :isPlaying="props.isPlaying" @play="handlePlayPause" @pause="handlePlayPause" />
      <CrzSquareIconButton tooltip="Cancel download" variant="red" iconName="x" @click="handleCancel" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import CrzSquareIconButton from '#src-common/components/buttons/CrzSquareIconButton.vue'

import { TauriService } from '#src-core/services/TauriService'

import PlayPauseButton from '#src-nuxt/components/buttons/PlayPauseButton.vue'
import ProgressBar from '#src-nuxt/components/ui/ProgressBar.vue'

/**
 * Active download card component
 * @type {Props}
 * @property {string | null} imageUrl - The image url
 * @property {string | null} title - The title
 * @property {number} progress - The progress
 * @property {boolean} showProgress - Show the progress bar
 * @property {boolean} isPlaying - Is the download playing
 * @property {string} downloaded - Downloaded size in human readable format
 * @property {string} total - Total size in human readable format
 * @property {string} speed - Download speed
 * @property {string} remainingTime - Remaining time for download
 * @property {number} gameId - The game id
 * @property {string} pathInstallLocation - The path install location
 */
type Props = {
  imageUrl: string | undefined
  title: string | undefined
  progress: number
  showProgress: boolean
  isPlaying: boolean
  downloaded: string
  total: string
  speed: string
  remainingTime: string
  gameId: number
  pathInstallLocation: string
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
  progress: {
    type: Number,
    required: false,
    default: 0,
  },
  showProgress: {
    type: Boolean,
    required: false,
    default: true,
  },
  isPlaying: {
    type: Boolean,
    required: false,
    default: false,
  },
  downloaded: {
    type: String,
    required: true,
  },
  total: {
    type: String,
    required: true,
  },
  speed: {
    type: String,
    required: true,
  },
  remainingTime: {
    type: String,
    required: true,
  },
  gameId: {
    type: Number,
    required: true,
  },
  pathInstallLocation: {
    type: String,
    required: true,
  },
})

/* EMITS */
const emit: (event: 'play' | 'pause' | 'cancel', ...args: any[]) => void = defineEmits(['play', 'pause', 'cancel'])

/* METHODS */
/**
 * Handles play/pause button click
 */
const handlePlayPause: () => Promise<void> = async (): Promise<void> => {
  if (props.isPlaying) {
    await TauriService.pauseDownloadGame(props.gameId)
    emit('pause')
  } else {
    await TauriService.resumeDownloadGame(props.gameId)
    emit('play')
  }
}

/**
 * Handles cancel button click
 */
const handleCancel: () => void = (): void => {
  emit('cancel')
}
</script>
