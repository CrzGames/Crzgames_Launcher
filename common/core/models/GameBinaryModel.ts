import { BaseModel } from '@/common/core/models/BaseModel'
import type GamePlatformModel from '@/common/core/models/GamePlatformModel'
import type FileModel from '@/common/core/models/FileModel'

/**
 * Class for the game binary object
 * @class GameBinaryModel
 */
export default class GameBinaryModel extends BaseModel {
  public id: number
  public path: string
  public game_platforms_id: number
  public gamePlatform: GamePlatformModel
  public files_id: number
  public file: FileModel

  /**
   * Creates an instance of the game binary model
   * @param {GameBinaryModel} game - The game binary object
   */
  constructor(game: GameBinaryModel) {
    super(game.created_at, game.updated_at)
    this.id = game.id
    this.path = game.path
    this.game_platforms_id = game.game_platforms_id
    this.gamePlatform = game.gamePlatform
    this.files_id = game.files_id
    this.file = game.file
  }
}
