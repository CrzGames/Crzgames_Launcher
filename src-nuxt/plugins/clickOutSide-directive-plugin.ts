import { defineNuxtPlugin } from '#app'

import clickOutside from '#src-nuxt/directives/clickOutSide-directive'

/**
 * Plugin de directive pour les clicks en dehors d'un élément, permet d'utiliser `v-click-outside` dans les composants,
 * utilisé pour détecter les clicks en dehors d'un élément et déclencher une action
 * @param {any} nuxtApp - L'application Nuxt
 * @returns {void}
 */
export default defineNuxtPlugin((nuxtApp: any): void => {
  // Fournir `clickOutside` à l'ensemble de l'application en tant que directive
  nuxtApp.vueApp.directive('clickOutSide', clickOutside)
})
