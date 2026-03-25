import { defineNuxtPlugin } from '#app'

import clickOutside from '#src-nuxt/app/directives/clickOutSide-directive'

/**
 * Minimal Nuxt app shape required by this plugin.
 */
type ClickOutsidePluginApp = {
  vueApp: {
    directive: (name: string, directive: unknown) => void
  }
}

/**
 * Register the click-outside directive globally.
 * @param {ClickOutsidePluginApp} nuxtApp - Nuxt application instance.
 * @returns {void}
 */
export default defineNuxtPlugin((nuxtApp: ClickOutsidePluginApp): void => {
  nuxtApp.vueApp.directive('clickOutSide', clickOutside)
})
