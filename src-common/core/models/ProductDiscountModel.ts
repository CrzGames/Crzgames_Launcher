import { BaseModel } from '#src-common/core/models/BaseModel'
import type ProductModel from '#src-common/core/models/ProductModel'

/**
 * @interface iProductDiscount
 * @property {number} id - id of the product discount
 * @property {number} products_id - id of the product
 * @property {string} currency - currency of the discount
 * @property {number} discount_percent - discount percent
 * @property {string} createdAt - date of creation
 * @property {string} updatedAt - date of last update
 * @property {ProductModel} product - product of the discount
 */
interface iProductDiscount {
  id: number
  products_id: number
  currency: string
  discount_percent: number
  createdAt: string
  updatedAt: string
  product?: ProductModel
}

/**
 * @class ProductDiscountModel
 */
export default class ProductDiscountModel extends BaseModel {
  public id: number
  public products_id: number
  public currency: string
  public discount_percent: number
  public product?: ProductModel

  /**
   * @param {iProductDiscount} productDiscount - product discount data
   */
  constructor(productDiscount: iProductDiscount) {
    super(productDiscount.createdAt, productDiscount.updatedAt)
    this.id = productDiscount.id
    this.products_id = productDiscount.products_id
    this.currency = productDiscount.currency
    this.discount_percent = productDiscount.discount_percent
    this.product = productDiscount.product
  }
}
