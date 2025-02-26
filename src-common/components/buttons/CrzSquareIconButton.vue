<template>
  <CrzButton
    v-if="props.iconName"
    v-tooltip="{
      content: props.tooltip,
    }"
    @click="emit('click')"
    :variant="props.variant"
    class="h-8 w-8 px-0 py-0"
    size="sm"
  >
    <CrzIcon
      class="absolute"
      :name="props.iconName"
      :mode="props.iconMode"
      :width="props.iconWidth"
      :height="props.iconHeight"
    />
  </CrzButton>
</template>

<script lang="ts" setup>
import CrzButton from '#src-common/components/buttons/CrzButton.vue'
import CrzIcon from '#src-common/components/ui/CrzIcon.vue'

/**
 * Square icon button component
 * @type {Props}
 * @property {string | null} tooltip - The tooltip
 * @property {string} variant - The variant
 * @property {string} iconName - The icon name
 * @property {string} iconMode - The icon mode
 * @property {number} iconWidth - The icon width
 * @property {number} iconHeight - The icon height
 */
type Props = {
  tooltip: string | null
  variant: string
  iconName: string
  iconMode: string
  iconWidth: number
  iconHeight: number
}

/* PROPS */
const props: Props = defineProps({
  tooltip: {
    type: String,
    required: false,
    default: null,
  },
  variant: {
    type: String,
    required: false,
    default: 'primary',
  },
  iconName: {
    type: String,
    required: true,
  },
  iconMode: {
    type: String,
    required: false,
    default: 'fill',
  },
  iconWidth: {
    type: Number,
    required: false,
    default: 20,
  },
  iconHeight: {
    type: Number,
    required: false,
    default: 20,
  },
})

/* EMITS */
const emit: (event: 'click', ...args: any[]) => void = defineEmits(['click'])
</script>
