import { defineNuxtPlugin } from '#app'
import clickOutside from '@/directives/clickOutSide-directive'

// eslint-disable-next-line @typescript-eslint/typedef
export default defineNuxtPlugin((nuxtApp): void => {
  nuxtApp.vueApp.directive('clickOutSide', clickOutside)
})
