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
   * @param {string[]} [genres] - Liste des genres à filtrer (optionnel)
   * @param {string[]} [languages] - Liste des langues à filtrer (optionnel)
   * @param {string[]} [gameModes] - Liste des modes de jeu à filtrer (optionnel, ex: solo, multiplayer, both)
   * @param {boolean} [featuredGames] - Jeux en vedette (news ou à venir)
   * @param {string} [sortBy] - Option de tri ('releaseDate', 'titleAsc', 'titleDesc')
   * @returns {Promise<GamesResponse>} - Réponse contenant les jeux et les métadonnées de pagination
   */
  public static async getAllGames(
    title?: string,
    page?: number,
    perPage?: number,
    genres?: string[],
    languages?: string[],
    gameModes?: string[],
    featuredGames?: boolean,
    sortBy: string = 'releaseDate',
  ): Promise<GamesResponse> {
    const queryParams: string[] = []
    if (title) queryParams.push(`title=${encodeURIComponent(title)}`)
    if (page !== undefined) queryParams.push(`page=${page}`)
    if (perPage !== undefined) queryParams.push(`perPage=${perPage}`)
    if (genres && genres.length > 0) queryParams.push(`genres=${encodeURIComponent(genres.join(','))}`)
    if (languages && languages.length > 0) queryParams.push(`languages=${encodeURIComponent(languages.join(','))}`)
    if (gameModes && gameModes.length > 0) queryParams.push(`gameModes=${encodeURIComponent(gameModes.join(','))}`)
    if (featuredGames) queryParams.push(`featuredGames=${featuredGames}`)
    if (sortBy) queryParams.push(`sortBy=${encodeURIComponent(sortBy)}`) // Ajout du paramètre de tri

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
