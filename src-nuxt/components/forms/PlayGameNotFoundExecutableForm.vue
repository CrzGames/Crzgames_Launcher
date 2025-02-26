<template>
  <Form v-slot="{ meta }" @submit="submit" class="space-y-12">
    <div class="grid gap-8">
      <div class="flex flex-wrap gap-4">
        <img
          class="h-14 w-14 rounded-lg object-cover"
          v-if="props.gamePictureImageUrl"
          :src="props.gamePictureImageUrl"
          :alt="props.gameTitle"
        />
        <div class="flex flex-col">
          <h2 v-if="props.gameTitle" class="text-base font-medium text-zinc-300">
            {{ props.gameTitle }}
          </h2>
          <h3 class="text-base font-bold text-red-500">Error {{ messageError }}</h3>
        </div>
      </div>

      <!-- Error Message -->
      <div class="grid gap-3 rounded-lg bg-yellow-100 p-4">
        <h4 class="text-base font-bold text-red-600">Important: Read Carefully</h4>
        <ul class="list-disc pl-5">
          <li class="text-sm text-black" v-if="!props.unstallGame">
            The game folder, files, or executable are missing. <br />
            Please verify the game installation path or repair the installation.
          </li>
          <li class="text-sm text-black" v-if="props.unstallGame">
            The game folder are missing. <br />
            Please verify the game installation path or repair the installation.
          </li>
        </ul>
        <div class="flex">
          <CrzButton @click.prevent="emit('open-modal-repair')" type="button">
            <span class="flex items-center gap-2">
              <span>Open installation repair popup</span>
            </span>
          </CrzButton>
        </div>
      </div>

      <div class="flex items-center justify-end space-x-2">
        <button
          @click="emit('cancel')"
          type="button"
          class="translate-y-0 transform rounded-lg border border-gray-500 bg-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 duration-100 hover:bg-gray-600 hover:text-white focus:z-10 focus:outline-none active:translate-y-1"
        >
          Cancel
        </button>

        <CrzButton :disabled="!meta.valid" type="submit"> Ok </CrzButton>
      </div>
    </div>
  </Form>
</template>

<script lang="ts" setup>
import CrzButton from '#src-common/components/buttons/CrzButton.vue'
import { Form } from 'vee-validate'

/* TYPES */
/**
 * Props
 * @type {Props}
 * @property {string} gamePictureImageUrl - The game picture image url
 * @property {string} gameTitle - The game title
 * @property {string} messageError - The message error
 * @property {boolean} unstallGame - The unstall game
 */
type Props = {
  gamePictureImageUrl: string
  gameTitle: string
  messageError: string
  unstallGame: boolean
}

/* PROPS */
const props: Props = defineProps({
  gamePictureImageUrl: {
    type: String,
    required: true,
  },
  gameTitle: {
    type: String,
    required: true,
  },
  messageError: {
    type: String,
    required: true,
  },
  unstallGame: {
    type: Boolean,
    required: false,
    default: false,
  },
})

/* EMIT */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  submit: []
  cancel: []
  'open-modal-repair': []
}>()

/* METHODS */
/**
 * Submit the form
 * @returns {void} - Nothing
 */
const submit: () => void = (): void => {
  emit('submit')
}
</script>
