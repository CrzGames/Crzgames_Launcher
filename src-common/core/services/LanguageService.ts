import type { LanguageModel } from '#src-common/core/models/LanguageModel'
import BaseApiService from '#src-common/core/services/BaseApiService'

/**
 * LanguagesService
 * @class LanguagesService
 */
export class LanguagesService extends BaseApiService {
  /**
   * Get the list of languages
   * @returns {Promise<string[]>} - Renvoie une promesse de type string[]
   */
  public static async getAllLanguages(): Promise<LanguageModel[]> {
    return await this.get(`/languages`)
  }
}
