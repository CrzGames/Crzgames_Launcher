import type GameBinaryModel from '#src-common/core/models/GameBinaryModel'
import BaseApiService from '#src-common/core/services/BaseApiService'

/**
 * iGameBinaryCommand
 * @interface iGameBinaryCommand
 * @property {string} pathfilename - pathfilename
 * @property {string} bucketName - bucketName
 * @property {number} platformId - platformId
 */
export interface iGameBinaryCommand {
  pathfilename: string
  bucketName: string
  platformId: number
}

/**
 * iCreateGameBinaryCommand
 * @interface iCreateGameBinaryCommand
 * @property {number} gameId - gameId
 * @property {iGameBinaryCommand} binary - binary
 */
export interface iCreateGameBinaryCommand {
  gameId: number
  binary: iGameBinaryCommand
}

/**
 * iUpdateGameBinaryCommand
 * @interface iUpdateGameBinaryCommand
 * @property {number} gameId - gameId
 * @property {iGameBinaryCommand} binary - binary
 */
export interface iUpdateGameBinaryCommand {
  gameId: number
  binary: iGameBinaryCommand
}

/**
 * GameBinaryService
 * @class GameBinaryService
 */
export default class GameBinaryService extends BaseApiService {
  /**
   * getAllGameBinaries
   * @param {number} id - id
   * @returns {GameBinaryModel[]} - games
   */
  public static async getById(id: number): Promise<GameBinaryModel> {
    return await this.get(`/game-binary/${id}`)
  }

  /**
   * getAllGameBinaries
   * @param {iCreateGameBinaryCommand} binaryCommand - binaryCommand
   * @returns {GameBinaryModel[]} - games
   */
  public static async createBinary(binaryCommand: iCreateGameBinaryCommand): Promise<GameBinaryModel> {
    return await this.post(`/game-binary`, binaryCommand)
  }

  /**
   * getAllGameBinaries
   * @param {number} binaryId - binaryId
   * @param {iUpdateGameBinaryCommand} binaryCommand - binaryCommand
   * @returns {GameBinaryModel[]} - games
   */
  public static async updateBinary(binaryId: number, binaryCommand: iUpdateGameBinaryCommand): Promise<void> {
    await this.put(`/game-binary/${binaryId}`, binaryCommand)
  }

  /**
   * getAllGameBinaries
   * @param {number} binaryId - binaryId
   * @returns {Promise<void>} - void
   */
  public static async deleteBinary(binaryId: number): Promise<void> {
    await this.delete(`/game-binary/${binaryId}`)
  }
}
