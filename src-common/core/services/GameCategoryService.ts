import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'
import BaseApiService from '#src-common/core/services/BaseApiService'

/**
 * GameCategoryService
 * @class GameCategoryService
 */
export default class GameCategoryService extends BaseApiService {
  /**
   * Récupérer toutes les catégories de jeux (Action, Aventure, etc.)
   * @returns {Promise<GamePlatformModel[]>} - Catégories de jeux
   */
  public static async getAllGameCategories(): Promise<GamePlatformModel[]> {
    return await this.get('/game-categories')
  }
}
