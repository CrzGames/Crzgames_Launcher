import { defineNuxtPlugin } from '#app'
import { vTooltip } from 'floating-vue'

/**
 * Plugin de directive pour les tooltips, permet d'utiliser `v-tooltip` dans les composants,
 * utilisé pour afficher des informations supplémentaires sur un élément lorsqu'on le survole
 * @param {any} nuxtApp - L'application Nuxt
 * @returns {void}
 */
export default defineNuxtPlugin((nuxtApp: any): void => {
  // Fournir `vTooltip` à l'ensemble de l'application en tant que directive
  nuxtApp.vueApp.directive('tooltip', vTooltip)
})
