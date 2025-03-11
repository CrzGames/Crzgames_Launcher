import { BaseModel } from '#src-common/core/models/BaseModel'

/**
 * UserGameLibraryModel
 * @class UserGameLibraryModel
 */
export default class UserGameLibraryModel extends BaseModel {
  public id: number
  public user_id: number
  public game_id: number

  /**
   * constructor
   * @class
   * @param {UserGameLibraryModel} game - game
   */
  constructor(game: UserGameLibraryModel) {
    super(game.created_at, game.updated_at)
    this.id = game.id
    this.user_id = game.user_id
    this.game_id = game.game_id
  }
}
