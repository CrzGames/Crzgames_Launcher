import { defineStore } from 'pinia'
import type {
  ResetPasswordCommand,
  ResetEmailCommand,
  LoginCommand,
  SignUpCommand,
  AuthModel,
} from '#src-common/core/models/AuthModel'
import UserModel from '#src-common/core/models/UserModel'
import AuthLoader from '#src-common/core/loaders/AuthLoader'
import { useAppStore } from '#src-nuxt/stores/app.store'
import CookieService from '#src-common/core/services/CookieService'
import type { SuccessResponse } from '#src-common/core/models/BaseModel'
import type { Router } from 'vue-router'
import { TauriService } from '#src-core/services/TauriService'

const user: string | undefined = CookieService.getCookie('user')
const tempVerifyEmail: string | undefined = CookieService.getCookie('temp_verify_email')
const authToken: string | undefined = CookieService.getCookie('authToken')

const router: Router = useRouter()
const { $notyf } = useNuxtApp()

/**
 * Type for state of the AuthStore
 * @interface AuthStore
 * @property {UserModel | undefined} user - The user
 * @property {string | undefined} authToken - The auth token
 * @property {string | undefined} tempVerifyEmail - The temp verify email
 */
interface AuthStore {
  user: UserModel | undefined
  authToken: string | undefined
  tempVerifyEmail: string | undefined
}

// eslint-disable-next-line @typescript-eslint/typedef
export const useAuthStore = defineStore('authStore', {
  /**
   * Get the state of the AuthStore
   * @returns {AuthStore} - The state of the AuthStore
   */
  state: (): AuthStore => ({
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
    /**
     * Set the temp verify email in the store and save it in the cookie
     * @param {string | undefined} email - The email to set
     * @returns {void} - Nothing
     */
    setTempVerifyEmail(email: string | undefined): void {
      if (email) {
        CookieService.setCookie('temp_verify_email', email)
      } else {
        CookieService.deleteCookie('temp_verify_email')
      }
      this.tempVerifyEmail = email
    },
    /* API */
    /**
     * Sign in the user
     * @param {LoginCommand} auth - The auth to sign in
     * @returns {Promise<AuthModel | null>} - The auth model or null
     */
    async signIn(auth: LoginCommand): Promise<AuthModel | null> {
      try {
        return await useAppStore().execWithPending<AuthModel>(async (): Promise<AuthModel> => {
          const result: AuthModel = await AuthLoader.signIn(auth)
          this.setAuthToken(result.token)
          await this.fetchUser()

          return result
        })
      } catch (e) {
        console.error(e)
        throw e
      }
    },
    /**
     * Sign up the user
     * @param {SignUpCommand} auth - The auth to sign up
     * @returns {Promise<void>} - Nothing
     */
    async signUp(auth: SignUpCommand): Promise<void> {
      try {
        await useAppStore().execWithPending<void>(async (): Promise<void> => {
          await AuthLoader.signUp(auth)
          this.setTempVerifyEmail(auth.email)
          await router.push({ name: 'account-validate' })
        })
      } catch (e) {
        console.error(e)
        $notyf.error('Failed to sign up')
      }
    },
    /**
     * Validate the account
     * @param {number} code - The code to validate
     * @returns {Promise<void>} - Nothing
     */
    async validateAccount(code: number): Promise<void> {
      if (!this.tempVerifyEmail) {
        $notyf.error('The validation code has expired, please request a new code')
        return
      }
      try {
        const res: SuccessResponse = await AuthLoader.validateAccount({
          code,
          email: this.tempVerifyEmail,
        })
        $notyf.success(res.message)
        this.setTempVerifyEmail(undefined)
        navigateTo('login')
      } catch (e) {
        console.error(e)
        $notyf.error('Failed to validate account')
      }
    },
    /**
     * Fetch the user
     * @returns {Promise<UserModel | null>} - The user model or null
     */
    async fetchUser(): Promise<UserModel | null> {
      if (!this.authToken) return null
      try {
        return await useAppStore().execWithPending<UserModel>(async (): Promise<UserModel> => {
          const result: UserModel = await AuthLoader.getUser()
          this.setUser(result)
          return result
        })
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
    /**
     * forgot password
     * @param {string} email - The email to send the forgot password
     * @returns {Promise<void>} - Nothing
     */
    async forgotPassword(email: string): Promise<void> {
      try {
        await useAppStore().execWithPending<void>(async (): Promise<void> => {
          const res: SuccessResponse = await AuthLoader.forgotPassword(email)
          $notyf.success(res.message)
        })
      } catch (e) {
        console.error(e)
        $notyf.error('Failed to send forgot password email')
      }
    },
    /**
     * Reset password
     * @param {ResetPasswordCommand} data - The data to reset the password
     * @returns {Promise<void>} - Nothing
     */
    async resetPassword(data: ResetPasswordCommand): Promise<void> {
      try {
        await useAppStore().execWithPending<void>(async (): Promise<void> => {
          await AuthLoader.resetPassword(data)
          navigateTo('login')
          $notyf.success('Password reset successfully')
        })
      } catch (e) {
        console.error(e)
        $notyf.error('Failed to reset password')
      }
    },
    /**
     * Modify email
     * @param {string} email - The email to modify
     * @returns {Promise<void>} - Nothing
     */
    async modifyEmail(email: string): Promise<void> {
      try {
        await useAppStore().execWithPending<void>(async (): Promise<void> => {
          await AuthLoader.modifyEmail(email)
          $notyf.success('An Email was sent to your old email address')
        })
      } catch (e) {
        console.error(e)
        $notyf.error('Failed to send email')
      }
    },
    /**
     * Reset email
     * @param {ResetEmailCommand} data - The data to reset the email
     * @returns {Promise<void>} - Nothing
     */
    async resetEmail(data: ResetEmailCommand): Promise<void> {
      try {
        await useAppStore().execWithPending<void>(async (): Promise<void> => {
          await AuthLoader.resetEmail(data)
          navigateTo('login')
          $notyf.success('Email reset successfully')
        })
      } catch (e) {
        console.error(e)
        $notyf.error('Failed to reset email')
      }
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
