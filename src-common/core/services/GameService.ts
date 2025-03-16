import type GameModel from '#src-common/core/models/GameModel'
import BaseApiService from '#src-common/core/services/BaseApiService'
import type { iGameBinaryCommand } from '#src-common/core/services/GameBinaryService'

/**
 * iGameCommand
 * @interface iGameCommand
 * @property {string} title - title
 * @property {boolean} upcomingGame - upcomingGame
 * @property {boolean} newGame - newGame
 * @property {string} trailerPathFilename - trailerPathFilename
 * @property {string} trailerBucketName - trailerBucketName
 * @property {string} picturePathFilename - picturePathFilename
 * @property {string} pictureBucketName - pictureBucketName
 * @property {string} logoPathFilename - logoPathFilename
 * @property {string} logoBucketName - logoBucketName
 * @property {number[]} categoryIds - category
 * @property {number[]} platformIds - platformIds
 * @property {iGameBinaryCommand[]} binaries - binaries
 * @property {string} description - description
 */
export interface iGameCommand {
  title: string
  upcomingGame: boolean
  newGame: boolean
  trailerPathFilename: string
  trailerBucketName: string
  picturePathFilename: string
  pictureBucketName: string
  logoPathFilename: string
  logoBucketName: string
  categoryIds: number[]
  platformIds: number[]
  binaries: iGameBinaryCommand[]
  description: string
}

/**
 * iUpdateGameCommand
 * @interface iUpdateGameCommand
 * @property {number} id - id
 * @property {number} trailerFilesId - trailerFilesId
 * @property {number} logoFilesId - logoFilesId
 * @property {number} pictureFileId - pictureFileId
 */
export interface iUpdateGameCommand extends iGameCommand {
  id: number
  trailerFilesId: number
  logoFilesId: number
  pictureFileId: number
}

/**
 * Type pour la méta-donnée de pagination
 * @type {object} PaginationMeta
 * @property {number} total - Nombre total de jeux
 * @property {number} from - Index du premier jeu de la page
 * @property {number} to - Index du dernier jeu de la page
 * @property {number} currentPage - Numéro de la page actuelle
 * @property {number} perPage - Nombre de jeux par page
 */
export type PaginationMeta = {
  total: number
  from: number
  to: number
  currentPage: number
  perPage: number
}

/**
 * Type pour la réponse de la fonction getAllGames
 * @type {GamesResponse} GamesResponse
 * @property {GameModel[]} data - Liste des jeux
 * @property {PaginationMeta} meta - Méta-donnée de pagination
 */
export type GamesResponse =
  | GameModel[] // Si pas de pagination
  | { data: GameModel[]; meta: PaginationMeta } // Si pagination active

/**
 * GameService
 * @class GameService
 */
export class GameService extends BaseApiService {
  /**
   * Récupère tous les jeux avec des options de filtrage et de pagination
   * @param {string} [title] - Titre pour filtrer les jeux (optionnel)
   * @param {number} [page] - Numéro de la page (optionnel)
   * @param {number} [perPage] - Nombre d'éléments par page (optionnel)
   * @returns {Promise<GamesResponse>} - Réponse contenant les jeux et les métadonnées de pagination
   */
  public static async getAllGames(title?: string, page?: number, perPage?: number): Promise<GamesResponse> {
    const queryParams: string[] = []
    if (title) queryParams.push(`title=${encodeURIComponent(title)}`)
    if (page !== undefined) queryParams.push(`page=${page}`)
    if (perPage !== undefined) queryParams.push(`perPage=${perPage}`)

    const queryString: string = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''
    return await this.get(`/games${queryString}`)
  }

  /**
   * getGameById
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getGameById(id: number): Promise<GameModel> {
    return await this.get(`/game/${id}`)
  }

  /**
   * deleteGame
   * @param {number} gameId - gameId
   * @returns {Promise<void>} - void
   */
  public static async deleteGame(gameId: number): Promise<void> {
    await this.delete(`/game/${gameId}`)
  }

  /**
   * createGame
   * @param {iGameCommand} game - game
   * @returns {void} - void
   */
  public static async createGame(game: iGameCommand): Promise<void> {
    await this.post('/game', game)
  }

  /**
   * updateGame
   * @param {iUpdateGameCommand} game - game
   * @returns {Promise<void>} - void
   */
  public static async updateGame(game: iUpdateGameCommand): Promise<void> {
    await this.put(`/game/${game.id}`, game)
  }

  /**
   * getPlatformsByGameId
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getPlatformsByGameId(id: number): Promise<GameModel> {
    return await this.get(`/game/${id}/platforms`)
  }

  /**
   * getBinariesByGameId
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getBinariesByGameId(id: number): Promise<GameModel> {
    return await this.get(`/game/${id}/binaries`)
  }

  /**
   * getCategoriesByGameId
   * @param {number} id - id
   * @returns {GameModel} - game
   */
  public static async getCategoriesByGameId(id: number): Promise<GameModel> {
    return await this.get(`/game/${id}/categories`)
  }
}
