import { defineStore } from 'pinia'

import type GameBinaryModel from '#src-common/core/models/GameBinaryModel'
import type GameModel from '#src-common/core/models/GameModel'
import type GamePlatformModel from '#src-common/core/models/GamePlatformModel'
import { UserGameLibrariesService, type iGameLibraryCommand } from '#src-common/core/services/UserGameLibrariesService'

import type { SystemOSInfo } from '#src-core/services/TauriService'
import { TauriService } from '#src-core/services/TauriService'

import { useAuthStore } from '#src-nuxt/stores/auth.store'

/* TYPES */
/**
 * Game library store state
 * @type {object} GameLibraryStoreState
 * @property {GameModel[]} userGameLibraries - Library games
 * @property {GameModel[]} userGameLibrariesSortedByPlatform - Library games platforms
 */
type GameLibraryStoreState = {
  userGameLibraries: GameModel[]
  userGameLibrariesSortedByPlatform: GameModel[]
}

/**
 * Game library store permet de gérer la bibliothèque de jeux de l'utilisateur.
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const useUserGameLibrariesStore = defineStore('userGameLibrariesStore', {
  /**
   * Initialise l'état du store de la bibliothèque de jeux.
   * @returns {GameLibraryStoreState} - Retourne l'état initial du store de la bibliothèque de jeux
   */
  state: (): GameLibraryStoreState => ({
    userGameLibraries: [],
    userGameLibrariesSortedByPlatform: [],
  }),
  actions: {
    /**
     * setUserGameLibraries
     * @param {GameModel[]} games - games
     * @returns {void} - void
     */
    setUserGameLibraries(games: GameModel[]): void {
      this.userGameLibraries = games
    },

    /**
     * setUserGameLibrariesSortedByPlatform
     * @param {GameModel[]} games - games
     * @returns {void} - void
     */
    setUserGameLibrariesSortedByPlatform(games: GameModel[]): void {
      this.userGameLibrariesSortedByPlatform = games
    },

    /**
     * getUserGameLibraries
     * @param {string} title - title
     * @returns {GameModel[]} - GameModel[]
     */
    async getUserGameLibraries(title?: string): Promise<GameModel[]> {
      /**
       * Pas besoin de checker si l'utilisateur est connecté,
       * car les routes sont protégée par le middleware authentification.
       */
      const userId: number = useAuthStore().user?.id

      /**
       * Récupère tous les jeux de la bibliothèque de l'utilisateur par userId et
       * si un titre est fourni, il filtre les jeux par titre.
       */
      const games: GameModel[] = await UserGameLibrariesService.getAllUserGameLibrariesByUserId(userId, title)

      /**
       * Récupère le système d'exploitation actuel de l'utilisateur
       * pour récupérer les jeux de la bibliothèque de l'utilisateur par rapport à la plateforme
       * actuellement utiliser par le Launcher (Windows, Linux, Mac...)
       */
      const currentSystemOSInfo: SystemOSInfo | undefined = await TauriService.getSystemOSCurrent()
      const currentOsName: string | undefined = currentSystemOSInfo?.os
      if (currentOsName) {
        this.getUserGameLibrariesSortedByPlatform(currentOsName, games)
      }

      // Set les jeux de la bibliothèque de l'utilisateur
      this.setUserGameLibraries(games)

      // Retourne les jeux de la bibliothèque de l'utilisateur
      return games
    },

    /**
     * Permet de récupérer les jeux de la bibliothèque de l'utilisateur
     * par rapport à la plateforme actuellement utiliser par le Launcher (Windows, Linux, Mac...)
     * et si le binaire est disponible également sur cette plateforme.
     * @param {string} platformName - Nom de la plateforme
     * @param {GameModel[]} games - Jeux
     * @returns {GameModel[]} - Jeux de la bibliothèque de l'utilisateur par rapport à la plateforme
     */
    getUserGameLibrariesSortedByPlatform(platformName: string, games: GameModel[]): GameModel[] {
      // Met en minuscule le nom de la plateforme
      const lowerPlatformName: string = platformName.toLowerCase()

      // Filtre les jeux par rapport à la plateforme en checkant si il y a la plateform et le binaire de la plateforme
      const gamesSortedByPlatform: GameModel[] = games.filter((game: GameModel): boolean => {
        return (
          game.gamePlatform.some(
            (platform: GamePlatformModel): boolean => platform.name.toLowerCase() === lowerPlatformName,
          ) && // Compare in lowercase
          game.gameBinary.some(
            (binary: GameBinaryModel): boolean => binary.gamePlatform.name.toLowerCase() === lowerPlatformName,
          ) // Compare in lowercase
        )
      })

      // Set les jeux de la bibliothèque de l'utilisateur par rapport au jeux récupérer compatible avec la plateforme
      this.setUserGameLibrariesSortedByPlatform(gamesSortedByPlatform)

      // Retourne les jeux de la bibliothèque de l'utilisateur par rapport à la plateforme
      return gamesSortedByPlatform
    },

    /**
     * Permet d'ajouter un jeu à la bibliothèque de l'utilisateur par rapport à l'ID du jeu
     * en requêtant le service GameLibraryService pour ajouter en base de données
     * @param {number} gameId - L'ID du jeu
     * @returns {Promise<void>}
     */
    async addGameInUserGameLibrariesByGameId(gameId: number): Promise<void> {
      /**
       * Pas besoin de checker si l'utilisateur est connecté,
       * car les routes sont protégée par le middleware authentification.
       */
      const userId: number = useAuthStore().user?.id

      /**
       * Créer une commande pour ajouter un jeu à la bibliothèque de l'utilisateur
       * par rapport à l'ID du jeu et l'ID de l'utilisateur
       * @type {iGameLibraryCommand}
       */
      const gameLibraryCommand: iGameLibraryCommand = {
        userId,
        gameId,
      }

      /**
       * Ajoute le jeu à la bibliothèque de l'utilisateur
       * en requêtant le service GameLibraryService pour ajouter en base de données
       */
      await UserGameLibrariesService.addGameInUserGameLibrariesByGameIdAndUserId(gameLibraryCommand)

      /**
       * Récupère les jeux de la bibliothèque de l'utilisateur après l'ajout,
       * pour mettre à jour le store
       */
      await this.getUserGameLibraries()
    },
  },
})
