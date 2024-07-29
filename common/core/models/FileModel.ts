import { BaseModel } from '@/common/core/models/BaseModel'
import type { BucketModel } from '@/common/core/models/BucketModel'

/**
 * File model
 * @class FileModel
 */
export default class FileModel extends BaseModel {
  public pathfilename: string
  public url: string
  public bucket_id: number
  public bucket: BucketModel
  public size: number

  /**
   * Constructor
   * @param {FileModel} file - file
   */
  constructor(file: FileModel) {
    super(file.created_at, file.updated_at)
    this.pathfilename = file.pathfilename
    this.url = file.url
    this.bucket_id = file.bucket_id
    this.bucket = file.bucket
    this.size = file.size
  }
}
