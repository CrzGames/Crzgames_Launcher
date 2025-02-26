/**
 * Get S3 file URL
 * @param {string} path - path to the file
 * @param {string} bucketName - bucket name
 * @returns {string} - URL to the file
 */
export const getS3FileUrl: (path: string, bucketName: string) => string = (
  path: string,
  bucketName: string,
): string => {
  return `${import.meta.env.VITE_API_BASE_URL_S3_DOWNLOAD}/${bucketName}/${path}`
}
