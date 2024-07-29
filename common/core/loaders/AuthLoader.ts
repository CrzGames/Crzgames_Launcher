import AuthService from '@/common/core/services/AuthService'
import type {
  LoginCommand,
  SignUpCommand,
  ValidateAccountCommand,
  ResetEmailCommand,
  ResetPasswordCommand,
} from '@/common/core/models/AuthModel'
import { AuthModel } from '@/common/core/models/AuthModel'
import UserModel from '@/common/core/models/UserModel'
import type { SuccessResponse } from '@/common/core/models/BaseModel'

/**
 * AuthLoader
 * @class AuthLoader
 */
export default class AuthLoader {
  /**
   * Create
   * @param {AuthModel} auth - AuthModel
   * @returns {AuthModel} - Renovie un objet de type AuthModel
   */
  public static create(auth: AuthModel): AuthModel {
    return new AuthModel(auth)
  }

  /**
   * Create User
   * @param {UserModel} user - UserModel
   * @returns {UserModel} - Renvoie un objet de type UserModel
   */
  public static createUser(user: UserModel): UserModel {
    return new UserModel(user)
  }

  /**
   * Sign In
   * @param {LoginCommand} auth - LoginCommand
   * @returns {Promise<AuthModel>} - Renvoie une promesse de type AuthModel
   */
  public static async signIn(auth: LoginCommand): Promise<AuthModel> {
    const result: AuthModel = await AuthService.signIn(auth)
    return this.create(result)
  }

  /**
   * Sign Up
   * @param {SignUpCommand} auth - SignUpCommand
   * @returns {Promise<void>}
   */
  public static async signUp(auth: SignUpCommand): Promise<void> {
    await AuthService.signUp(auth)
  }

  /**
   * Validate Account
   * @param {ValidateAccountCommand} params - ValidateAccountCommand
   * @returns {Promise<SuccessResponse>} - Renvoie une promesse de type SuccessResponse
   */
  public static async validateAccount(params: ValidateAccountCommand): Promise<SuccessResponse> {
    return await AuthService.validateAccount(params)
  }

  /**
   * Get User
   * @returns {Promise<UserModel>} - Renvoie une promesse de type UserModel
   */
  public static async getUser(): Promise<UserModel> {
    const result: UserModel = await AuthService.getUser()
    return this.createUser(result)
  }

  /**
   * Forgot Password
   * @param {string} email - email
   * @returns {Promise<SuccessResponse>} - Renvoie une promesse de type SuccessResponse
   */
  public static async forgotPassword(email: string): Promise<SuccessResponse> {
    return await AuthService.forgotPassword(email)
  }

  /**
   * Reset Password
   * @param {ResetPasswordCommand} params - ResetPasswordCommand
   * @returns {Promise<void>}
   */
  public static async resetPassword(params: ResetPasswordCommand): Promise<void> {
    return await AuthService.resetPassword(params)
  }

  /**
   * Modify Email
   * @param {string} email - email
   * @returns {Promise<void>}
   */
  public static async modifyEmail(email: string): Promise<void> {
    return await AuthService.modifyEmail(email)
  }

  /**
   * Reset Email
   * @param {ResetEmailCommand} params - ResetEmailCommand
   * @returns {Promise<void>}
   */
  public static async resetEmail(params: ResetEmailCommand): Promise<void> {
    return await AuthService.resetEmail(params)
  }
}
