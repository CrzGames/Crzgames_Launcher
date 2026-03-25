import { defineNuxtPlugin } from '#app'
import { Notyf } from 'notyf'

/**
 * Minimal Nuxt app shape required by this plugin.
 */
type NotifyPluginApp = {
  provide: (name: string, value: unknown) => void
}

/**
 * Register Notyf globally for UI notifications.
 * @param {NotifyPluginApp} nuxtApp - Nuxt application instance.
 * @returns {void}
 */
export default defineNuxtPlugin((nuxtApp: NotifyPluginApp): void => {
  const notyf: Notyf = new Notyf({
    dismissible: true,
    position: {
      x: 'right',
      y: 'top',
    },
  })

  nuxtApp.provide('notyf', notyf)
})
