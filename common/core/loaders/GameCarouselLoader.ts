import { GameCarouselService } from '@/common/core/services/GameCarouselService'
import { GameCarouselModel } from '@/common/core/models/GameCarouselModel'

/**
 * Game carousel loader
 * @class GameCarouselLoader
 */
export default class GameCarouselLoader {
  /**
   * Get all carousels
   * @returns {Promise<GameCarouselModel[]>} - game carousels
   */
  public static async getAll(): Promise<GameCarouselModel[]> {
    const carousels: GameCarouselModel[] = await GameCarouselService.getAllCarousels()
    return carousels.map((carousel: GameCarouselModel) => new GameCarouselModel(carousel))
  }

  /**
   * Get carousel by id
   * @param {number} id - carousel id
   * @returns {Promise<GameCarouselModel>} - game carousel
   */
  public static async getById(id: number): Promise<GameCarouselModel> {
    const carousel: GameCarouselModel = await GameCarouselService.getCarouselById(id)
    return new GameCarouselModel(carousel)
  }

  /**
   * Delete carousel
   * @param {number} id - carousel id
   * @returns {Promise<void>}
   */
  public static async deleteCarousel(id: number): Promise<void> {
    await GameCarouselService.deleteCarousel(id)
  }
}
