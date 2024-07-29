import BaseApiService from '@/common/core/services/BaseApiService'

/**
 * TotalSizeResponse
 * @type {object}
 * @property {number} totalSize - total size of the file or folder in bytes
 */
export type TotalSizeResponse = {
  totalSize: number
}

/**
 * CloudStorageS3Service
 * @class CloudStorageS3Service
 */
export class CloudStorageS3Service extends BaseApiService {
  /**
   * Get the total size of a file or folder in a bucket
   * @param {string} bucketName - AWS S3 bucket name
   * @param {string} pathFilename - path of the file or folder in the bucket
   * @returns {Promise<TotalSizeResponse>} - Renvoie une promesse de type TotalSizeResponse
   */
  public static async getTotalSizeFileOrFolderInBucket(
    bucketName: string,
    pathFilename: string,
  ): Promise<TotalSizeResponse> {
    return await this.post(`/cloud-storage-s3/file-or-folder/size`, {
      bucketName,
      pathFilename,
    })
  }

  /**
   * Get the content of a file in a bucket
   * @param {string} bucketName - AWS S3 bucket name
   * @param {string} pathFilename - path of the file in the bucket
   * @returns {Promise<string>} - Renvoie une promesse de type string
   */
  public static async getFileContentInBucket(bucketName: string, pathFilename: string): Promise<any> {
    return await this.post(`/cloud-storage-s3/content`, {
      bucketName,
      pathFilename,
    })
  }
}
