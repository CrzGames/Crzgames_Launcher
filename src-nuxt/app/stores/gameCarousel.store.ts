import { defineStore } from 'pinia'
import { GameCarouselService } from '~~/src-common/core/services/GameCarouselService'

import type { GameCarouselModel } from '#src-common/core/models/GameCarouselModel'

/* TYPES */
/**
 * Game carousel store state
 * @type {object} GameCarouselStoreState
 * @property {GameCarouselModel[]} carousels - carousels
 */
type GameCarouselStoreState = {
  carousels: GameCarouselModel[]
}

/**
 * Game carousel store permet de gérer les carrousels de jeux.
 * Cela permet de gérer les carrousels de jeux affichés sur la page news.
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const useGameCarouselStore = defineStore('gameCarouselStore', {
  /**
   * Permet d'initialiser l'état du store des carrousels de jeux.
   * @returns {GameCarouselStoreState} - Retourne l'état initial du store des carrousels de jeux
   */
  state: (): GameCarouselStoreState => ({
    carousels: [],
  }),
  actions: {
    /**
     * Set carousels
     * @param {GameCarouselModel[]} carousels - carousels
     * @returns {void}
     */
    setCarousels(carousels: GameCarouselModel[]): void {
      this.carousels = carousels
    },

    /**
     * Get all carousels
     * @returns {Promise<GameCarouselModel[]>} - carousels
     */
    async getAllCarousels(): Promise<GameCarouselModel[]> {
      /**
       * Récupère tous les carrousels de jeux.
       */
      const carousels: GameCarouselModel[] = await GameCarouselService.getAllCarousels()

      /**
       * Met à jour les carrousels de jeux.
       */
      this.setCarousels(carousels)

      /**
       * Retourne les carrousels de jeux.
       */
      return carousels
    },
  },
})
