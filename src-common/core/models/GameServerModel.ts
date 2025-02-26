import { BaseModel } from '#src-common/core/models/BaseModel'
import type ProductModel from '#src-common/core/models/ProductModel'

/**
 * @interface iGameServer
 * @property {number} id - id of the game server
 * @property {string} name - name of the game server
 * @property {string | null} region - region of the game server
 * @property {string} createdAt - date of creation
 * @property {string} updatedAt - date of last update
 * @property {ProductModel[]} products - products of the game server
 */
interface iGameServer {
  id: number
  name: string
  region: string | null
  createdAt: string
  updatedAt: string
  products?: ProductModel[]
}

/**
 * @class GameServerModel
 */
export default class GameServerModel extends BaseModel {
  public id: number
  public name: string
  public region: string | null
  public products?: ProductModel[]

  /**
   * @param {iGameServer} gameServer - game server data
   */
  constructor(gameServer: iGameServer) {
    super(gameServer.createdAt, gameServer.updatedAt)
    this.id = gameServer.id
    this.name = gameServer.name
    this.region = gameServer.region
    this.products = gameServer.products
  }
}
