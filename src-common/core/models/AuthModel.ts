/**
 * @class AuthModel
 */
export class AuthModel {
  public token: string
  public tokenType: string
  public expiresAt: string

  /**
   * @param {AuthModel} auth - AuthModel object
   */
  constructor(auth: AuthModel) {
    this.token = auth.token
    this.tokenType = auth.tokenType
    this.expiresAt = auth.expiresAt
  }
}

/**
 * @type {LoginCommand}
 * @property {string} email - Email
 * @property {string} password - Password
 */
export type LoginCommand = {
  email: string
  password: string
}

/**
 * @type {SignUpCommand}
 * @property {string} username - Username
 * @property {string} email - Email
 * @property {string} password - Password
 * @property {string} passwordConfirmation - Password confirmation
 */
export type SignUpCommand = {
  username: string
  email: string
  password: string
  passwordConfirmation: string
}

/**
 * @type {ValidateAccountCommand}
 * @property {number} code - Code
 * @property {string} email - Email
 */
export type ValidateAccountCommand = {
  code: number
  email: string
}

/**
 * @type {ResetPasswordCommand}
 * @property {string} token - Token
 * @property {string} newPassword - New password
 * @property {string} newPasswordConfirmation - New password confirmation
 */
export type ResetPasswordCommand = {
  token: string
  newPassword: string
  newPasswordConfirmation: string
}

/**
 * @type {ResetEmailCommand}
 * @property {string} token - Token
 * @property {string} newEmail - New email
 */
export type ResetEmailCommand = {
  token: string
  newEmail: string
}
