<template>
  <div
    v-if="props.show"
    class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30 transition-opacity duration-300"
  >
    <div class="relative w-full max-w-2xl p-4 flex flex-col" :style="{ maxHeight: 'calc(100vh - 40px)' }">
      <!-- Modal content -->
      <div
        class="relative rounded-lg shadow-lg transition-opacity duration-300 flex flex-col"
        :class="props.bgClass"
        :style="{ maxHeight: 'calc(100vh - 40px)' }"
      >
        <!-- Modal header -->
        <div
          class="flex items-start justify-between rounded-t border-gray-600 p-4"
          :class="{ 'border-b': props.title }"
        >
          <h3 v-if="props.title" class="text-xl font-semibold text-white">
            {{ props.title }}
          </h3>
          <button
            @click="setShow(false)"
            data-modal-toggle="authentication-modal"
            type="button"
            class="absolute right-2.5 top-3 ml-auto inline-flex items-center rounded-lg bg-transparent p-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <CrzIcon name="x" />
          </button>
        </div>

        <!-- Modal body (scrollable uniquement si nécessaire) -->
        <div class="space-y-6 p-6 flex-grow overflow-auto">
          <slot />
        </div>

        <!-- Modal footer -->
        <div
          v-if="props.showLeftButton || props.showRightButton"
          class="flex items-center justify-end space-x-2 rounded-b border-t border-gray-600 p-6"
        >
          <button
            v-if="props.showLeftButton"
            @click="onCancel"
            type="button"
            class="translate-y-0 transform rounded-lg border border-gray-500 bg-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 duration-100 hover:bg-gray-600 hover:text-white focus:z-10 focus:outline-none active:translate-y-1"
          >
            Cancel
          </button>
          <CrzButton v-if="props.showRightButton" type="button" @click="onOK"> Confirm </CrzButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CrzButton from '#src-common/components/buttons/CrzButton.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'

/**
 * Modal component
 * @type {Props}
 * @property {boolean} show - Show the modal
 * @property {boolean} showLeftButton - Show the left button
 * @property {boolean} showRightButton - Show the right button
 * @property {string | null} title - The title
 * @property {string} bgClass - The background class
 */
type Props = {
  show: boolean
  showLeftButton: boolean
  showRightButton: boolean
  title: string | null
  bgClass: string
}

/* PROPS */
const props: Props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  showLeftButton: {
    type: Boolean,
    default: true,
  },
  showRightButton: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: null,
  },
  bgClass: {
    type: String,
    default: 'bg-gray-900',
  },
})

/* EMITS */
// eslint-disable-next-line @typescript-eslint/typedef
const emit = defineEmits<{
  cancel: []
  ok: []
  'update:show': [value: boolean]
}>()

/* LIFECYCLE HOOKS */
onMounted((): void => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted((): void => {
  window.removeEventListener('keydown', handleKeyDown)
})

/* METHODS */
/**
 * Ferme la modal si la touche ESC est pressée
 * @param {KeyboardEvent} event - L'événement clavier
 * @returns {void}
 */
const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && props.show) {
    setShow(false)
  }
}

/**
 * Set show method
 * @param {boolean} value - The value
 * @returns {void}
 */
const setShow: (value: boolean) => void = (value: boolean): void => emit('update:show', value)

/**
 * On cancel method
 * @returns {void}
 */
const onCancel: () => void = (): void => {
  setShow(false)
  emit('cancel')
}

/**
 * On ok method
 * @returns {void}
 */
const onOK: () => void = (): void => {
  setShow(false)
  emit('ok')
}
</script>

<style lang="scss" scoped>
.transition-all {
  transition-property: opacity, top;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 0.5s;
}
</style>
