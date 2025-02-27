import { defineNuxtRouteMiddleware } from 'nuxt/app'
import type { RouteLocationNormalized } from 'vue-router'

import { useAppStore } from '#src-nuxt/stores/app.store'

/**
 * Middleware pour stocker la route précédente
 * @param {RouteLocationNormalized} _to - The route to navigate to
 * @param {RouteLocationNormalized} from - The route from which the user is navigating
 * @returns {void} - Nothing
 */
export default defineNuxtRouteMiddleware((_to: RouteLocationNormalized, from: RouteLocationNormalized): void => {
  const appStore: any = useAppStore()
  appStore.setPreviousUrl(from.fullPath)
})
