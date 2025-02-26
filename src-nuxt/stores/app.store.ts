import { defineStore } from 'pinia'

/**
 * Type for state of the AppStore
 * @interface AppStore
 * @property {boolean} pending - The pending state
 * @property {string | null} previousUrl - The previous URL
 */
interface AppStore {
  pending: boolean
  previousUrl: string | null
}

// eslint-disable-next-line @typescript-eslint/typedef
export const useAppStore = defineStore('appStore', {
  /**
   * Store the pending state
   * @returns {AppStore} - The state of the App Store
   */
  state: (): AppStore => ({
    pending: false,
    previousUrl: null,
  }),
  actions: {
    /**
     * Set the pending state
     * @param {boolean} pending - The pending state to set
     * @returns {void} - Nothing
     */
    setPending(pending: boolean): void {
      this.pending = pending
    },
    /**
     * Set the previous URL
     * @param {string} url - The previous URL
     * @returns {void} - Nothing
     */
    setPreviousUrl(url: string): void {
      this.previousUrl = url
    },
    /**
     * Execute a function with a pending state
     * @template T
     * @param {() => Promise<T>} func - The function to execute
     * @returns {Promise<T>} - The result of the function
     */
    async execWithPending<T>(func: () => Promise<T>): Promise<T> {
      try {
        this.setPending(true)
        return await func()
      } catch (error) {
        console.error(error)
        this.setPending(false)
        return Promise.reject(error)
      } finally {
        this.setPending(false)
      }
    },
  },
})
