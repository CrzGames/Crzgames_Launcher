<template>
  <CrzModal
    v-if="props.show"
    :show="props.show"
    :show-left-button="false"
    :show-right-button="false"
    bgClass="bg-blue-800"
    @update:show="emit('close')"
  >
    <FixGameInstalledInLibraryForm
      v-if="props.gameTitle && props.gamePathInstallLocation"
      :imageUrl="props.imageUrl"
      :gameTitle="props.gameTitle"
      :fileSize="props.fileSize"
      :gamePathInstallLocation="props.gamePathInstallLocation"
      :isSufficientDiskSpaceAvailable="props.isSufficientDiskSpaceAvailable"
      :showFixInstallationInformationsError="props.showFixInstallationInformationsError"
      :showFixInstallationInformationsSuccess="props.showFixInstallationInformationsSuccess"
      :showFixInstallationInformationsError2="props.showFixInstallationInformationsError2"
      @update:createDesktopShortcut="emit('update:createDesktopShortcut', $event)"
      @submit="emit('verifyInstallationGame')"
      @cancel="emit('close')"
      @changePath="emit('changePath')"
      @repair="emit('repair')"
      @repair-full-installation="emit('repair-full-installation')"
      @saveQuit="emit('saveQuit')"
    />
  </CrzModal>
</template>

<script lang="ts" setup>
import CrzModal from '#src-common/components/modals/CrzModal.vue'
import type { PathInstallLocation } from '#src-core/services/TauriService'
import FixGameInstalledInLibraryForm from '#src-nuxt/components/forms/FixGameInstalledInLibraryForm.vue'
import type { PropType } from 'vue'

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
  showFixInstallationInformationsError: boolean
  showFixInstallationInformationsError2: boolean
  showFixInstallationInformationsSuccess: boolean
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
  showFixInstallationInformationsError: {
    type: Boolean,
    default: false,
  },
  showFixInstallationInformationsError2: {
    type: Boolean,
    default: false,
  },
  showFixInstallationInformationsSuccess: {
    type: Boolean,
    default: false,
  },
})

/* EMITS */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  close: []
  changePath: []
  'update:createDesktopShortcut': [checked: boolean]
  verifyInstallationGame: []
  repair: []
  'repair-full-installation': []
  saveQuit: []
}>()
</script>
