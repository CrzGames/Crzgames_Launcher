import { defineStore } from 'pinia'

import type GameBinaryModel from '#src-common/core/models/GameBinaryModel'
import type GameModel from '#src-common/core/models/GameModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'
import { GameService } from '#src-common/core/services/GameService'

import { TauriService } from '#src-core/services/TauriService'
import type { SystemOSInfo } from '#src-core/services/TauriService'

/* TYPES */
/**
 * Game store state
 * @type {object} GameStoreState
 * @property {GameModel[]} games - Games
 * @property {GameModel[]} gamesSortedByPlatform - Games platforms
 */
type GameStoreState = {
  games: GameModel[]
  gamesSortedByPlatform: GameModel[]
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
  }),
  actions: {
    /**
     * Set games
     * @param {GameModel[]} games - Games
     * @returns {void}
     */
    setGames(games: GameModel[]): void {
      this.games = games
    },

    /**
     * Set games platforms
     * @param {GameModel[]} games - Games
     * @returns {void}
     */
    setGamesSortedByPlatform(games: GameModel[]): void {
      this.gamesSortedByPlatform = games
    },

    /**
     * Get all games
     * @param {string} title - Title
     * @returns {Promise<GameModel[]>} - Games
     */
    async getAllGames(title?: string): Promise<GameModel[]> {
      const games: GameModel[] = await GameService.getAllGames(title)
      const currentSystemOSInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
      const currentOsName: string | undefined = currentSystemOSInfo?.os
      if (currentOsName) {
        this.getAllGamesSortedByPlatform(currentOsName, games)
      }
      this.setGames(games)
      return games
    },

    /**
     * Get games by platform name
     * @param {string} platformName - Platform name
     * @param {GameModel[]} games - Games
     * @returns {GameModel[]} - Games filtered by platform name
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
