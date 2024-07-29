<template>
  <Form v-slot="{ meta }" @submit="submit" class="space-y-12">
    <div class="grid gap-8">
      <div class="flex flex-wrap gap-4">
        <img
          class="h-14 w-14 rounded-lg object-cover"
          v-if="props.imageUrl"
          :src="props.imageUrl"
          :alt="props.gameTitle"
        />
        <div class="flex flex-col">
          <h2 v-if="props.gameTitle" class="text-base font-medium text-zinc-300">
            {{ props.gameTitle }}
          </h2>
          <h3 class="text-base font-bold text-white">Download options</h3>
        </div>
      </div>

      <div class="grid gap-3">
        <h3 class="text-sm font-medium uppercase text-zinc-300">Game installation path</h3>
        <Divider />
        <div class="flex items-center justify-between">
          <p>
            {{ truncatedPath }}
          </p>
          <CrzButton v-if="props.showButtonChangePath" @click.prevent="emit('changePath')" size="sm">
            <span class="flex items-center gap-2">
              <span>Change</span>
              <CrzIcon name="edit" mode="stroke" :width="18" :height="18" />
            </span>
          </CrzButton>
        </div>
      </div>
    </div>

    <div v-if="props.showButtonCreateDesktopShortcut" class="flex items-center justify-between">
      <CrzCheckbox
        id="create-desktop-shortcut"
        label="Create desktop shortcut"
        :checked="createDesktopShortcut"
        @update:checked="emit('update:createDesktopShortcut', $event)"
      />
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <CrzIcon
          :color="isSufficientDiskSpaceAvailable ? '#00ff84' : '#FF3333'"
          name="download"
          mode="stroke"
          :width="18"
          :height="18"
        />
        <p class="text-base font-medium">
          {{ bytesToSize(props.fileSize) }}
        </p>
        <p class="text-sm font-medium text-zinc-300">Disk space required</p>
      </div>
      <div class="flex items-center justify-end space-x-2">
        <button
          @click="emit('cancel')"
          type="button"
          class="translate-y-0 transform rounded-lg border border-gray-500 bg-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 duration-100 hover:bg-gray-600 hover:text-white focus:z-10 focus:outline-none active:translate-y-1"
        >
          Cancel
        </button>

        <CrzButton :disabled="!meta.valid || !isSufficientDiskSpaceAvailable" :load="props.buttonLoading" type="submit">
          {{ props.buttonLoading ? 'Loading...' : 'Download' }}
        </CrzButton>
      </div>
    </div>
  </Form>
</template>

<script lang="ts" setup>
import { Form } from 'vee-validate'
import CrzButton from '@/common/components/buttons/CrzButton.vue'
import Divider from '@/components/ui/Divider.vue'
import type { ComputedRef, PropType } from 'vue'
import type { PathInstallLocation } from '@/services/TauriService'
import CrzIcon from '@/common/components/ui/CrzIcon.vue'
import { bytesToSize } from '@/utils/bytesToSize'
import CrzCheckbox from '@/common/components/ui/CrzCheckbox.vue'

/* TYPES */
/**
 * Component props
 * @type {object}
 * @property {string | null} imageUrl - The image URL
 * @property {string} gameTitle - The game title
 * @property {number | null} fileSize - The file size
 * @property {boolean} buttonLoading - The button loading state
 * @property {PathInstallLocation} gamePathInstallLocation - The game path install location
 * @property {boolean} createDesktopShortcut - The create desktop shortcut state
 * @property {boolean} isSufficientDiskSpaceAvailable - The disk space available state
 */
type Props = {
  imageUrl: string | null
  gameTitle: string
  fileSize: number
  buttonLoading: boolean
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
  buttonLoading: {
    type: Boolean,
    default: false,
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

/* EMIT */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  submit: []
  cancel: []
  changePath: []
  'update:createDesktopShortcut': [checked: boolean]
}>()

/* COMPUTED */
const truncatedPath: ComputedRef<string> = computed(() => {
  const path: string = props.gamePathInstallLocation.pathSystem
  const maxLength: number = 50

  // Si le chemin est plus long que la longueur maximale, tronquez-le.
  return path.length > maxLength ? `...${path.slice(-maxLength)}` : path
})

/* METHODS */
/**
 * Submit the form
 * @returns {void} - Nothing
 */
const submit: () => void = (): void => {
  emit('submit')
}
</script>
