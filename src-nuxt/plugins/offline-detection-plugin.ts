import { defineNuxtPlugin } from '#app'
import { invoke } from '@tauri-apps/api/core'
import type { Router } from 'vue-router'

import { useNavigationStore } from '#src-nuxt/stores/navigation.store'

/**
 * Plugin pour détecter la connexion à Internet et rediriger l'utilisateur
 */
export default defineNuxtPlugin(async (): Promise<void> => {
  const router: Router = await useRouter()
  const navigationStore: any = useNavigationStore()

  /**
   * Vérifie si l'application est connectée à Internet
   * et redirige l'utilisateur vers la page de connexion si la connexion est perdue
   * ou vers la page login si la connexion est retrouvée
   * @returns {Promise<void>}
   */
  const checkConnectionInternet: () => Promise<void> = async (): Promise<void> => {
    try {
      const isConnectedToInternet: unknown = await invoke('check_internet_connection')
      const currentPath: string = router.currentRoute.value.path

      if (!isConnectedToInternet && currentPath !== '/offline') {
        await navigateTo('/offline')
      } else if (isConnectedToInternet && currentPath === '/offline') {
        /**
         * Récupère la dernière page visitée avant /offline et
         * redirige vers /login si pas d'historique
         */
        const lastPage: string | null = navigationStore.goBack() || '/login'
        if (lastPage) {
          await navigateTo(lastPage)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la connexion :', error)
    }
  }

  // Vérifie la connexion à l'initialisation
  await checkConnectionInternet()

  // Vérifie la connexion toutes les 5 secondes
  setInterval(() => {
    void checkConnectionInternet()
  }, 5000)
})
