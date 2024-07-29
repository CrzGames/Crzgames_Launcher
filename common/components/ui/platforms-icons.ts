/**
 * Platforms icons
 * @type {object} tPlatformsIcons
 * @property {string[]} platforms - Platforms
 * @property {string} name - Icon name
 * @property {string} viewBox - View box
 */
export type tPlatformsIcons = {
  platforms: string[]
  name: string
  viewBox: string
}

export const platformsIcons: tPlatformsIcons[] = [
  {
    name: 'steam',
    platforms: ['steam'],
    viewBox: ' 0 0 496 512',
  },
  {
    name: 'microsoft-store',
    platforms: ['microsoft-store', 'Microsoft Store'],
    viewBox: '0 0 448 512',
  },
  {
    platforms: ['windows'],
    name: 'windows',
    viewBox: '0 0 448 512',
  },
  {
    platforms: ['linux'],
    name: 'linux',
    viewBox: '0 0 448 512',
  },
  {
    platforms: ['ubuntu'],
    name: 'ubuntu',
    viewBox: '0 0 496 512',
  },
  {
    platforms: ['playstation', 'playstation 5', 'playstation 4', 'PlayStation®5', 'PlayStation®4'],
    name: 'playstation',
    viewBox: '0 0 576 512',
  },
  {
    platforms: ['xbox', 'Xbox Series X|S', 'Xbox One', 'Xbox Series X', 'Xbox Series S', 'Xbox One X', 'Xbox One S'],
    name: 'xbox',
    viewBox: '0 0 512 512',
  },
  {
    platforms: ['android'],
    name: 'android',
    viewBox: '0 0 576 512',
  },
  {
    platforms: ['ios'],
    name: 'app-store',
    viewBox: '0 0 448 512',
  },
  {
    platforms: ['apple', 'macOS'],
    name: 'apple',
    viewBox: '0 0 384 512',
  },
  {
    platforms: ['nintendo-switch', 'Nintendo Switch'],
    name: 'nintendo-switch',
    viewBox: '0 0 550.000000 550.000000',
  },
  {
    platforms: ['html5', 'html'],
    name: 'html5',
    viewBox: '0 0 384 512',
  },
]
