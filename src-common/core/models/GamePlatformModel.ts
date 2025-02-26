import { BaseModel } from '#src-common/core/models/BaseModel'

/**
 * Class for the game platform object
 * @class GamePlatformModel
 */
export default class GamePlatformModel extends BaseModel {
  public id: number
  public name: string

  /**
   * Creates an instance of the game platform model
   * @param {GamePlatformModel} game - The game platform object
   */
  constructor(game: GamePlatformModel) {
    super(game.created_at, game.updated_at)
    this.id = game.id
    this.name = game.name
  }
}
