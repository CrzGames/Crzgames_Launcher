import { defineNuxtPlugin } from '#app'

import clickOutside from '#src-nuxt/directives/clickOutSide-directive'

// eslint-disable-next-line @typescript-eslint/typedef
export default defineNuxtPlugin((nuxtApp): void => {
  nuxtApp.vueApp.directive('clickOutSide', clickOutside)
})
