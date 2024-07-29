import type { DateTime } from 'luxon'

/**
 * Bucket access
 * @type {object}
 * @property {object} Grantee - grantee
 * @property {string} Grantee.type - grantee type
 * @property {string} Permission - permission
 */
export type BucketAccess = {
  Grantee: {
    type: string
  }
  Permission: string
}

/**
 * Bucket model
 * @class BucketModel
 */
export class BucketModel {
  public id?: number
  public name: string
  public visibility?: string
  public created_at: DateTime
  public updated_at: DateTime
  public totalObjects?: number
  public totalSize?: number
  public access?: BucketAccess[] = []

  /**
   * Constructor
   * @param {BucketModel} bucket - bucket
   */
  constructor(bucket: BucketModel) {
    this.created_at = bucket.created_at
    this.updated_at = bucket.updated_at
    this.name = bucket.name
    this.visibility = bucket.visibility
    this.totalObjects = bucket.totalObjects
    this.totalSize = bucket.totalSize
    this.access = bucket.access || this.access
  }
}
