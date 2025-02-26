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
          <h3 class="text-base font-bold text-white">Repair Game Installation</h3>
        </div>
      </div>

      <!-- Description -->
      <div class="grid gap-3 rounded-lg bg-yellow-100 p-4">
        <h4 class="text-base font-bold text-red-600">Important: Read Carefully</h4>
        <ul class="list-disc pl-5">
          <li class="text-sm text-black">
            If you have moved your game folder and the game is already installed, simply choose the new path and click
            on the "Verify Installation" button.
          </li>
          <li class="mt-4 text-sm text-black">
            If you are unable to launch the game, you can either select a path to reinstall the entire game or select
            the path of your current game folder to reinstall only the necessary missing files.
          </li>
        </ul>
      </div>

      <div class="grid gap-3">
        <h3 class="text-sm font-medium uppercase text-zinc-300">Game installation path</h3>
        <Divider />
        <div class="flex items-center justify-between">
          <p>
            {{ truncatedPath }}
          </p>
          <CrzButton @click.prevent="emit('changePath')" size="sm">
            <span class="flex items-center gap-2">
              <span>Change</span>
              <CrzIcon name="edit" mode="stroke" :width="18" :height="18" />
            </span>
          </CrzButton>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="props.showFixInstallationInformationsError" class="mt-4 rounded-lg bg-red-500 p-4">
        <p class="mb-2 font-semibold text-white">Game not detected !</p>
        <p class="text-sm text-white">
          Please make sure the game is installed in the correct path or change the installation path to the correct
          location. <br /><br />
          Otherwise reinstall the full game via the button below
        </p>
        <CrzButton class="mt-2" @click.prevent="emit('repair-full-installation')" type="button">
          <span class="flex items-center gap-2">
            <span>Reinstall the full game</span>
          </span>
        </CrzButton>
      </div>

      <!-- Missing Files Error Message -->
      <div v-if="props.showFixInstallationInformationsError2" class="mt-4 rounded-lg bg-yellow-500 p-4">
        <p class="mb-2 font-semibold text-white">Game detected !</p>
        <p class="text-sm text-white">
          The game is detected, but some files are missing. <br />
          Please make sure all necessary files are in place or repair the installation.
        </p>
        <CrzButton
          class="mt-2 bg-white text-yellow-500 hover:bg-gray-100"
          @click.prevent="emit('repair')"
          type="button"
        >
          <span class="flex items-center gap-2">
            <span>Repair Installation</span>
          </span>
        </CrzButton>
      </div>

      <!-- Success Message -->
      <div v-if="props.showFixInstallationInformationsSuccess" class="mt-4 rounded-lg bg-green-500 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="mb-2 font-semibold text-white">Game detected !</p>
            <p class="text-sm text-white">
              The game files are correct, but the installation path was updated. <br />
              All necessary files are in place.
            </p>
            <CrzButton
              class="mt-2 bg-white text-yellow-500 hover:bg-gray-100"
              @click.prevent="emit('saveQuit')"
              type="button"
            >
              <span class="flex items-center gap-2">
                <span>Save and Quit</span>
              </span>
            </CrzButton>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div></div>
      <div class="flex items-center justify-end space-x-2">
        <button
          @click="emit('cancel')"
          type="button"
          class="translate-y-0 transform rounded-lg border border-gray-500 bg-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 duration-100 hover:bg-gray-600 hover:text-white focus:z-10 focus:outline-none active:translate-y-1"
        >
          Cancel
        </button>

        <CrzButton :disabled="!meta.valid" :load="props.buttonLoading" type="submit">
          {{ props.buttonLoading ? 'Loading...' : 'Verify Installation' }}
        </CrzButton>
      </div>
    </div>
  </Form>
</template>

<script lang="ts" setup>
import { Form } from 'vee-validate'
import CrzButton from '#src-common/components/buttons/CrzButton.vue'
import Divider from '#src-nuxt/components/ui/Divider.vue'
import type { ComputedRef, PropType } from 'vue'
import type { PathInstallLocation } from '~~/src-core/services/TauriService'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'

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
 * @property {boolean} showFixInstallationInformationsError - The show fix installation informations error state
 */
type Props = {
  imageUrl: string | null
  gameTitle: string
  fileSize: number
  buttonLoading: boolean
  gamePathInstallLocation: PathInstallLocation
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
  buttonLoading: {
    type: Boolean,
    default: false,
  },
  gamePathInstallLocation: {
    type: Object as PropType<PathInstallLocation>,
    required: true,
  },
  isSufficientDiskSpaceAvailable: {
    type: Boolean,
    default: false,
  },
  showFixInstallationInformationsError: {
    type: Boolean,
    default: false,
  },
  showFixInstallationInformationsSuccess: {
    type: Boolean,
    default: false,
  },
  showFixInstallationInformationsError2: {
    type: Boolean,
    default: false,
  },
})

/* EMIT */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  submit: []
  cancel: []
  changePath: []
  repair: []
  'repair-full-installation': []
  saveQuit: []
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
