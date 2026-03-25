import { defineNuxtPlugin } from '#app'
import { vTooltip } from 'floating-vue'

/**
 * Minimal Nuxt app shape required by this plugin.
 */
type TooltipPluginApp = {
  vueApp: {
    directive: (name: string, directive: unknown) => void
  }
}

/**
 * Register the tooltip directive globally.
 * @param {TooltipPluginApp} nuxtApp - Nuxt application instance.
 * @returns {void}
 */
export default defineNuxtPlugin((nuxtApp: TooltipPluginApp): void => {
  nuxtApp.vueApp.directive('tooltip', vTooltip)
})
