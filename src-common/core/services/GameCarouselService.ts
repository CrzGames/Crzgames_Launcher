import type { GameCarouselModel } from '#src-common/core/models/GameCarouselModel'
import BaseApiService from '#src-common/core/services/BaseApiService'

/**
 * Game carousel command interface
 * @interface iGameCarouselCommand
 * @property {string} title - carousel title
 * @property {string | null} content - carousel content
 * @property {string} button_url - button URL
 * @property {string} button_content - button content
 * @property {string} imagePathFilename - image path filename
 * @property {string} imageBucketName - image bucket name
 * @property {string} logoBucketName - logo bucket name
 * @property {string} logoPathFilename - logo path filename
 */
export interface iGameCarouselCommand {
  title: string
  content?: string | null
  button_url: string
  button_content: string
  imagePathFilename: string
  imageBucketName: string
  logoBucketName: string
  logoPathFilename: string
}

/**
 * Update game carousel command interface
 * @interface iUpdateGameCarouselCommand
 * @property {number} imageFilesId - image files ID
 * @property {number} logoFilesId - logo files ID
 */
export interface iUpdateGameCarouselCommand extends iGameCarouselCommand {
  imageFilesId: number
  logoFilesId: number
}

/**
 * Game carousel service
 * @class GameCarouselService
 */
export class GameCarouselService extends BaseApiService {
  /**
   * Get all carousels
   * @returns {Promise<GameCarouselModel[]>} - carousels
   */
  public static async getAllCarousels(): Promise<GameCarouselModel[]> {
    return await this.get('/carousels')
  }

  /**
   * Get carousel by ID
   * @param {number} id - carousel ID
   * @returns {Promise<GameCarouselModel>} - carousel
   */
  public static async getCarouselById(id: number): Promise<GameCarouselModel> {
    return await this.get(`/carousel/${id}`)
  }

  /**
   * Create carousel
   * @param {iGameCarouselCommand} carousel - carousel
   * @returns {Promise<void>}
   */
  public static async createCarousel(carousel: iGameCarouselCommand): Promise<void> {
    await this.post('/carousel', carousel)
  }

  /**
   * Update carousel
   * @param {number} id - carousel ID
   * @param {iUpdateGameCarouselCommand} carousel - carousel
   * @returns {Promise<void>}
   */
  public static async updateCarousel(id: number, carousel: iUpdateGameCarouselCommand): Promise<void> {
    await this.put(`/carousel/${id}`, carousel)
  }

  /**
   * Delete carousel
   * @param {number} id - carousel ID
   * @returns {Promise<void>}
   */
  public static async deleteCarousel(id: number): Promise<void> {
    await this.delete(`/carousel/${id}`)
  }
}
