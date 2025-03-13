import { defineStore } from 'pinia'

import type { AuthModel, LoginCommand } from '#src-common/core/models/AuthModel'
import UserModel from '#src-common/core/models/UserModel'
import AuthService from '#src-common/core/services/AuthService'
import CookieService from '#src-common/core/services/CookieService'

import { TauriService } from '#src-core/services/TauriService'

/* DATA */
const user: string | undefined = CookieService.getCookie('user')
const tempVerifyEmail: string | undefined = CookieService.getCookie('temp_verify_email')
const authToken: string | undefined = CookieService.getCookie('authToken')

/* TYPES */
/**
 * Type for state of the AuthStoreState
 * @interface AuthStoreState
 * @property {UserModel | undefined} user - The user
 * @property {string | undefined} authToken - The auth token
 * @property {string | undefined} tempVerifyEmail - The temp verify email
 */
type AuthStoreState = {
  user: UserModel | undefined
  authToken: string | undefined
  tempVerifyEmail: string | undefined
}

/**
 * AuthStore permet de gérer l'authentification de l'utilisateur, la connexion, l'inscription, la déconnexion, etc.
 */
export const useAuthStore: any = defineStore('authStore', {
  /**
   * Permet de définir l'état du store de l'authentification.
   * @returns {AuthStoreState} - Retourne l'état initial du store de l'authentification
   */
  state: (): AuthStoreState => ({
    user: (user ? JSON.parse(user) : undefined) as UserModel | undefined,
    authToken: authToken as string | undefined,
    tempVerifyEmail: tempVerifyEmail as string | undefined,
  }),
  actions: {
    /**
     * Set the user in the store and save it in the cookie
     * @param {UserModel | undefined} user - The user to set
     * @returns {void} - Nothing
     */
    setUser(user: UserModel | undefined): void {
      if (user) {
        CookieService.setCookie('user', JSON.stringify(user))
        this.user = new UserModel(user)
      } else {
        CookieService.deleteCookie('user')
        this.user = undefined
      }
    },
    /**
     * Set the auth token in the store and save it in the cookie
     * @param {string | undefined} token - The token to set
     * @returns {void} - Nothing
     */
    setAuthToken(token: string | undefined): void {
      if (token) {
        CookieService.setCookie('authToken', token)
      } else {
        CookieService.deleteCookie('authToken')
      }

      this.authToken = token
    },
    /* API */
    /**
     * Sign in the user
     * @param {LoginCommand} auth - The auth to sign in
     * @returns {Promise<AuthModel | null>} - The auth model or null
     */
    async signIn(auth: LoginCommand): Promise<AuthModel | null> {
      try {
        const result: AuthModel = await AuthService.signIn(auth)
        this.setAuthToken(result.token)
        await this.fetchUser()

        return result
      } catch (e) {
        console.error(e)
        throw e
      }
    },
    /**
     * Fetch the user
     * @returns {Promise<UserModel | null>} - The user model or null
     */
    async fetchUser(): Promise<UserModel | null> {
      if (!this.authToken) return null
      try {
        const result: UserModel = await AuthService.getUser()
        this.setUser(result)
        return result
      } catch (e) {
        this.setAuthToken(undefined)
        this.setUser(undefined)
        console.error(e)
        return null
      }
    },
    /**
     * Sign out the user
     * @returns {void} - Nothing
     */
    async signOut(): Promise<void> {
      this.setAuthToken(undefined)
      this.setUser(undefined)
      await TauriService.adjustWindowHomeToLogin(400, 585)
    },
  },
  getters: {
    /**
     * Check if the user is connected
     * @returns {boolean} - True if the user is connected, false otherwise
     */
    isConnected(): boolean {
      return !!this.authToken && !!this.user
    },
  },
})
