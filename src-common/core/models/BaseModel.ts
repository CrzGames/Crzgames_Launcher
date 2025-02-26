/**
 * @type {SuccessResponse}
 * @property {string} message - Message
 */
export type SuccessResponse = {
  message: string
}

/**
 * BaseModel
 * @class BaseModel
 */
export class BaseModel {
  public created_at: string
  public updated_at: string

  /**
   * Constructor
   * @param {string} createdAt - Created At
   * @param {string} updatedAt - Updated At
   */
  constructor(createdAt: string, updatedAt: string) {
    this.created_at = createdAt
    this.updated_at = updatedAt
  }
}
