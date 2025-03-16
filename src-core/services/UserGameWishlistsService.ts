import BaseApiService from '#src-common/core/services/BaseApiService'

import type { UserGameWishlistModel } from '#src-core/models/UserGameWishlistModel'

/**
 * UserGameWishlists
 * @class UserGameWishlists
 */
export default class UserGameWishlistsService extends BaseApiService {
  /**
   * Ajoute un nouveau jeu à la liste de souhaits de l'utilisateur
   * @param {UserGameWishlistModel} userGameWishlist - Le jeu à ajouter à la liste de souhaits de l'utilisateur
   * @returns {UserGameWishlistModel} - Le jeu ajouté à la liste de souhaits de l'utilisateur
   */
  public static async createUserGameWishlist(userGameWishlist: UserGameWishlistModel): Promise<UserGameWishlistModel> {
    return await this.post(`/user-game-wishlist`, userGameWishlist)
  }

  /**
   * Supprime un jeu de la liste de souhaits de l'utilisateur
   * @param {UserGameWishlistModel} userGameWishlist - Le jeu à supprimer de la liste de souhaits de l'utilisateur
   * @returns {UserGameWishlistModel} - Le jeu supprimé de la liste de souhaits de l'utilisateur
   */
  public static async deleteUserGameWishlist(userGameWishlist: UserGameWishlistModel): Promise<UserGameWishlistModel> {
    return await this.delete(`/user-game-wishlist/${userGameWishlist.id}`)
  }

  /**
   * Récupère la liste de souhaits de l'utilisateur
   * @param {number} userId - L'identifiant de l'utilisateur
   * @returns {UserGameWishlistModel[]} - La liste de souhaits de l'utilisateur
   */
  public static async getAllUserGameWishlist(userId: number): Promise<UserGameWishlistModel[]> {
    return await this.get(`/user-game-wishlist/${userId}`)
  }
}
