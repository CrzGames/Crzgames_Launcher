<template>
  <CrzModal
    v-if="props.show !== undefined"
    :title="props.title"
    :show="props.show"
    @update:show="$emit('update:show', $event)"
    @cancel="$emit('cancel')"
    @ok="onOk"
    bgClass="bg-blue-800"
  >
    <p class="message">
      {{ props.message }}
    </p>
  </CrzModal>
</template>

<script lang="ts" setup>
import CrzModal from '#src-common/components/modals/CrzModal.vue'

/**
 * Confirm modal component
 * @type {Props}
 * @property {boolean} show - Show the modal
 * @property {string} title - The title
 * @property {string} message - The message
 */
type Props = {
  show: boolean
  title: string
  message: string
}

/* PROPS */
const props: Props = defineProps({
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
})

/* EMITS */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  cancel: []
  ok: []
  'update:show': [value: boolean]
}>()

/* METHODS */
/**
 * On ok method
 */
const onOk: () => void = (): void => {
  emit('ok')
}
</script>

<style lang="scss" scoped>
.message {
  color: white;
}
</style>
