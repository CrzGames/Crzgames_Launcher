import { BaseModel } from '#src-common/core/models/BaseModel'
import type GameModel from '#src-common/core/models/GameModel'
import type UserModel from '#src-common/core/models/UserModel'

/**
 * Type représentant une entrée dans la wishlist d'un utilisateur (jeux qu'il dans sa liste d'envies).
 * @type {object} IUserGameWishlist
 * @property {number} id - L'identifiant unique de l'entrée.
 * @property {number} users_id - L'identifiant de l'utilisateur associé.
 * @property {number} games_id - L'identifiant du jeu associé.
 * @property {UserModel} [user] - L'utilisateur associé (optionnel).
 * @property {GameModel} [game] - Le jeu associé (optionnel).
 * @property {string} created_at - Date de création (format ISO).
 * @property {string} updated_at - Date de dernière mise à jour (format ISO).
 */
export type IUserGameWishlist = {
  id: number
  users_id: number
  games_id: number
  user: UserModel
  game: GameModel
  created_at: string
  updated_at: string
}

/**
 * Classe représentant la relation entre un utilisateur et un jeu dans sa wishlist.
 * @class UserGameWishlistModel
 * @augments BaseModel
 * @implements {IUserGameWishlist}
 */
export class UserGameWishlistModel extends BaseModel implements IUserGameWishlist {
  public id: number
  public users_id: number
  public games_id: number
  public user: UserModel
  public game: GameModel

  /**
   * Crée une instance de UserGameWishlistModel.
   * @class
   * @param {IUserGameWishlist} gameWishlist - Les données de la wishlist.
   */
  constructor(gameWishlist: IUserGameWishlist) {
    super(gameWishlist.created_at, gameWishlist.updated_at)
    this.id = gameWishlist.id
    this.users_id = gameWishlist.users_id
    this.games_id = gameWishlist.games_id
    this.user = gameWishlist.user
    this.game = gameWishlist.game
    this.created_at = gameWishlist.created_at
    this.updated_at = gameWishlist.updated_at
  }
}
