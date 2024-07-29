import { BaseModel } from '@/common/core/models/BaseModel'
import type GameCategoryModel from '@/common/core/models/GameCategoryModel'
import type GamePlatformModel from '@/common/core/models/GamePlatformModel'
import type GameBinaryModel from '@/common/core/models/GameBinaryModel'
import type FileModel from '@/common/core/models/FileModel'

const PCPlatforms: string[] = [
  'windows',
  'linux',
  'ubuntu',
  'steam',
  'macOS',
  'microsoft-store',
  'Microsoft Store',
  'apple',
  'html5',
  'html',
]
const ConsolePlatforms: string[] = [
  'playstation',
  'playstation 5',
  'playstation 4',
  'PlayStation®5',
  'PlayStation®4',
  'xbox',
  'Xbox Series X|S',
  'Xbox One',
  'Xbox Series X',
  'Xbox Series S',
  'Xbox One X',
  'Xbox One S',
  'nintendo-switch',
  'Nintendo Switch',
]
const MobilePlatforms: string[] = ['android', 'ios']

/**
 * Interface for the new game object
 * @interface iNewGame
 * @property {number} id - The id of the game
 * @property {string} title - The title of the game
 * @property {string} description - The description of the game
 * @property {number | null} trailer_files_id - The id of the trailer file
 * @property {FileModel} trailerFile - The trailer file
 * @property {number | null} picture_files_id - The id of the picture file
 * @property {FileModel} pictureFile - The picture file
 * @property {number | null} logo_files_id - The id of the logo file
 * @property {FileModel} logoFile - The logo file
 * @property {GameCategoryModel[]} gameCategory - The game category
 * @property {GamePlatformModel[]} gamePlatform - The game platform
 * @property {GameBinaryModel[]} gameBinary - The game binary
 * @property {boolean} upcoming_game - The upcoming game
 * @property {boolean} new_game - The new game
 * @property {string} created_at - The created date
 * @property {string} updated_at - The updated date
 */
interface iNewGame {
  id: number
  title: string
  description: string
  trailer_files_id: number | null
  trailerFile: FileModel
  picture_files_id: number | null
  pictureFile: FileModel
  logo_files_id: number | null
  logoFile: FileModel
  gameCategory: GameCategoryModel[]
  gamePlatform: GamePlatformModel[]
  gameBinary: GameBinaryModel[]
  upcoming_game: boolean
  new_game: boolean
  created_at: string
  updated_at: string
}

/**
 * Class for the game model
 * @class GameModel
 * @augments BaseModel
 * @property {number} id - The id of the game
 * @property {string} title - The title of the game
 * @property {string} description - The description of the game
 * @property {number | null} trailer_files_id - The id of the trailer file
 * @property {FileModel} trailerFile - The trailer file
 * @property {number | null} picture_files_id - The id of the picture file
 * @property {FileModel} pictureFile - The picture file
 * @property {number | null} logo_files_id - The id of the logo file
 * @property {FileModel} logoFile - The logo file
 * @property {GameCategoryModel[]} gameCategory - The game category
 * @property {GamePlatformModel[]} gamePlatform - The game platform
 * @property {GameBinaryModel[]} gameBinary - The game binary
 * @property {boolean} upcoming_game - The upcoming game
 * @property {boolean} new_game - The new game
 */
export default class GameModel extends BaseModel {
  public id: number
  public title: string
  public description: string
  public trailer_files_id: number | null
  public trailerFile: FileModel
  public picture_files_id: number | null
  public pictureFile: FileModel
  public logo_files_id: number | null
  public logoFile: FileModel
  public gameCategory: GameCategoryModel[]
  public gamePlatform: GamePlatformModel[]
  public gameBinary: GameBinaryModel[]
  public upcoming_game: boolean
  public new_game: boolean

  /**
   * Creates an instance of the game model
   * @param {iNewGame} game - The game object
   */
  constructor(game: iNewGame) {
    super(game.created_at, game.updated_at)
    this.id = game.id
    this.title = game.title
    this.description = game.description
    this.trailer_files_id = game.trailer_files_id
    this.trailerFile = game.trailerFile
    this.picture_files_id = game.picture_files_id
    this.pictureFile = game.pictureFile
    this.logo_files_id = game.logo_files_id
    this.logoFile = game.logoFile
    this.gameCategory = game.gameCategory
    this.gamePlatform = game.gamePlatform
    this.gameBinary = game.gameBinary
    this.upcoming_game = Boolean(game.upcoming_game)
    this.new_game = Boolean(game.new_game)
  }

  /**
   * Retourne un boolean si le jeu est sur PC
   * @returns {boolean} - Retourne un boolean si le jeu est sur PC
   */
  public get isPC(): boolean {
    return this.gamePlatform.some((gamePlatform: GamePlatformModel) =>
      PCPlatforms.map((platform: string) => platform.toLowerCase()).includes(gamePlatform.name.toLowerCase()),
    )
  }

  /**
   * Retourne un boolean si le jeu est sur console
   * @returns {boolean} - Retourne un boolean si le jeu est sur console
   */
  public get isConsole(): boolean {
    return this.gamePlatform.some((gamePlatform: GamePlatformModel) =>
      ConsolePlatforms.map((platform: string) => platform.toLowerCase()).includes(gamePlatform.name.toLowerCase()),
    )
  }

  /**
   * Retourne un boolean si le jeu est sur mobile
   * @returns {boolean} - Retourne un boolean si le jeu est sur mobile
   */
  public get isMobile(): boolean {
    return this.gamePlatform.some((gamePlatform: GamePlatformModel) =>
      MobilePlatforms.map((platform: string) => platform.toLowerCase()).includes(gamePlatform.name.toLowerCase()),
    )
  }
}
