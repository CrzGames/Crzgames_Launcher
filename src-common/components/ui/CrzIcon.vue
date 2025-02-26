<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    :width="width"
    :height="height"
    :viewBox="viewBox"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="color"
    :aria-labelledby="name"
  >
    <g :fill="mode === 'fill' ? color : undefined" :stroke="mode === 'stroke' ? color : undefined">
      <component :is="iconComponent" />
    </g>
  </svg>
</template>

<script lang="ts" setup>
import { defineProps, computed } from 'vue'
import type { ComputedRef, DefineComponent } from 'vue'
import titleBarClose from '#src-common/components/icons/title-bar-close.vue'
import titleBarMinimize from '#src-common/components/icons/title-bar-minimize.vue'
import titleBarMaximize from '#src-common/components/icons/title-bar-maximize.vue'
import tooltip from '#src-common/components/icons/tool-tip.vue'
import eye from '#src-common/components/icons/eye.vue'
import eyeOff from '#src-common/components/icons/eye-off.vue'
import bookOpen from '#src-common/components/icons/book-open.vue'
import grid from '#src-common/components/icons/grid.vue'
import layers from '#src-common/components/icons/layers.vue'
import download from '#src-common/components/icons/download.vue'
import cicle from '#src-common/components/icons/circle.vue'
import circleCheck from '#src-common/components/icons/circle-check.vue'
import clock from '#src-common/components/icons/clock.vue'
import friend from '#src-common/components/icons/friend.vue'
import logOut from '#src-common/components/icons/log-out.vue'
import settings from '#src-common/components/icons/settings.vue'
import x from '#src-common/components/icons/x.vue'
import play from '#src-common/components/icons/play.vue'
import pause from '#src-common/components/icons/pause.vue'
import chevronDown from '#src-common/components/icons/chevron-down.vue'
import search from '#src-common/components/icons/search.vue'
import edit from '#src-common/components/icons/edit.vue'
import plus from '#src-common/components/icons/plus.vue'
import cartPlus from '#src-common/components/icons/cart-plus.vue'
import fix from '#src-common/components/icons/fix.vue'
import ellipsis from '#src-common/components/icons/ellipsis.vue'
import arrowRotate from '#src-common/components/icons/arrows-rotate.vue'

/* INTERFACES */
/**
 * @interface Props
 * @property {string} name - The icon name
 * @property {number | string} width - The icon width
 * @property {number | string} height - The icon height
 * @property {string} viewBox - The icon viewBox
 * @property {string} mode - The icon mode
 * @property {string} color - The icon color
 */
interface Props {
  name: string
  width: number | string
  height: number | string
  viewBox: string
  mode: string
  color: string
}

/* PROPS */
const props: Props = defineProps({
  name: {
    type: String,
    required: true,
  },
  width: {
    type: [Number, String],
    default: 24,
  },
  height: {
    type: [Number, String],
    default: 24,
  },
  viewBox: {
    type: String,
    default: '0 0 24 24',
  },
  mode: {
    type: String,
    default: 'fill',
  },
  color: {
    type: String,
    default: 'currentColor',
  },
})

/**
 * @type {IconComponent}
 */
type IconComponent = DefineComponent<{}, {}, any>

const iconsMap: Record<string, IconComponent> = {
  'title-bar-close': titleBarClose,
  'title-bar-minimize': titleBarMinimize,
  'title-bar-maximize': titleBarMaximize,
  'tool-tip': tooltip,
  eye: eye,
  'eye-off': eyeOff,
  'book-open': bookOpen,
  grid: grid,
  layers: layers,
  download: download,
  circle: cicle,
  'circle-check': circleCheck,
  clock: clock,
  friend: friend,
  'log-out': logOut,
  settings: settings,
  x: x,
  play: play,
  pause: pause,
  'chevron-down': chevronDown,
  search: search,
  edit: edit,
  plus: plus,
  'cart-plus': cartPlus,
  fix: fix,
  ellipsis: ellipsis,
  'arrows-rotate': arrowRotate,
}

const iconComponent: ComputedRef<IconComponent> = computed(() => iconsMap[props.name])
</script>

<style scoped>
svg {
  display: inline-block;
  vertical-align: baseline;
}
</style>
