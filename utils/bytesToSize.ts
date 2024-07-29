/**
 * Convert bytes to human readable size
 * @param {number} sizeBytes - size in bytes
 * @returns {string} - human readable size
 */
export const bytesToSize: (sizeBytes: number) => string = (sizeBytes: number): string => {
  const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  if (sizeBytes === 0) return '0 Byte'
  const i: number = parseInt(Math.floor(Math.log(sizeBytes) / Math.log(1024)).toString())
  return (sizeBytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
}
