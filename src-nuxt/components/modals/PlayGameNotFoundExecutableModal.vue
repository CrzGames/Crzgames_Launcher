<template>
  <CrzModal
    v-if="props.show"
    :show="props.show"
    :show-left-button="false"
    :show-right-button="false"
    bgClass="bg-blue-800"
    @update:show="emit('cancel')"
  >
    <PlayGameNotFoundExecutableForm
      v-if="props.gameTitle"
      :gamePictureImageUrl="props.gamePictureImageUrl"
      :gameTitle="props.gameTitle"
      :messageError="props.messageError"
      :unstallGame="props.unstallGame"
      @submit="emit('ok')"
      @cancel="emit('cancel')"
      @open-modal-repair="emit('open-modal-repair')"
    />
  </CrzModal>
</template>

<script lang="ts" setup>
import CrzModal from '#src-common/components/modals/CrzModal.vue'

import PlayGameNotFoundExecutableForm from '#src-nuxt/components/forms/PlayGameNotFoundExecutableForm.vue'

/* TYPES */
/**
 * Props
 * @type {Props}
 * @property {string} gamePictureImageUrl - The game picture image url
 * @property {string} gameTitle - The game title
 * @property {boolean} show - The show
 * @property {string} messageError - The message error
 * @property {boolean} unstallGame - The unstall game
 */
type Props = {
  gamePictureImageUrl: string
  gameTitle: string
  show: boolean
  messageError: string
  unstallGame: boolean
}

/* PROPS */
const props: Props = defineProps({
  gamePictureImageUrl: {
    type: String,
    required: true,
    default: null,
  },
  gameTitle: {
    type: String,
    required: true,
  },
  show: {
    type: Boolean,
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

/* EMITS */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  ok: []
  cancel: []
  'open-modal-repair': []
}>()
</script>
