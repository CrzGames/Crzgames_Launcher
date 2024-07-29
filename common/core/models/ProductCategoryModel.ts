import { BaseModel } from '@/common/core/models/BaseModel'
import type ProductModel from '@/common/core/models/ProductModel'

/**
 *
 */
interface iProductCategory {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  products?: ProductModel[]
}

/**
 * @class ProductCategoryModel
 */
export default class ProductCategoryModel extends BaseModel {
  public id: number
  public name: string
  public products?: ProductModel[]

  /**
   * @param {iProductCategory} productCategory - product category data
   */
  constructor(productCategory: iProductCategory) {
    super(productCategory.createdAt, productCategory.updatedAt)
    this.id = productCategory.id
    this.name = productCategory.name
    this.products = productCategory.products
  }
}
