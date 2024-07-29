import BaseApiService from '@/common/core/services/BaseApiService'
import type ProductModel from '@/common/core/models/ProductModel'

/**
 * @interface ProductCommand
 * @property {string} name - name of the product
 * @property {string} description - description of the product
 * @property {number} games_id - id of the game
 * @property {number} price - price of the product
 * @property {string} bucket_name - name of the bucket
 * @property {string} pathFilename - path of the file
 * @property {number} product_categories_id - id of the product category
 * @property {number} image_files_id - id of the image file
 */
export type ProductCommand = {
  name: string
  description: string
  games_id: number
  price: number
  bucket_name: string
  pathFilename: string
  product_categories_id: number
  image_files_id?: number
}

/**
 * @type {object} GamePaidAndOwnedStatus
 * @property {boolean} isPaid - Si le jeu est payant
 * @property {boolean} isOwned - Si il possède le jeu
 */
export type GamePaidAndOwnedStatus = {
  isPaid: boolean
  isOwned: boolean
}

/**
 * @class ProductService
 */
export class ProductService extends BaseApiService {
  /**
   * @param {ProductCommand} productCommand - product data
   * @returns {Promise<ProductModel>} - product data
   */
  public static async createProduct(productCommand: ProductCommand): Promise<ProductModel> {
    return await this.post(`/products`, productCommand)
  }

  /**
   * @param {number} id - id of the product
   * @returns {Promise<ProductModel>} - product data
   */
  public static async getProductById(id: number): Promise<ProductModel> {
    return await this.get(`/products/${id}`)
  }

  /**
   * @returns {Promise<ProductModel[]>} - list of products
   */
  public static async getAllProducts(): Promise<ProductModel[]> {
    return await this.get(`/products`)
  }

  /**
   * @param {string} name - name of the product
   * @returns {Promise<ProductModel>} - product data
   */
  public static async getProductByName(name: string): Promise<ProductModel> {
    return await this.get(`/products/name/${name}`)
  }

  /**
   * @param {number} id - id of the product
   * @param {ProductCommand} productCommand - product data
   * @returns {Promise<ProductModel>} - product data
   */
  public static async updateProduct(id: number, productCommand: ProductCommand): Promise<ProductModel> {
    return await this.put(`/products/${id}`, productCommand)
  }

  /**
   * @param {number} id - id of the product
   * @returns {Promise<void>}
   */
  public static async deleteProduct(id: number): Promise<void> {
    await this.delete(`/products/${id}`)
  }

  /**
   * @param {number} gameId - id of the game
   * @returns {Promise<GamePaidAndOwnedStatus>} - game paid and owned status
   */
  public static async isGamePaidAndOwned(gameId: number): Promise<GamePaidAndOwnedStatus> {
    return await this.get(`/products/games/${gameId}/paid-and-owned`)
  }
}
