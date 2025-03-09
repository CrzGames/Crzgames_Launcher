import { defineStore } from 'pinia'

/**
 * Interface définissant l'état du store de navigation.
 * @type {object} NavigationState
 * @property {string[]} history - Liste des URLs visitées par l'utilisateur
 * @property {number} currentIndex - Index actuel dans l'historique
 */
type NavigationState = {
  history: string[] // Liste des URLs visitées par l'utilisateur
  currentIndex: number // Index actuel dans l'historique
}

/**
 * Store de navigation permettant de gérer l'historique de navigation.
 * Cela permet de naviguer en arrière et en avant dans l'historique.
 */
export const useNavigationStore: any = defineStore('navigation', {
  /**
   * Initialise l'état du store de navigation.
   * @returns {NavigationState} - Retourne l'état initial du store de navigation
   */
  state: (): NavigationState => ({
    history: [], // Initialise l'historique vide
    currentIndex: -1, // L'index commence à -1 car aucun historique au départ
  }),

  actions: {
    /**
     * Ajoute une nouvelle page à l'historique de navigation.
     * Si l'utilisateur navigue en arrière puis va sur une nouvelle page,
     * on supprime toutes les entrées futures pour éviter des incohérences.
     * @param {string} path - URL de la page actuelle
     * @returns {void}
     */
    addToHistory(path: string): void {
      if (this.history[this.currentIndex] !== path) {
        // Supprime les entrées futures si l'utilisateur revient en arrière
        this.history.splice(this.currentIndex + 1)
        // Ajoute la nouvelle page à l'historique
        this.history.push(path)
        // Met à jour l'index actuel
        this.currentIndex = this.history.length - 1
      }
    },

    /**
     * Retourne l'URL de la page précédente si elle existe.
     * @returns {string | null} - Retourne l'URL de la page précédente ou null si impossible
     */
    goBack(): string | null {
      if (this.currentIndex > 0) {
        this.currentIndex-- // Décrémente l'index pour aller à la page précédente
        return this.history[this.currentIndex]
      }
      return null // Retourne null si aucune page précédente n'est disponible
    },

    /**
     * Retourne l'URL de la page suivante si elle existe.
     * @returns {string | null} - Retourne l'URL de la page suivante ou null si impossible
     */
    goForward(): string | null {
      if (this.currentIndex < this.history.length - 1) {
        this.currentIndex++ // Incrémente l'index pour aller à la page suivante
        return this.history[this.currentIndex]
      }
      return null // Retourne null si aucune page suivante n'est disponible
    },
  },
})
