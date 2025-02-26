import { Notyf } from 'notyf'

// eslint-disable-next-line @typescript-eslint/typedef
export default defineNuxtPlugin((nuxtApp): void => {
  const notyf: Notyf = new Notyf({
    dismissible: true,
    position: {
      x: 'right',
      y: 'top',
    },
  })

  // Fournir `notyf` à l'ensemble de l'application
  nuxtApp.provide('notyf', notyf)
})
