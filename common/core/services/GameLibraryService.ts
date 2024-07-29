import BaseApiService from '@/common/core/services/BaseApiService'
import type GameModel from '@/common/core/models/GameModel'
import type GameLibraryModel from '@/common/core/models/GameLibraryModel'

/**
 * iGameLibraryCommand
 * @interface iGameLibraryCommand
 */
export interface iGameLibraryCommand {
  userId: number
  gameId: number
}

/**
 * GameLibraryService
 * @class GameLibraryService
 */
export class GameLibraryService extends BaseApiService {
  /**
   * getAllUsersGamesLibrariesByUserId
   * @param {number} userId - userId
   * @param {string} title - title
   * @returns {GameModel[]} - GameModel[]
   */
  public static async getAllUsersGamesLibrariesByUserId(userId: number, title?: string): Promise<GameModel[]> {
    return await this.get(`/user-game-libraries/${userId}` + (title ? `?title=${title}` : ''))
  }

  /**
   * addGameToUserLibrary
   * @param {iGameLibraryCommand} gameLibrary - gameLibrary
   * @returns {GameLibraryModel} - GameLibraryModel
   */
  public static async addGameToUserLibrary(gameLibrary: iGameLibraryCommand): Promise<GameLibraryModel> {
    return await this.post('/user-game-libraries', gameLibrary)
  }
}
