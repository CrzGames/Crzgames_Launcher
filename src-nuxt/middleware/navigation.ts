import { defineNuxtRouteMiddleware } from 'nuxt/app'
import type { RouteLocationNormalized } from 'vue-router'

import { useNavigationStore } from '#src-nuxt/stores/navigation.store'

/**
 * Middleware pour enregistrer l'historique de navigation de l'utilisateur à partir de /home
 * @param {RouteLocationNormalized} to - Route vers laquelle l'utilisateur souhaite accéder
 * @param {RouteLocationNormalized} _from - Route depuis laquelle l'utilisateur souhaite accéder
 */
export default defineNuxtRouteMiddleware((to: RouteLocationNormalized, _from: RouteLocationNormalized): void => {
  const navigationStore: any = useNavigationStore()
  const excludedRoutes: string[] = ['/login', '/']

  // On ne stocke pas la page de login et l'index (auto update) dans l'historique
  if (!excludedRoutes.includes(to.path)) {
    navigationStore.addToHistory(to.path)
  }
})
