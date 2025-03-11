import type { DateTime } from 'luxon'

import { BaseModel } from '#src-common/core/models/BaseModel'
import type FileModel from '#src-common/core/models/FileModel'
import type GameBinaryModel from '#src-common/core/models/GameBinaryModel'
import type GameCategoryModel from '#src-common/core/models/GameCategoryModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'

import type GameConfigurationModel from './GameConfigurationModel'
import type { LanguageModel } from './LanguageModel'

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
 * Interface représentant les données complètes d’un jeu.
 * @interface IGameModel
 * @property {number} id - L’identifiant du jeu.
 * @property {string} title - Le titre du jeu.
 * @property {string} description - La description du jeu.
 * @property {number | null} trailer_files_id - L’identifiant du fichier trailer (ou null).
 * @property {FileModel} trailerFile - L’objet représentant le fichier trailer.
 * @property {number | null} picture_files_id - L’identifiant du fichier image (ou null).
 * @property {FileModel} pictureFile - L’objet représentant le fichier image.
 * @property {number | null} logo_files_id - L’identifiant du fichier logo (ou null).
 * @property {FileModel} logoFile - L’objet représentant le fichier logo.
 * @property {GameCategoryModel[]} gameCategory - La liste des catégories du jeu.
 * @property {GamePlatformModel[]} gamePlatform - La liste des plateformes sur lesquelles le jeu est disponible.
 * @property {GameBinaryModel[]} gameBinary - La liste des binaires associés au jeu.
 * @property {boolean} upcoming_game - Indique si le jeu est à venir.
 * @property {boolean} new_game - Indique si le jeu est nouveau.
 * @property {DateTime | null} release_date - La date de sortie du jeu (peut être null).
 * @property {'solo' | 'multiplayer' | 'both'} game_mode - Le mode de jeu.
 * @property {string} publisher - L’éditeur du jeu.
 * @property {string} developer - Le développeur du jeu.
 * @property {GameConfigurationModel | null} gameConfigurationMinimal - La configuration minimale requise (peut être null).
 * @property {GameConfigurationModel | null} gameConfigurationRecommended - La configuration recommandée (peut être null).
 * @property {LanguageModel[]} languages - La liste des langues disponibles.
 * @property {string} created_at - La date de création.
 * @property {string} updated_at - La date de dernière mise à jour.
 */
export type IGameModel = {
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
  release_date: DateTime | null
  game_mode: 'solo' | 'multiplayer' | 'both'
  publisher: string
  developer: string
  gameConfigurationMinimal: GameConfigurationModel | null
  gameConfigurationRecommended: GameConfigurationModel | null
  languages: LanguageModel[]
  created_at: string
  updated_at: string
}

/**
 * Classe représentant un jeu.
 * @class GameModel
 * @augments BaseModel
 * @implements {IGameModel}
 */
export default class GameModel extends BaseModel implements IGameModel {
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
  public release_date: DateTime | null
  public game_mode: 'solo' | 'multiplayer' | 'both'
  public publisher: string
  public developer: string
  public gameConfigurationMinimal: GameConfigurationModel | null
  public gameConfigurationRecommended: GameConfigurationModel | null
  public languages: LanguageModel[]

  /**
   * Crée une instance de GameModel.
   * @class
   * @param {IGameModel} game - Les données du jeu.
   */
  constructor(game: IGameModel) {
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
    this.release_date = game.release_date
    this.game_mode = game.game_mode
    this.publisher = game.publisher
    this.developer = game.developer
    this.gameConfigurationMinimal = game.gameConfigurationMinimal
    this.gameConfigurationRecommended = game.gameConfigurationRecommended
    this.languages = game.languages
    this.created_at = game.created_at
    this.updated_at = game.updated_at
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
