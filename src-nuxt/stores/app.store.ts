import { defineStore } from 'pinia'
import { createLogger } from '~~/src-core/utils/logger'
import type { Logger } from '~~/src-core/utils/logger'

/**
 * Instance du logger pour tracer des événements du store de l'application
 * - Utilise createLogger avec un contexte spécifique à "AppStore"
 * @type {Logger}
 */
const logger: Logger = createLogger('AppStore')

/* TYPES */
/**
 * AppStoreState permet de définir l'état du store de l'application.
 * @type {object} AppStoreState
 * @property {boolean} pending - The pending state
 * @property {string | null} previousUrl - The previous URL
 */
type AppStoreState = {
  pending: boolean
  previousUrl: string | null
}

/**
 * AppStore permet de gérer l'état de l'application, le chargement entre les requêtes, etc.
 */

// eslint-disable-next-line @typescript-eslint/typedef
export const useAppStore = defineStore('appStore', {
  /**
   * Initialise l'état du store de l'application.
   * @returns {AppStoreState} - Retourne l'état initial du store de l'application
   */
  state: (): AppStoreState => ({
    pending: false,
    previousUrl: null,
  }),
  actions: {
    /**
     * Permet de définir l'état de chargement
     * @param {boolean} pending - Le statut de chargement
     * @returns {void}
     */
    setPending(pending: boolean): void {
      this.pending = pending
    },
    /**
     * Set l'url précédente
     * @param {string} url - L'url précédente
     * @returns {void}
     */
    setPreviousUrl(url: string): void {
      this.previousUrl = url
    },
    /**
     * Execute une fonction avec un état de chargement
     * @template T
     * @param {() => Promise<T>} func - La fonction à exécuter
     * @returns {Promise<T>} - Retourne une promesse de type T
     */
    async execWithPending<T>(func: () => Promise<T>): Promise<T> {
      try {
        this.setPending(true)
        return await func()
      } catch (error: unknown) {
        logger.error('[execWithPending] error', error as Error)
        this.setPending(false)
        return Promise.reject(error)
      } finally {
        this.setPending(false)
      }
    },
  },
})
