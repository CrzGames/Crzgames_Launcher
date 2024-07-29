import { defineStore } from 'pinia'
import type { iGameLibraryCommand } from '@/common/core/services/GameLibraryService'
import type GameModel from '@/common/core/models/GameModel'
import { useAppStore } from '@/stores/app.store'
const { $notyf } = useNuxtApp()
import { useAuthStore } from '@/stores/auth.store'
import GameLibraryLoader from '@/common/core/loaders/GameLibraryLoader'
import type { SystemOSInfo } from '@/services/TauriService'
import { TauriService } from '@/services/TauriService'
import type GamePlatformModel from '@/common/core/models/GamePlatformModel'
import type GameBinaryModel from '@/common/core/models/GameBinaryModel'

// eslint-disable-next-line @typescript-eslint/typedef
export const useGameLibraryStore = defineStore('gameLibraryStore', {
  // eslint-disable-next-line jsdoc/require-returns
  /**
   * state
   */
  state: () => ({
    _libraryGames: [] as GameModel[],
    _libraryGamesPlatforms: [] as GameModel[],
  }),
  actions: {
    /**
     * setLibraryGames
     * @param {GameModel[]} games - games
     * @returns {void} - void
     */
    setLibraryGames(games: GameModel[]): void {
      this._libraryGames = games
    },

    /**
     * setLibraryGamesPlatforms
     * @param {GameModel[]} games - games
     * @returns {void} - void
     */
    setLibraryGamesPlatforms(games: GameModel[]): void {
      this._libraryGamesPlatforms = games
    },

    /**
     * userHasGame
     * @param {number} gameId - gameId
     * @returns {boolean} - boolean
     */
    userHasGame(gameId: number): boolean {
      return this._libraryGames.some((game: GameModel): boolean => game.id === gameId)
    },

    /**
     * getLibraryGames
     * @param {string} title - title
     * @returns {GameModel[]} - GameModel[]
     */
    async getLibraryGames(title?: string): Promise<GameModel[]> {
      const userId: number | undefined = useAuthStore().user?.id
      if (!userId) return []
      const games: GameModel[] = await GameLibraryLoader.getAllUsersGamesLibrariesByUserId(userId, title)

      const currentSystemOSInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
      const currentOsName: string | undefined = currentSystemOSInfo?.os
      if (currentOsName) {
        this.getLibraryGamesByPlatformName(currentOsName, games)
      }

      this.setLibraryGames(games)
      return games
    },

    /**
     * addGameToUserLibrary
     * @param {number} gameId - gameId
     * @returns {void} - void
     */
    async addGameToUserLibrary(gameId: number): Promise<void> {
      await useAppStore().execWithPending(async (): Promise<void> => {
        const userId: number | undefined = useAuthStore().user?.id
        if (!userId) {
          $notyf.error('You must be logged in to add a game to your library')
          return
        }
        const gameLibraryCommand: iGameLibraryCommand = {
          userId,
          gameId,
        }
        await GameLibraryLoader.addGameToUserLibrary(gameLibraryCommand)
        await this.getLibraryGames()
      })
    },
    /**
     * Get library games by platform name
     * @param {string} platformName - Platform name
     * @param {GameModel[]} games - Games in the library
     * @returns {GameModel[]} - Filtered games by platform name
     */
    getLibraryGamesByPlatformName(platformName: string, games: GameModel[]): GameModel[] {
      const lowerPlatformName: string = platformName.toLowerCase()

      const gamesPlatforms: GameModel[] = games.filter((game: GameModel): boolean => {
        return (
          game.gamePlatform.some(
            (platform: GamePlatformModel): boolean => platform.name.toLowerCase() === lowerPlatformName,
          ) && // Compare in lowercase
          game.gameBinary.some(
            (binary: GameBinaryModel): boolean => binary.gamePlatform.name.toLowerCase() === lowerPlatformName,
          ) // Compare in lowercase
        )
      })

      this.setLibraryGamesPlatforms(gamesPlatforms)
      return gamesPlatforms
    },
  },
  getters: {
    // eslint-disable-next-line jsdoc/require-returns
    /**
     * libraryGames
     * @param {any} state - state
     */
    // eslint-disable-next-line @typescript-eslint/typedef
    libraryGames: (state): GameModel[] => state._libraryGames,
    // eslint-disable-next-line jsdoc/require-returns
    /**
     * libraryGamesPlatforms
     * @param {any} state - state
     */
    // eslint-disable-next-line @typescript-eslint/typedef
    libraryGamesPlatforms: (state): GameModel[] => state._libraryGamesPlatforms,
  },
})
