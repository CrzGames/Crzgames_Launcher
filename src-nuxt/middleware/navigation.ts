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
  navigationStore.addToHistory(to.path)
})
