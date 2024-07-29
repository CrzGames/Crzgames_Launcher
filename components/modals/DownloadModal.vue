<template>
  <CrzModal
    v-if="props.show"
    :show="props.show"
    :show-left-button="false"
    :show-right-button="false"
    bgClass="bg-blue-800"
    @update:show="emit('close')"
  >
    <DownloadForm
      v-if="props.gameTitle && props.gamePathInstallLocation"
      :imageUrl="props.imageUrl"
      :gameTitle="props.gameTitle"
      :fileSize="props.fileSize"
      :gamePathInstallLocation="props.gamePathInstallLocation"
      :createDesktopShortcut="props.createDesktopShortcut"
      :isSufficientDiskSpaceAvailable="isSufficientDiskSpaceAvailable"
      :showButtonCreateDesktopShortcut="props.showButtonCreateDesktopShortcut"
      :showButtonChangePath="props.showButtonChangePath"
      @update:createDesktopShortcut="emit('update:createDesktopShortcut', $event)"
      @submit="emit('download')"
      @cancel="emit('close')"
      @changePath="emit('changePath')"
    />
  </CrzModal>
</template>

<script lang="ts" setup>
import CrzModal from '~/common/components/modals/CrzModal.vue'
import DownloadForm from '@/components/forms/DownloadForm.vue'
import type { PropType } from 'vue'
import type { PathInstallLocation } from '@/services/TauriService'

/* TYPES */
/**
 * Props
 * @type {Props}
 * @property {string | null} imageUrl - The image url
 * @property {string} gameTitle - The game title
 * @property {number | null} fileSize - The file size
 * @property {boolean} show - The show
 * @property {string} title - The title
 * @property {string} message - The message
 * @property {PathInstallLocation} gamePathInstallLocation - The game path install location
 * @property {boolean} createDesktopShortcut - The create desktop shortcut
 * @property {boolean} isSufficientDiskSpaceAvailable - The is sufficient disk space available
 */
type Props = {
  imageUrl: string | undefined
  gameTitle: string
  fileSize: number | undefined
  show: boolean
  title: string
  message: string
  gamePathInstallLocation: PathInstallLocation
  createDesktopShortcut: boolean
  isSufficientDiskSpaceAvailable: boolean
  showButtonCreateDesktopShortcut: boolean
  showButtonChangePath: boolean
}

/* PROPS */
const props: Props = defineProps({
  imageUrl: {
    type: String,
    required: false,
    default: null,
  },
  gameTitle: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: false,
    default: null,
  },
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Confirm',
  },
  message: {
    type: String,
    default: 'Are you sure?',
  },
  gamePathInstallLocation: {
    type: Object as PropType<PathInstallLocation>,
    required: true,
  },
  createDesktopShortcut: {
    type: Boolean,
    default: false,
  },
  isSufficientDiskSpaceAvailable: {
    type: Boolean,
    default: false,
  },
  showButtonCreateDesktopShortcut: {
    type: Boolean,
    default: true,
  },
  showButtonChangePath: {
    type: Boolean,
    default: true,
  },
})

/* EMITS */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  download: []
  close: []
  changePath: []
  'update:createDesktopShortcut': [checked: boolean]
}>()
</script>
