import type GameModel from '#src-common/core/models/GameModel'
import { GameLibraryService } from '#src-common/core/services/GameLibraryService'
import type { iGameLibraryCommand } from '#src-common/core/services/GameLibraryService'
import GameLibraryModel from '#src-common/core/models/GameLibraryModel'
import GameLoader from '#src-common/core/loaders/GameLoader'

/**
 * GameLibraryLoader
 * @class GameLibraryLoader
 */
export default class GameLibraryLoader {
  /**
   * createMany
   * @param {GameLibraryModel[]} gamesLibraries - gamesLibraries
   * @returns {GameLibraryModel[]} - GameLibraryModel[]
   */
  public static createMany(gamesLibraries: GameLibraryModel[]): GameLibraryModel[] {
    return gamesLibraries.map((gameLibrary: GameLibraryModel) => this.create(gameLibrary))
  }

  /**
   * create
   * @param {GameLibraryModel} gameLibrary - gameLibrary
   * @returns {GameLibraryModel} - GameLibraryModel
   */
  public static create(gameLibrary: GameLibraryModel): GameLibraryModel {
    return new GameLibraryModel(gameLibrary)
  }

  /**
   * getAllUsersGamesLibrariesByUserId
   * @param {number} userId - userId
   * @param {string} title - title
   * @returns {GameModel[]} - GameModel[]
   */
  public static async getAllUsersGamesLibrariesByUserId(userId: number, title?: string): Promise<GameModel[]> {
    const games: GameModel[] = await GameLibraryService.getAllUsersGamesLibrariesByUserId(userId, title)
    return GameLoader.createMany(games)
  }

  /**
   * addGameToUserLibrary
   * @param {iGameLibraryCommand} gameLibraryCommand - gameLibraryCommand
   * @returns {GameLibraryModel} - GameLibraryModel
   */
  public static async addGameToUserLibrary(gameLibraryCommand: iGameLibraryCommand): Promise<GameLibraryModel> {
    const gameLibrary: GameLibraryModel = await GameLibraryService.addGameToUserLibrary(gameLibraryCommand)
    return this.create(gameLibrary)
  }
}
