import { defineNuxtPlugin } from '#app'
import { vTooltip } from 'floating-vue'

// eslint-disable-next-line @typescript-eslint/typedef
export default defineNuxtPlugin((nuxtApp): void => {
  nuxtApp.vueApp.directive('tooltip', vTooltip)
})
