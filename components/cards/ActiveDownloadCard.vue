<template>
  <div class="flex flex-wrap gap-6 rounded-2xl bg-zinc-900 px-4 py-4">
    <img v-if="props.imageUrl" :src="props.imageUrl" :alt="props.title" class="h-36 w-24 rounded-md object-cover" />

    <div class="flex max-w-lg flex-1 flex-col gap-1">
      <h2 v-if="props.title" class="text-base font-bold sm:text-lg">
        {{ props.title }}
      </h2>

      <!-- PROGRESS BAR -->
      <div class="flex items-center gap-6">
        <ProgressBar v-if="props.showProgress" :progress="props.progress" />
        <div class="flex items-center gap-3">
          <PlayPauseButton :isPlaying="props.isPlaying" @play="handlePlayPause" @pause="handlePlayPause" />
          <CrzSquareIconButton tooltip="Cancel download" variant="red" iconName="x" @click="handleCancel" />
        </div>
      </div>

      <!-- Download Infos -->
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

    <!-- DOWNLOAD SIZE -->
    <div class="ml-14 flex flex-col gap-1">
      <p class="font-serif text-sm font-medium text-zinc-400">Download Rate</p>
      <p class="font-medium">{{ props.speed }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { TauriService } from '@/services/TauriService'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import PlayPauseButton from '@/components/buttons/PlayPauseButton.vue'
import CrzSquareIconButton from '@/common/components/buttons/CrzSquareIconButton.vue'

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
