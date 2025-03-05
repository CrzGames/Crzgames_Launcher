import { Notyf } from 'notyf'

/**
 * Permet d'ajouter `notyf` à l'ensemble de l'application en tant que plugin
 * utilisé pour afficher des notifications à l'utilisateur comme des messages d'erreur, de succès, etc.
 * @param {any} nuxtApp - L'application Nuxt
 * @returns {void}
 */
export default defineNuxtPlugin((nuxtApp: any): void => {
  const notyf: Notyf = new Notyf({
    dismissible: true,
    position: {
      x: 'right',
      y: 'top',
    },
  })

  // Fournir `notyf` à l'ensemble de l'application en tant que plugin
  nuxtApp.provide('notyf', notyf)
})
