import { BaseModel } from '#src-common/core/models/BaseModel'

/**
 * Type représentant une langue.
 * @type {object} LanguageType
 * @property {number} id - L'identifiant de la langue.
 * @property {string} code - Le code ISO de la langue (ex. 'en', 'fr').
 * @property {string} name - Le nom de la langue (ex. 'English', 'Français').
 * @property {string} created_at - Date de création.
 * @property {string} updated_at - Date de dernière mise à jour.
 */
export type LanguageType = {
  id: number
  code: string
  name: string
  created_at: string
  updated_at: string
}

/**
 * Classe représentant une langue.
 * @class LanguageModel
 * @augments BaseModel
 * @implements {LanguageType}
 */
export class LanguageModel extends BaseModel implements LanguageType {
  public id: number
  public code: string
  public name: string

  /**
   * Crée une instance de LanguageModel.
   * @class
   * @param {LanguageType} language - Les données de la langue.
   */
  constructor(language: LanguageType) {
    super(language.created_at, language.updated_at)
    this.id = language.id
    this.code = language.code
    this.name = language.name
  }
}
