import BaseApiService from '#src-common/core/services/BaseApiService'
import type {
  ValidateAccountCommand,
  ResetEmailCommand,
  ResetPasswordCommand,
  LoginCommand,
  SignUpCommand,
  AuthModel,
} from '#src-common/core/models/AuthModel'
import type UserModel from '#src-common/core/models/UserModel'
import type { SuccessResponse } from '#src-common/core/models/BaseModel'

/**
 * AuthService
 * @class AuthService
 */
export default class AuthService extends BaseApiService {
  /**
   * Sign In
   * @param {LoginCommand} auth - LoginCommand
   * @returns {Promise<AuthModel>} - AuthModel
   */
  public static async signIn(auth: LoginCommand): Promise<AuthModel> {
    return await this.post('/signin', auth)
  }

  /**
   * Sign Up
   * @param {SignUpCommand} auth - SignUpCommand
   * @returns {Promise<void>}
   */
  public static async signUp(auth: SignUpCommand): Promise<void> {
    await this.post('/signup', auth)
  }

  /**
   * Validate Account
   * @param {ValidateAccountCommand} params - ValidateAccountCommand
   * @returns {Promise<SuccessResponse>} - SuccessResponse
   */
  public static async validateAccount(params: ValidateAccountCommand): Promise<SuccessResponse> {
    return await this.post('/verify', params)
  }

  /**
   * Get User
   * @returns {Promise<UserModel>} - UserModel
   */
  public static async getUser(): Promise<UserModel> {
    return await this.get('/user')
  }

  /**
   * Sign Out
   * @param {string} email - Email
   * @returns {Promise<SuccessResponse>} - SuccessResponse
   */
  public static async forgotPassword(email: string): Promise<SuccessResponse> {
    return await this.post('/forgot-password', { email })
  }

  /**
   * Reset Password
   * @param {ResetPasswordCommand} params - ResetPasswordCommand
   * @returns {Promise<void>}
   */
  public static async resetPassword(params: ResetPasswordCommand): Promise<void> {
    return await this.post('/reset-password', params)
  }

  /**
   * Modify Email
   * @param {string} email - Email
   * @returns {Promise<void>}
   */
  public static async modifyEmail(email: string): Promise<void> {
    return await this.post('/modify-email', { email })
  }

  /**
   * Reset Email
   * @param {ResetEmailCommand} params - ResetEmailCommand
   * @returns {Promise<void>}
   */
  public static async resetEmail(params: ResetEmailCommand): Promise<void> {
    return await this.post('/reset-email', params)
  }

  /**
   * Resend New Code Verification Account
   * @param {string} email - Email
   * @returns {Promise<void>}
   */
  public static async resendNewCodeVerificationAccount(email: string): Promise<void> {
    return await this.post('/resend-code', { email: email })
  }
}
