import { defineStore } from 'pinia'

import type GameBinaryModel from '#src-common/core/models/GameBinaryModel'
import type GameModel from '#src-common/core/models/GameModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'
import { GameService } from '#src-common/core/services/GameService'
import type { GamesResponse, PaginationMeta } from '#src-common/core/services/GameService'

import { TauriService } from '#src-core/services/TauriService'
import type { SystemOSInfo } from '#src-core/services/TauriService'

/* TYPES */
/**
 * Game store state
 * @type {object} GameStoreState
 * @property {GameModel[]} games - Jeux
 * @property {GameModel[]} gamesSortedByPlatform - Jeux par plateformes
 * @property {PaginationMeta | null} paginationMeta - Métadonnées de pagination, ou null si non paginé
 */
type GameStoreState = {
  games: GameModel[]
  gamesSortedByPlatform: GameModel[]
  paginationMeta: PaginationMeta | null
  currentSystemOSInfo: SystemOSInfo | null
}

/**
 * GameStore permet de gérer les jeux.
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const useGameStore = defineStore('gameStore', {
  // eslint-disable-next-line jsdoc/require-returns
  /**
   * State
   */
  state: (): GameStoreState => ({
    games: [],
    gamesSortedByPlatform: [],
    paginationMeta: null,
    currentSystemOSInfo: null,
  }),
  actions: {
    /**
     * Set games
     * @param {GameModel[]} games - Jeux
     * @returns {void}
     */
    setGames(games: GameModel[]): void {
      this.games = games
    },

    /**
     * Set games platforms
     * @param {GameModel[]} games - Jeux
     * @returns {void}
     */
    setGamesSortedByPlatform(games: GameModel[]): void {
      this.gamesSortedByPlatform = games
    },

    /**
     * Définir les métadonnées de pagination
     * @param {PaginationMeta | null} meta - Les métadonnées de pagination à définir, ou null si non applicable
     * @returns {void}
     */
    setPaginationMeta(meta: PaginationMeta | null): void {
      this.paginationMeta = meta
    },

    /**
     * Récupère et met en cache les informations OS locales.
     * @param {boolean} force - Force un rafraîchissement du cache
     * @returns {Promise<SystemOSInfo | undefined>} Les informations OS détectées localement.
     */
    async getCurrentSystemOSInfo(force: boolean = false): Promise<SystemOSInfo | undefined> {
      if (!force && this.currentSystemOSInfo) {
        return this.currentSystemOSInfo
      }

      const currentSystemOSInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
      this.currentSystemOSInfo = currentSystemOSInfo || null
      return currentSystemOSInfo
    },

    /**
     * Récupérer tous les jeux
     * @param {string} title - Titre pour filtrer les jeux (optionnel)
     * @param {number} page - Numéro de la page (optionnel)
     * @param {number} perPage - Nombre d'éléments par page (optionnel)
     * @param {string[]} genres - Liste des genres à filtrer (optionnel)
     * @param {string[]} languages - Liste des langues à filtrer (optionnel)
     * @param {string[]} gameModes - Liste des modes de jeu à filtrer (optionnel)
     * @param {boolean} featuredGames - Jeux en vedette (news ou à venir)
     * @param {string} sortBy - Option de tri ('releaseDate', 'titleAsc', 'titleDesc')
     * @returns {Promise<GameModel[]>} - Jeux
     */
    async getAllGames(
      title?: string,
      page?: number,
      perPage?: number,
      genres?: string[],
      languages?: string[],
      gameModes?: string[],
      featuredGames?: boolean,
      sortBy: string = 'releaseDate',
    ): Promise<GameModel[]> {
      const response: GamesResponse = await GameService.getAllGames(
        title,
        page,
        perPage,
        genres,
        languages,
        gameModes,
        featuredGames,
        sortBy,
      )
      let games: GameModel[] = []

      if (Array.isArray(response)) {
        games = response
        this.setPaginationMeta(null)
      } else {
        games = response.data
        this.setPaginationMeta(response.meta)
      }

      const currentSystemOSInfo: SystemOSInfo | undefined = await this.getCurrentSystemOSInfo()
      const currentOsName: string | undefined = currentSystemOSInfo?.os
      if (currentOsName) {
        this.getAllGamesSortedByPlatform(currentOsName, games)
      }
      this.setGames(games)
      return games
    },

    /**
     * Récupérer les jeux par nom de plateforme
     * @param {string} platformName - Nom de la plateforme
     * @param {GameModel[]} games - Jeux
     * @returns {GameModel[]} - Jeux filtrés par nom de plateforme
     */
    getAllGamesSortedByPlatform(platformName: string, games: GameModel[]): GameModel[] {
      const lowerPlatformName: string = platformName.toLowerCase()

      const gamesPlatforms: GameModel[] = games.filter((game: GameModel): boolean => {
        return (
          game.gamePlatform.some(
            (gamePlatform: GamePlatformModel): boolean => gamePlatform.name.toLowerCase() === lowerPlatformName,
          ) &&
          game.gameBinary.some(
            (gameBinary: GameBinaryModel): boolean => gameBinary.gamePlatform.name.toLowerCase() === lowerPlatformName,
          )
        )
      })

      this.setGamesSortedByPlatform(gamesPlatforms)
      return gamesPlatforms
    },
  },
})
