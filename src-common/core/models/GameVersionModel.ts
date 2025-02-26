import { BaseModel } from '#src-common/core/models/BaseModel'
import GameModel from '#src-common/core/models/GameModel'

/**
 * iGameVersion
 * @type {object}
 * @property {number} id - id
 * @property {string} version - version
 * @property {boolean} is_available - is_available
 * @property {string} createdAt - createdAt
 * @property {string} updatedAt - updatedAt
 * @property {GameModel} game - game
 */
export type iGameVersion = {
  id: number
  version: string
  is_available: boolean
  createdAt: string
  updatedAt: string
  game: GameModel
}

/**
 * GameVersionModel
 * @class GameVersionModel
 */
export class GameVersionModel extends BaseModel {
  public id: number
  public version: string
  public is_available: boolean
  public game: GameModel

  /**
   * constructor
   * @param {iGameVersion} gameVersion - gameVersion
   */
  constructor(gameVersion: iGameVersion) {
    super(gameVersion.createdAt, gameVersion.updatedAt)
    this.id = gameVersion.id
    this.version = gameVersion.version
    this.is_available = gameVersion.is_available
    this.game = new GameModel(gameVersion.game)
  }
}
