import type { Notyf } from 'notyf'

declare module '#app' {
  /**
   * Extend the NuxtApp interface with the $notyf property
   * @interface NuxtApp
   * @property {Notyf} $notyf - The notyf instance
   */
  interface NuxtApp {
    $notyf: Notyf
  }
}
