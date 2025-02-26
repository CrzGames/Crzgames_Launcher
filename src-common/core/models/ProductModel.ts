import { BaseModel } from '#src-common/core/models/BaseModel'
import type GameServerModel from '#src-common/core/models/GameServerModel'
import type ProductCategoryModel from '#src-common/core/models/ProductCategoryModel'
import type ProductDiscountModel from '#src-common/core/models/ProductDiscountModel'
import type FileModel from '#src-common/core/models/FileModel'
import type GameModel from '#src-common/core/models/GameModel'

/**
 * @interface iProduct
 * @property {number} id - id of the product
 * @property {string} name - name of the product
 * @property {string} description - description of the product
 * @property {number} price - price of the product
 * @property {number | null} product_categories_id - id of the product category
 * @property {number} image_files_id - id of the image file
 * @property {number | null} games_id - id of the game
 * @property {string} createdAt - date of creation
 * @property {string} updatedAt - date of last update
 * @property {GameModel} game - game of the product
 * @property {FileModel} imageFile - image file of the product
 * @property {GameServerModel[]} gameServers - game servers of the product
 * @property {ProductCategoryModel} productCategory - product category of the product
 * @property {ProductDiscountModel[]} productDiscounts - product discounts of the product
 */
interface iProduct {
  id: number
  name: string
  description: string
  price: number
  product_categories_id: number | null
  image_files_id: number
  games_id: number | null
  createdAt: string
  updatedAt: string
  game: GameModel
  imageFile?: FileModel
  gameServers?: GameServerModel[]
  productCategory?: ProductCategoryModel
  productDiscounts?: ProductDiscountModel[]
}

/**
 * @class ProductModel
 */
export default class ProductModel extends BaseModel {
  public id: number
  public name: string
  public description: string
  public price: number
  public product_categories_id: number | null
  public image_files_id: number
  public games_id: number | null
  public game?: GameModel
  public imageFile?: FileModel
  public gameServers?: GameServerModel[]
  public productCategory?: ProductCategoryModel
  public productDiscounts?: ProductDiscountModel[]

  /**
   * @param {iProduct} product - product data
   */
  constructor(product: iProduct) {
    super(product.createdAt, product.updatedAt)
    this.id = product.id
    this.name = product.name
    this.description = product.description
    this.price = product.price
    this.product_categories_id = product.product_categories_id
    this.image_files_id = product.image_files_id
    this.games_id = product.games_id
    this.game = product.game
    this.imageFile = product.imageFile
    this.gameServers = product.gameServers
    this.productCategory = product.productCategory
    this.productDiscounts = product.productDiscounts
  }
}
