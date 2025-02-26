import { BaseModel } from '#src-common/core/models/BaseModel'

/**
 * UserRoleModel
 * @class UserRoleModel
 */
export default class UserRoleModel extends BaseModel {
  public id: number
  public name: string

  /**
   * Constructor
   * @param {UserRoleModel} role - UserRoleModel
   */
  constructor(role: UserRoleModel) {
    super(role.created_at, role.updated_at)
    this.id = role.id
    this.name = role.name
  }
}
