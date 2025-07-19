import { defineStore } from 'pinia'

/* TYPES */
/**
 * Le state du store de la fenêtre
 * @type {object} WindowStoreState
 * @property {boolean} isLoading - Le statut de chargement
 */
type WindowStoreState = {
  isLoading: boolean
}

/**
 * Window store permet de gérer l'état de la fenêtre de l'application lors des chargement entre
 * les changements de fenetre window Tauri
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const useWindowStore = defineStore('window', {
  /**
   * Permet d'initialiser l'état du store de la fenêtre.
   * @returns {WindowStoreState} - Retourne l'état initial du store de la fenêtre
   */
  state: (): WindowStoreState => ({
    isLoading: false,
  }),
  actions: {
    /**
     * Permet de définir l'état de chargement de la fenêtre (loader)
     * @param {boolean} loading - Le statut de chargement
     * @returns {void}
     */
    setLoading(loading: boolean): void {
      this.isLoading = loading
    },
  },
})
