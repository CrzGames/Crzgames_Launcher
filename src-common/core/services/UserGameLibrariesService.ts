import type UserGameLibraryModel from '~~/src-common/core/models/UserGameLibraryModel'

import type GameModel from '#src-common/core/models/GameModel'
import BaseApiService from '#src-common/core/services/BaseApiService'

/**
 * iGameLibraryCommand
 * @interface iGameLibraryCommand
 */
export interface iGameLibraryCommand {
  userId: number
  gameId: number
}

/**
 * GameLibraryService
 * @class GameLibraryService
 */
export class UserGameLibrariesService extends BaseApiService {
  /**
   * Récupère tous les jeux de la bibliothèque de l'utilisateur par userId et
   * si un titre est fourni, il filtre les jeux par titre.
   * @param {number} userId - l'ID de l'utilisateur
   * @param {string} title - le titre du jeu
   * @returns {GameModel[]} - Un tableau de jeux de la bibliothèque de l'utilisateur
   */
  public static async getAllUserGameLibrariesByUserId(userId: number, title?: string): Promise<GameModel[]> {
    return await this.get(`/user-game-libraries/${userId}` + (title ? `?title=${title}` : ''))
  }

  /**
   * Crée un jeu dans la bibliothèque de l'utilisateur par gameId et userId.
   * @param {iGameLibraryCommand} gameLibrary - gameLibrary
   * @returns {UserGameLibraryModel} - Le jeu créé dans la bibliothèque de l'utilisateur
   */
  public static async createGameInUserGameLibrariesByGameIdAndUserId(
    gameLibrary: iGameLibraryCommand,
  ): Promise<UserGameLibraryModel> {
    return await this.post('/user-game-libraries', gameLibrary)
  }
}
