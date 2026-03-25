<template>
  <CrzButton
    :variant="props.isPlaying ? 'primary' : 'green'"
    v-tooltip.top.auto="props.isPlaying ? 'Pause download' : 'Resume download'"
    @click.stop.prevent="props.isPlaying ? emit('pause') : emit('play')"
    class="h-10 w-10 min-w-10 px-0 py-0 flex items-center justify-center"
    size="sm"
  >
    <CrzIcon v-if="props.isPlaying" class="pointer-events-none" name="pause" mode="stroke" :width="20" :height="20" />
    <CrzIcon v-else class="pointer-events-none" name="play" mode="stroke" :width="20" :height="20" />
  </CrzButton>
</template>

<script lang="ts" setup>
import CrzButton from '#src-common/components/buttons/CrzButton.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'

/**
 * Play pause button component
 * @type {Props}
 * @property {boolean} isPlaying - Is the download playing
 */
type Props = {
  isPlaying: boolean
}

/* PROPS */
const props: Props = defineProps({
  isPlaying: {
    type: Boolean,
    required: false,
    default: false,
  },
})

/* EMITS */
const emit: (event: 'play' | 'pause', ...args: any[]) => void = defineEmits(['play', 'pause'])
</script>
