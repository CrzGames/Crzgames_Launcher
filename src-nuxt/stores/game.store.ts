import { defineStore } from 'pinia'

import GameLoader from '#src-common/core/loaders/GameLoader'
import type GameBinaryModel from '#src-common/core/models/GameBinaryModel'
import type GameCategoryModel from '#src-common/core/models/GameCategoryModel'
import type GameModel from '#src-common/core/models/GameModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'
import type { iGameBinaryCommand } from '#src-common/core/services/GameBinaryService'
import type { iGameCommand, iUpdateGameCommand } from '#src-common/core/services/GameService'

import { TauriService } from '#src-core/services/TauriService'
import type { SystemOSInfo } from '#src-core/services/TauriService'

import { useAppStore } from '#src-nuxt/stores/app.store'

const { $notyf } = useNuxtApp()

// eslint-disable-next-line @typescript-eslint/typedef
export const useGameStore = defineStore('gameStore', {
  // eslint-disable-next-line jsdoc/require-returns
  /**
   * State
   */
  state: () => ({
    _games: [] as GameModel[],
    _gamesPlatforms: [] as GameModel[],
  }),
  actions: {
    /**
     * Set games
     * @param {GameModel[]} games - Games
     * @returns {void}
     */
    setGames(games: GameModel[]): void {
      this._games = games
    },

    /**
     * Set games platforms
     * @param {GameModel[]} games - Games
     * @returns {void}
     */
    setGamesPlatforms(games: GameModel[]): void {
      this._gamesPlatforms = games
    },

    /**
     * Get all games
     * @param {string} title - Title
     * @returns {Promise<GameModel[]>} - Games
     */
    async getAllGames(title?: string): Promise<GameModel[]> {
      const games: GameModel[] = await GameLoader.getAll(title)
      const currentSystemOSInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
      const currentOsName: string | undefined = currentSystemOSInfo?.os
      if (currentOsName) {
        this.getGamesByPlatformName(currentOsName, games)
      }
      this.setGames(games)
      return games
    },

    /**
     * get Game by id
     * @param {number} id - Game id
     * @returns {Promise<GameModel | null>} - Game
     */
    async getGameById(id: number): Promise<GameModel | null> {
      return await useAppStore().execWithPending(async (): Promise<GameModel> => {
        return await GameLoader.getGameById(id)
      })
    },

    /**
     * Find game by id
     * @param {number} id - Game id
     * @returns {GameModel | undefined} - Game
     */
    findById(id: number): GameModel | undefined {
      return this.games.find((game: GameModel): boolean => game.id === id)
    },

    /**
     * delete game
     * @param {number} gameId - Game id
     * @returns {Promise<void>} - void
     */
    async deleteGame(gameId: number): Promise<void> {
      await useAppStore().execWithPending(async (): Promise<void> => {
        await GameLoader.deleteGame(gameId)
        $notyf.success('Game deleted successfully')
      })
    },

    /**
     * Create game
     * @param {iGameCommand} game - Game
     * @returns {Promise<void>} - void
     */
    async createGame(game: iGameCommand): Promise<void> {
      await useAppStore().execWithPending(async (): Promise<void> => {
        await GameLoader.createGame(game)
        $notyf.success('Game created successfully')
      })
    },

    /**
     * Update game
     * @param {iUpdateGameCommand} game - Game
     * @returns {Promise<void>} - void
     */
    async updateGame(game: iUpdateGameCommand): Promise<void> {
      await useAppStore().execWithPending(async (): Promise<void> => {
        await GameLoader.updateGame(game)
        $notyf.success('Game updated successfully')
      })
    },

    /**
     * Create game binary
     * @param {GameModel} game - Game
     * @param {iGameBinaryCommand} binary - Binary
     * @returns {Promise<void>} - void
     */
    async createGameBinary(game: GameModel, binary: iGameBinaryCommand): Promise<void> {
      await useAppStore().execWithPending(async (): Promise<void> => {
        const convertedGame: iUpdateGameCommand = this.convertToUpdateGameCommand(game)
        await this.updateGame({
          ...convertedGame,
          binaries: [...convertedGame.binaries, binary],
        })
      })
    },

    /**
     * Get platform by game id
     * @param {number} id - Game id
     * @returns {Promise<GameModel | null>} - Game
     */
    async getPlatformByGameId(id: number): Promise<GameModel | null> {
      return await useAppStore().execWithPending(async (): Promise<GameModel> => {
        return await GameLoader.getPlatformByGameId(id)
      })
    },

    /**
     * Get binaries by game id
     * @param {number} id - Game id
     * @returns {Promise<GameModel | null>} - Game
     */
    async getBinariesByGameId(id: number): Promise<GameModel | null> {
      return await useAppStore().execWithPending(async (): Promise<GameModel> => {
        return await GameLoader.getBinariesByGameId(id)
      })
    },

    /**
     * Get categories by game id
     * @param {number} id - Game id
     * @returns {Promise<GameModel | null>} - Game
     */
    async getCategoriesByGameId(id: number): Promise<GameModel | null> {
      return await useAppStore().execWithPending(async (): Promise<GameModel> => {
        return await GameLoader.getCategoriesByGameId(id)
      })
    },

    /**
     * Get games by platform name
     * @param {string} platformName - Platform name
     * @param {GameModel[]} games - Games
     * @returns {GameModel[]} - Games filtered by platform name
     */
    getGamesByPlatformName(platformName: string, games: GameModel[]): GameModel[] {
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

      this.setGamesPlatforms(gamesPlatforms)
      return gamesPlatforms
    },

    /**
     * Convert to update game command
     * @param {GameModel} game - Game
     * @returns {iUpdateGameCommand} - Update game command
     */
    convertToUpdateGameCommand(game: GameModel): iUpdateGameCommand {
      return {
        id: game.id,
        title: game.title,
        upcomingGame: game.upcoming_game,
        newGame: game.new_game,
        trailerFilesId: game.trailer_files_id || -1,
        logoFilesId: game.logo_files_id || -1,
        pictureFileId: game.picture_files_id || -1,
        trailerPathFilename: game.trailerFile.pathfilename || '',
        trailerBucketName: game.trailerFile.bucket.name || '',
        picturePathFilename: game.pictureFile.pathfilename || '',
        pictureBucketName: game.pictureFile.bucket.name || '',
        logoPathFilename: game.logoFile.pathfilename || '',
        logoBucketName: game.logoFile.bucket.name || '',
        categoryIds: game.gameCategory.map((category: GameCategoryModel) => category.id),
        platformIds: game.gamePlatform.map((platform: GamePlatformModel) => platform.id),
        binaries: game.gameBinary.map((binary: GameBinaryModel) => {
          return {
            pathfilename: binary.file.pathfilename || '',
            bucketName: binary.file.bucket.name || '',
            platformId: binary.game_platforms_id,
          }
        }),
        description: game.description,
      }
    },
  },
  getters: {
    // eslint-disable-next-line jsdoc/require-returns
    /**
     * Games
     * @param {any} state - State
     */
    // eslint-disable-next-line @typescript-eslint/typedef
    games: (state): GameModel[] => state._games,
    // eslint-disable-next-line jsdoc/require-returns
    /**
     * Games platforms
     * @param {any} state - State
     */
    // eslint-disable-next-line @typescript-eslint/typedef
    gamesPlatforms: (state): GameModel[] => state._gamesPlatforms,
  },
})
