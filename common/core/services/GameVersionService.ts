import BaseApiService from '@/common/core/services/BaseApiService'
import type { GameVersionModel } from '@/common/core/models/GameVersionModel'

/**
 * GameVersionCommand
 * @type {object}
 * @property {string} version - version
 * @property {boolean} is_available - is_available
 */
export type GameVersionCommand = {
  version?: string
  is_available?: boolean
}

/**
 * GameVersionService
 * @class GameVersionService
 */
export class GameVersionService extends BaseApiService {
  /**
   * Récupère la dernière version disponible (is_available = true) pour un jeu
   * @param {number} gameId - gameId
   * @returns {Promise<GameVersionModel>} - Renvoie une promesse de type GameVersionModel
   */
  public static async getLatestAvailableGameVersionByGameId(gameId: number): Promise<GameVersionModel> {
    return await this.get(`/games/${gameId}/version-latest`)
  }

  /**
   * createGameVersion
   * @param {number} gameId - gameId
   * @param {GameVersionCommand} gameVersionCommand - gameVersionCommand
   * @returns {Promise<GameVersionModel>} - Renvoie une promesse de type GameVersionModel
   */
  public static async createGameVersion(
    gameId: number,
    gameVersionCommand: GameVersionCommand,
  ): Promise<GameVersionModel> {
    return await this.post(`/games/${gameId}/versions`, gameVersionCommand)
  }

  /**
   * Récupère toutes les versions de tous les jeux
   * @returns {Promise<GameVersionModel[]>} - Renvoie une promesse de type GameVersionModel[]
   */
  public static async getAllGameVersions(): Promise<GameVersionModel[]> {
    return await this.get(`/games/versions`)
  }

  /**
   * Récupère toutes les versions d'un jeu
   * @param {number} gameId - gameId
   * @returns {Promise<GameVersionModel[]>} - Renvoie une promesse de type GameVersionModel[]
   */
  public static async getAllGameVersionsByGameId(gameId: number): Promise<GameVersionModel[]> {
    return await this.get(`/games/${gameId}/versions`)
  }

  /**
   * getGameVersion
   * @param {number} gameId - gameId
   * @param {number} gameVersionId - gameVersionId
   * @returns {Promise<GameVersionModel>} - Renvoie une promesse de type GameVersionModel
   */
  public static async getGameVersion(gameId: number, gameVersionId: number): Promise<GameVersionModel> {
    return await this.get(`/games/${gameId}/versions/${gameVersionId}`)
  }

  /**
   * updateGameVersion
   * @param {number} gameId - gameId
   * @param {number} gameVersionId - gameVersionId
   * @param {GameVersionCommand} gameVersionCommand - gameVersionCommand
   * @returns {Promise<GameVersionModel>} - Renvoie une promesse de type GameVersionModel
   */
  public static async updateGameVersion(
    gameId: number,
    gameVersionId: number,
    gameVersionCommand: GameVersionCommand,
  ): Promise<GameVersionModel> {
    return await this.put(`/games/${gameId}/versions/${gameVersionId}`, gameVersionCommand)
  }

  /**
   * deleteGameVersion
   * @param {number} gameId - gameId
   * @param {number} gameVersionId - gameVersionId
   * @returns {Promise<void>} - Renvoie une promesse de type void
   */
  public static async deleteGameVersion(gameId: number, gameVersionId: number): Promise<void> {
    await this.delete(`/games/${gameId}/versions/${gameVersionId}`)
  }
}
