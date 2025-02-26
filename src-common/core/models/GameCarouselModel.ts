import { BaseModel } from '#src-common/core/models/BaseModel'
import type FileModel from '#src-common/core/models/FileModel'

/**
 * File schema
 * @interface FileSchema
 * @property {string[]} extnames - file extensions
 * @property {string} size - file size
 */
export interface FileSchema {
  extnames: string[]
  size: string
}

/**
 * Game carousel model
 * @class GameCarouselModel
 */
export class GameCarouselModel extends BaseModel {
  public id: number
  public title: string
  public content: string | null
  public button_url: string
  public button_content: string
  public image_files_id: number
  public logo_files_id: number
  public imageFile: FileModel
  public logoFile: FileModel

  /**
   * Constructor
   * @param {GameCarouselModel} gameCarousel - game carousel
   */
  constructor(gameCarousel: GameCarouselModel) {
    super(gameCarousel.created_at, gameCarousel.updated_at)
    this.id = gameCarousel.id
    this.title = gameCarousel.title
    this.content = gameCarousel.content
    this.button_url = gameCarousel.button_url
    this.button_content = gameCarousel.button_content
    this.image_files_id = gameCarousel.image_files_id
    this.logo_files_id = gameCarousel.logo_files_id
    this.imageFile = gameCarousel.imageFile
    this.logoFile = gameCarousel.logoFile
  }
}
