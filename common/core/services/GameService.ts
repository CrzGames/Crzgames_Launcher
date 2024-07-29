import BaseApiService from '@/common/core/services/BaseApiService'
import type GameModel from '@/common/core/models/GameModel'
import type { iGameBinaryCommand } from '@/common/core/services/GameBinaryService'

/**
 * iGameCommand
 * @interface iGameCommand
 * @property {string} title - title
 * @property {boolean} upcomingGame - upcomingGame
 * @property {boolean} newGame - newGame
 * @property {string} trailerPathFilename - trailerPathFilename
 * @property {string} trailerBucketName - trailerBucketName
 * @property {string} picturePathFilename - picturePathFilename
 * @property {string} pictureBucketName - pictureBucketName
 * @property {string} logoPathFilename - logoPathFilename
 * @property {string} logoBucketName - logoBucketName
 * @property {number[]} categoryIds - category
 * @property {number[]} platformIds - platformIds
 * @property {iGameBinaryCommand[]} binaries - binaries
 * @property {string} description - description
 */
export interface iGameCommand {
  title: string
  upcomingGame: boolean
  newGame: boolean
  trailerPathFilename: string
  trailerBucketName: string
  picturePathFilename: string
  pictureBucketName: string
  logoPathFilename: string
  logoBucketName: string
  categoryIds: number[]
  platformIds: number[]
  binaries: iGameBinaryCommand[]
  description: string
}

/**
 * iUpdateGameCommand
 * @interface iUpdateGameCommand
 * @property {number} id - id
 * @property {number} trailerFilesId - trailerFilesId
 * @property {number} logoFilesId - logoFilesId
 * @property {number} pictureFileId - pictureFileId
 */
export interface iUpdateGameCommand extends iGameCommand {
  id: number
  trailerFilesId: number
  logoFilesId: number
  pictureFileId: number
}
/**
 * GameService
 * @class GameService
 */
export class GameService extends BaseApiService {
  /**
   * getAllGames
   * @param {string} title - title
   * @returns {GameModel[]} - games
   */
  public static async getAllGames(title?: string): Promise<GameModel[]> {
    return await this.get('/games' + (title ? `?title=${title}` : ''))
  }

  /**
   * getGameById
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getGameById(id: number): Promise<GameModel> {
    return await this.get(`/game/${id}`)
  }

  /**
   * deleteGame
   * @param {number} gameId - gameId
   * @returns {Promise<void>} - void
   */
  public static async deleteGame(gameId: number): Promise<void> {
    await this.delete(`/game/${gameId}`)
  }

  /**
   * createGame
   * @param {iGameCommand} game - game
   * @returns {void} - void
   */
  public static async createGame(game: iGameCommand): Promise<void> {
    await this.post('/game', game)
  }

  /**
   * updateGame
   * @param {iUpdateGameCommand} game - game
   * @returns {Promise<void>} - void
   */
  public static async updateGame(game: iUpdateGameCommand): Promise<void> {
    await this.put(`/game/${game.id}`, game)
  }

  /**
   * getPlatformsByGameId
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getPlatformsByGameId(id: number): Promise<GameModel> {
    return await this.get(`/game/${id}/platforms`)
  }

  /**
   * getBinariesByGameId
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getBinariesByGameId(id: number): Promise<GameModel> {
    return await this.get(`/game/${id}/binaries`)
  }

  /**
   * getCategoriesByGameId
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getCategoriesByGameId(id: number): Promise<GameModel> {
    return await this.get(`/game/${id}/categories`)
  }
}
