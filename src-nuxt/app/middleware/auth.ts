import { defineNuxtRouteMiddleware } from 'nuxt/app'
import type { RouteLocationNormalized } from 'vue-router'

import { TauriService } from '#src-core/services/TauriService'

import { useAuthStore } from '#src-nuxt/app/stores/auth.store'
import { useWindowStore } from '#src-nuxt/app/stores/window.store'

/**
 * Middleware pour vérifier si l'utilisateur est connecté
 * Si l'utilisateur n'est pas connecté, il est redirigé vers la page de connexion
 * @param {RouteLocationNormalized} _to - Route vers laquelle l'utilisateur souhaite accéder
 * @param {RouteLocationNormalized} _from - Route depuis laquelle l'utilisateur souhaite accéder
 */
export default defineNuxtRouteMiddleware(async (_to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
  const authStore: any = useAuthStore()
  const windowStore: ReturnType<typeof useWindowStore> = useWindowStore()

  const redirectToLoginSafely = async () => {
    try {
      await Promise.race([
        TauriService.adjustWindowHomeToLoginForMiddleware(400, 585),
        new Promise<void>((resolve: () => void) => setTimeout(resolve, 800)),
      ])
    } catch (error) {
      console.error('[auth middleware] Failed to adjust window before redirecting to login:', error)
    } finally {
      // Safety net to avoid infinite global loader if a resize transition stalls.
      windowStore.setLoading(false)
    }

    return await navigateTo('/login')
  }

  if (!authStore.authToken) {
    return await redirectToLoginSafely()
  }

  if (!authStore.user) {
    await authStore.fetchUser()
  }

  if (!authStore.isConnected) {
    return await redirectToLoginSafely()
  }
})
