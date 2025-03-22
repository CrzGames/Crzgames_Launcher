/**
 * Convertit une taille en octets en une taille lisible par l'homme
 * @param {number} sizeBytes - taille en octets (bytes)
 * @returns {string} - taille lisible par l'homme
 */
export const bytesToSize: (sizeBytes: number) => string = (sizeBytes: number): string => {
  // Tableau des unités de taille en octets (bytes) jusqu'à TB (TeraBytes)
  const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  // Si la taille est égale à 0, on retourne '0 Byte'
  if (sizeBytes === 0) return '0 Byte'

  // Calcul de l'indice de l'unité de taille à utiliser
  const i: number = parseInt(Math.floor(Math.log(sizeBytes) / Math.log(1024)).toString())

  // Calcul de la taille en fonction de l'unité de taille et retour du résultat
  return (sizeBytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
}
