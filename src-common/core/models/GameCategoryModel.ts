import { BaseModel } from '#src-common/core/models/BaseModel'

/**
 * Class for the game category object
 * @class GameCategoryModel
 */
export default class GameCategoryModel extends BaseModel {
  public id: number
  public name: string

  /**
   * Creates an instance of the game category model
   * @param {GameCategoryModel} game - The game category object
   */
  constructor(game: GameCategoryModel) {
    super(game.created_at, game.updated_at)
    this.id = game.id
    this.name = game.name
  }
}
