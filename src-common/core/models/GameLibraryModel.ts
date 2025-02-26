import { BaseModel } from '#src-common/core/models/BaseModel'

/**
 * GameLibraryModel
 * @class GameLibraryModel
 */
export default class GameLibraryModel extends BaseModel {
  public id: number
  public user_id: number
  public game_id: number

  /**
   * constructor
   * @param {GameLibraryModel} game - game
   */
  constructor(game: GameLibraryModel) {
    super(game.created_at, game.updated_at)
    this.id = game.id
    this.user_id = game.user_id
    this.game_id = game.game_id
  }
}
