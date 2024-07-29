import GameModel from '@/common/core/models/GameModel'
import { GameService } from '@/common/core/services/GameService'
import type { iGameCommand, iUpdateGameCommand } from '@/common/core/services/GameService'

/**
 * GameLoader
 * @class GameLoader
 */
export default class GameLoader {
  /**
   * createMany
   * @param {GameModel[]} games - games
   * @returns {GameModel[]} - games
   */
  public static createMany(games: GameModel[]): GameModel[] {
    return games.map((game: GameModel) => this.create(game))
  }

  /**
   * create
   * @param {GameModel} game - game
   * @returns {GameModel} - game
   */
  public static create(game: GameModel): GameModel {
    return new GameModel(game)
  }

  /**
   * getAll
   * @param {string} title - title
   * @returns {GameModel[]} - games
   */
  public static async getAll(title?: string): Promise<GameModel[]> {
    const games: GameModel[] = await GameService.getAllGames(title)
    return this.createMany(games)
  }

  /**
   * getGameById
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getGameById(id: number): Promise<GameModel> {
    const game: GameModel = await GameService.getGameById(id)

    return this.create(game)
  }

  /**
   * deleteGame
   * @param {number} gameId - gameId
   * @returns {void}
   */
  public static async deleteGame(gameId: number): Promise<void> {
    await GameService.deleteGame(gameId)
  }

  /**
   * createGame
   * @param {iGameCommand} game - game
   * @returns {void}
   */
  public static async createGame(game: iGameCommand): Promise<void> {
    await GameService.createGame(game)
  }

  /**
   * updateGame
   * @param {iUpdateGameCommand} game - game
   * @returns {Promise<void>} - void
   */
  public static async updateGame(game: iUpdateGameCommand): Promise<void> {
    await GameService.updateGame(game)
  }

  /**
   * getPlatformsByGameId
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getPlatformByGameId(id: number): Promise<GameModel> {
    const game: GameModel = await GameService.getPlatformsByGameId(id)
    return this.create(game)
  }

  /**
   * getBinariesByGameId
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getBinariesByGameId(id: number): Promise<GameModel> {
    const game: GameModel = await GameService.getBinariesByGameId(id)
    return this.create(game)
  }

  /**
   * getCategoriesByGameId
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getCategoriesByGameId(id: number): Promise<GameModel> {
    const game: GameModel = await GameService.getCategoriesByGameId(id)
    return this.create(game)
  }
}
