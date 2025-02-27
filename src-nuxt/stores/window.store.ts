import { defineStore } from 'pinia'

// eslint-disable-next-line @typescript-eslint/typedef
export const useWindowStore = defineStore('window', {
  // eslint-disable-next-line jsdoc/require-returns
  /**
   * State
   */
  state: () => ({
    isLoading: false,
  }),
  actions: {
    /**
     * Set loading
     * @param {boolean} loading - loading
     * @returns {void}
     */
    setLoading(loading: boolean): void {
      this.isLoading = loading
    },
  },
})
