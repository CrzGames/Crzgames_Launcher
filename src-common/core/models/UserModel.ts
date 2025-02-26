import { UserRoles } from '#src-common/core/enums/UserRoles'
import { BaseModel } from '#src-common/core/models/BaseModel'
import type UserRoleModel from '#src-common/core/models/UserRoleModel'

/**
 * @class UserModel
 */
export default class UserModel extends BaseModel {
  public id: number
  public username: string
  public email: string
  public rolesId: number
  public userRole: UserRoleModel
  public currency_code: string
  public ipAddress: string
  public ipRegion: string
  public isActive: number
  public activeCode: number

  /**
   * @param {UserModel} user - UserModel object
   */
  constructor(user: UserModel) {
    super(user.created_at, user.updated_at)
    this.id = user.id
    this.username = user.username
    this.email = user.email
    this.rolesId = user.rolesId
    this.userRole = user.userRole
    this.ipAddress = user.ipAddress
    this.ipRegion = user.ipRegion
    this.isActive = user.isActive
    this.activeCode = user.activeCode
    this.currency_code = user.currency_code
  }

  /**
   * Get Role Name
   * @returns {string} - Role Name
   */
  public get roleName(): string {
    return this.userRole.name
  }
  /**
   * Get isSupport
   * @returns {boolean} - isSupport
   */
  public get isSupport(): boolean {
    return this.isAdmin || this.isModerator || this.isStaff
  }
  /**
   * Get isAdmin
   * @returns {boolean} - isAdmin
   */
  public get isAdmin(): boolean {
    return this.roleName === UserRoles.ADMIN
  }
  /**
   * Get isModerator
   * @returns {boolean} - isModerator
   */
  public get isModerator(): boolean {
    return this.roleName === UserRoles.MODERATOR
  }
  /**
   * Get isStaff
   * @returns {boolean} - isStaff
   */
  public get isStaff(): boolean {
    return this.roleName === UserRoles.STAFF
  }
}
