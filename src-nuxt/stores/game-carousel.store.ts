import GameCarouselLoader from '#src-common/core/loaders/GameCarouselLoader'
import type { GameCarouselModel } from '#src-common/core/models/GameCarouselModel'
import { getS3FileUrl } from '#src-common/core/utils/s3Utils'
import { useAppStore } from '#src-nuxt/stores/app.store'
import { defineStore } from 'pinia'

/**
 * Carousel item type
 * @type {object}
 * @property {string} imageUrl - image URL
 * @property {string} title - title
 * @property {string} content - content
 * @property {string} button_content - button content
 * @property {string} button_url - button URL
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type tCarouselItem = {
  imageUrl: string | null
  title?: string | null
  content?: string | null
  button_content?: string | null
  button_url?: string | null
}

/**
 * Game carousel form command interface
 * @interface iGameCarouselFormCommand
 * @property {number} id - carousel ID
 * @property {string} title - carousel title
 * @property {string | null} content - carousel content
 * @property {string} button_url - button URL
 * @property {string} button_content - button content
 * @property {string} imagePathFilename - image path filename
 * @property {string} imageBucketName - image bucket name
 * @property {string} logoBucketName - logo bucket name
 * @property {string} logoPathFilename - logo path filename
 * @property {number | undefined} imageFilesId - image files ID
 * @property {number | undefined} logoFilesId - logo files ID
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface iGameCarouselFormCommand {
  id: number
  title: string
  content?: string | null
  button_url: string
  button_content: string
  imagePathFilename: string
  imageBucketName: string
  logoBucketName: string
  logoPathFilename: string
  imageFilesId?: number
  logoFilesId?: number
}

// eslint-disable-next-line @typescript-eslint/typedef
export const useGameCarouselStore = defineStore('gameCarouselStore', {
  // eslint-disable-next-line jsdoc/require-returns
  /**
   * State
   */
  state: () => ({
    _carousels: [] as GameCarouselModel[],
    _carouselFormCommands: [] as iGameCarouselFormCommand[],
  }),
  actions: {
    /**
     * Set carousels
     * @param {GameCarouselModel[]} carousels - carousels
     * @returns {void}
     */
    setCarousels(carousels: GameCarouselModel[]): void {
      this._carousels = carousels
    },

    /**
     * Set carousel form commands
     * @param {iGameCarouselFormCommand[]} carouselFormCommands - carousel form commands
     * @returns {void}
     */
    setCarouselFormCommands(carouselFormCommands: iGameCarouselFormCommand[]): void {
      this._carouselFormCommands = carouselFormCommands
    },

    /**
     * Remove local carousel
     * @param {number} index - index
     * @returns {void}
     */
    removeLocalCarousel(index: number): void {
      if (index !== -1) {
        this.setCarouselFormCommands([
          ...this._carouselFormCommands.slice(0, index),
          ...this._carouselFormCommands.slice(index + 1),
        ])
      }
    },
    /**
     * Add local carousel
     * @param {iGameCarouselFormCommand} newCarouselCommand - new carousel command
     * @returns {void}
     */
    addLocalCarousel(newCarouselCommand: iGameCarouselFormCommand): void {
      this.setCarouselFormCommands([...this._carouselFormCommands, newCarouselCommand])
    },
    /**
     * Update local carousel
     * @param {iGameCarouselFormCommand} updatedCarouselCommand - updated carousel command
     * @param {number} index - index
     * @returns {void}
     */
    updateLocalCarousel(updatedCarouselCommand: iGameCarouselFormCommand, index: number): void {
      if (index !== -1) {
        this.setCarouselFormCommands([
          ...this._carouselFormCommands.slice(0, index),
          updatedCarouselCommand,
          ...this._carouselFormCommands.slice(index + 1),
        ])
      }
    },

    /**
     * Get all carousels
     * @returns {Promise<GameCarouselModel[]>} - carousels
     */
    async getAllCarousels(): Promise<GameCarouselModel[]> {
      return await useAppStore().execWithPending(async (): Promise<any> => {
        const carousels: GameCarouselModel[] = await GameCarouselLoader.getAll()
        this.setCarousels(carousels)
        const carouselFormCommands: iGameCarouselFormCommand[] = carousels.map((carousel: GameCarouselModel) => {
          return {
            id: carousel.id,
            title: carousel.title,
            content: carousel.content,
            button_url: carousel.button_url,
            button_content: carousel.button_content,
            imagePathFilename: carousel.imageFile.pathfilename || '',
            imageBucketName: carousel.imageFile.bucket.name || '',
            logoBucketName: carousel.logoFile.bucket.name || '',
            logoPathFilename: carousel.logoFile.pathfilename || '',
            imageFilesId: carousel.image_files_id,
            logoFilesId: carousel.logo_files_id,
          }
        })
        this.setCarouselFormCommands(carouselFormCommands)
        return carousels
      })
    },

    /**
     * Get carousel by ID
     * @param {number} id - carousel ID
     * @returns {Promise<GameCarouselModel | null>} - carousel
     */
    async getCarouselById(id: number): Promise<GameCarouselModel | null> {
      return await useAppStore().execWithPending(async (): Promise<any> => {
        return await GameCarouselLoader.getById(id)
      })
    },

    /**
     * Delete carousel
     * @param {number} id - carousel ID
     * @returns {Promise<void>}
     */
    async deleteCarousel(id: number): Promise<void> {
      await useAppStore().execWithPending(async (): Promise<void> => {
        await GameCarouselLoader.deleteCarousel(id)
      })
    },
  },
  getters: {
    /**
     * Get carousels
     * @param {any} state - state
     * @returns {GameCarouselModel[]} - carousels
     */
    // eslint-disable-next-line @typescript-eslint/typedef
    carousels: (state: any): GameCarouselModel[] => state._carousels,
    /**
     * Get carousel form commands
     * @param {any} state - state
     * @returns {iGameCarouselFormCommand[]} - carousel form commands
     */
    // eslint-disable-next-line @typescript-eslint/typedef
    carouselFormCommands: (state: any): iGameCarouselFormCommand[] => state._carouselFormCommands,
    /**
     * Get carousel items
     * @returns {tCarouselItem[]} - carousel items
     */
    carouselItems(): tCarouselItem[] {
      // eslint-disable-next-line @typescript-eslint/typedef
      return this._carouselFormCommands.map((carousel) => {
        return {
          imageUrl: getS3FileUrl(carousel.imagePathFilename, carousel.imageBucketName),
          title: carousel.title,
          content: carousel.content,
          button_content: carousel.button_content,
          button_url: carousel.button_url,
        }
      })
    },
  },
})
