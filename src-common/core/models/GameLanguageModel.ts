import { BaseModel } from '#src-common/core/models/BaseModel'

/**
 * Type représentant la relation entre un jeu et une langue.
 * @type {object} GameLanguageType
 * @property {number} id - L'identifiant de la relation.
 * @property {number} games_id - L'identifiant du jeu.
 * @property {number} languages_id - L'identifiant de la langue.
 * @property {string} created_at - Date de création.
 * @property {string} updated_at - Date de dernière mise à jour.
 */
export type GameLanguageType = {
  id: number
  games_id: number
  languages_id: number
  created_at: string
  updated_at: string
}

/**
 * Classe représentant la relation entre un jeu et une langue (table pivot).
 * @class GameLanguageModel
 * @augments BaseModel
 * @implements {GameLanguageType}
 */
export class GameLanguageModel extends BaseModel implements GameLanguageType {
  public id: number
  public games_id: number
  public languages_id: number

  /**
   * Crée une instance de GameLanguageModel.
   * @class
   * @param {GameLanguageType} gameLanguage - Les données de la relation.
   */
  constructor(gameLanguage: GameLanguageType) {
    super(gameLanguage.created_at, gameLanguage.updated_at)
    this.id = gameLanguage.id
    this.games_id = gameLanguage.games_id
    this.languages_id = gameLanguage.languages_id
  }
}
