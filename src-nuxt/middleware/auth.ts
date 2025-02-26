import { defineNuxtRouteMiddleware } from 'nuxt/app'
import type { RouteLocationNormalized } from 'vue-router'
import { TauriService } from '#src-core/services/TauriService'
import { useAuthStore } from '#src-nuxt/stores/auth.store'

/**
 * Middleware pour vérifier si l'utilisateur est connecté
 * Si l'utilisateur n'est pas connecté, il est redirigé vers la page de connexion
 * @param {RouteLocationNormalized} _to - Route vers laquelle l'utilisateur souhaite accéder
 * @param {RouteLocationNormalized} _from - Route depuis laquelle l'utilisateur souhaite accéder
 */
export default defineNuxtRouteMiddleware(async (_to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
  await useAuthStore().fetchUser()
  if (!useAuthStore().isConnected) {
    await TauriService.adjustWindowHomeToLoginForMiddleware(400, 585)
    return navigateTo('/login')
  }
})
