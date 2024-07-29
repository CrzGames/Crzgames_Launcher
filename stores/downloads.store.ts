import { defineStore } from 'pinia'
import type { GameManifestLocal, GameProgressDownload } from '~/services/TauriService'
import { TauriService } from '~/services/TauriService'
import type UserModel from '~/common/core/models/UserModel'
import type GameModel from '~/common/core/models/GameModel'
import { GameService } from '~/common/core/services/GameService'

// eslint-disable-next-line @typescript-eslint/typedef
export const useDownloadsStore = defineStore('downloads', {
  // eslint-disable-next-line jsdoc/require-returns
  /**
   * State
   */
  state: () => ({
    activeDownloads: [] as ActiveDownloadGame[],
    completedDownloads: [] as CompleteDownloadGame[],
  }),
  actions: {
    /**
     * Delete active download
     * @param {number} gameId - The game id
     * @param {number} userId - The user id
     * @returns {Promise<void>}
     */
    async deleteActiveDownload(gameId: number, userId: number): Promise<void> {
      const index: number = this.activeDownloads.findIndex(
        (game: ActiveDownloadGame): boolean => game.gameId === gameId,
      )

      if (index !== -1) {
        this.activeDownloads.splice(index, 1)
        await TauriService.removeGameProgressDownload(gameId, userId)
      }
    },
    /**
     * Load active downloads persisted
     * @param {UserModel} user - The user
     * @returns {void}
     */
    async loadActiveDownloadsPersisted(user: UserModel): Promise<void> {
      const gameProgressDownloads: GameProgressDownload[] | undefined = await TauriService.getGameProgressDownloads(
        user.id,
      )

      if (gameProgressDownloads) {
        for (const gameProgressDownload of gameProgressDownloads) {
          const gameManifestLocal: GameManifestLocal | undefined = await TauriService.getContentLocalManifest(
            gameProgressDownload.pathInstallLocation,
          )
          if (!gameManifestLocal) {
            return
          }

          const game: GameModel = await GameService.getGameById(gameManifestLocal.gameId)

          // Calculer le size total déjà télécharger via la clé 'files' puis 'size' de GameManifestLocal
          let totalDownloadedBytesNow: number = 0
          for (const file of gameManifestLocal.files) {
            totalDownloadedBytesNow += file.size
          }

          const activeDownload: ActiveDownloadGame = {
            pathInstallLocation: gameProgressDownload.pathInstallLocation,
            gameId: gameManifestLocal.gameId,
            gameTitle: gameManifestLocal.gameTitle,
            gamePictureUrl: game.pictureFile.url,
            isPlaying: false,
            progress: Math.round((totalDownloadedBytesNow / gameManifestLocal.gameBinarySize) * 100),
            totalDownloadedBytesNow: totalDownloadedBytesNow,
            totalSizeToDownload: gameProgressDownload.totalSizeToDownload,
            gameBinarySize: gameManifestLocal.gameBinarySize,
            speed: '',
            remainingTime: '',
          }

          this.addActiveDownload(activeDownload)
        }
      }
    },
    /**
     * Add active download
     * @param {ActiveDownloadGame} newGame - The game
     * @returns {void}
     */
    addActiveDownload(newGame: ActiveDownloadGame): void {
      // Checker si il y a un gameId correspondant déjà dans le tableau le remplacer sinon ajouter
      const indexActiveDownload: number = this.activeDownloads.findIndex(
        (game: ActiveDownloadGame): boolean => game.gameId === newGame.gameId,
      )

      if (indexActiveDownload !== -1) {
        this.activeDownloads[indexActiveDownload] = newGame
      } else {
        this.activeDownloads.push(newGame)
      }

      // Checker si le jeu est déjà dans les jeux complétés et le retirer
      const indexCompletedDownload: number = this.completedDownloads.findIndex(
        (game: CompleteDownloadGame): boolean => game.gameTitle === newGame.gameTitle,
      )
      if (indexCompletedDownload !== -1) {
        this.completedDownloads.splice(indexCompletedDownload, 1)
      }
    },
    /**
     * Update download progress
     * @param {number} gameId - The game id
     * @param {number} totalDownloadedBytesNow - The total downloaded bytes now
     * @param {number} speed - The download speed in bytes per second
     * @param {number} totalSizeToDownload - The total size of files to download
     * @returns {void}
     */
    updateDownloadProgress(
      gameId: number,
      totalDownloadedBytesNow: number,
      speed: number,
      totalSizeToDownload: number,
    ): void {
      const game: ActiveDownloadGame | undefined = this.activeDownloads.find(
        (game: ActiveDownloadGame): boolean => game.gameId === gameId,
      )

      if (game) {
        if (speed <= 0) {
          game.progress = Math.round((totalDownloadedBytesNow / totalSizeToDownload) * 100)
          game.speed = '0 B/s'
          game.remainingTime = '0 min 0 sec'
          return
        }

        game.totalDownloadedBytesNow = totalDownloadedBytesNow
        game.progress = Math.round((totalDownloadedBytesNow / totalSizeToDownload) * 100)
        game.speed = formatSpeed(speed)
        const remainingBytes: number = totalSizeToDownload - totalDownloadedBytesNow
        const remainingSeconds: number = remainingBytes / speed
        game.remainingTime = formatTime(remainingSeconds)
      }
    },
    /**
     * Complete download
     * @param {number} gameId - The game id
     * @returns {void}
     */
    async addCompleteDownload(gameId: number): Promise<void> {
      // Vérifier si le jeu est déjà dans les téléchargements complétés
      const isAlreadyCompleted: boolean = this.completedDownloads.some(
        (completedGame: { gameId: number }): boolean => completedGame.gameId === gameId,
      )

      if (isAlreadyCompleted) {
        return
      }

      // Rechercher le jeu dans les téléchargements actifs
      const index: number = this.activeDownloads.findIndex(
        (game: ActiveDownloadGame): boolean => game.gameId === gameId,
      )

      if (index !== -1) {
        const game: ActiveDownloadGame = this.activeDownloads.splice(index, 1)[0]
        this.completedDownloads.push({
          gameTitle: game.gameTitle,
          gamePictureUrl: game.gamePictureUrl,
          gameId: game.gameId,
        })
      } else {
        const gameDetails: GameModel = await GameService.getGameById(gameId)
        this.completedDownloads.push({
          gameTitle: gameDetails.title,
          gamePictureUrl: gameDetails.pictureFile.url,
          gameId: gameId,
        })
      }
    },

    /**
     * Set active downloads
     * @param {ActiveDownloadGame[]} games - The games
     * @returns {void}
     */
    setActiveDownloads(games: ActiveDownloadGame[]): void {
      this.activeDownloads = games
    },
    /**
     * Set completed downloads
     * @param {CompleteDownloadGame[]} games - The games
     * @returns {void}
     */
    setCompletedDownloads(games: CompleteDownloadGame[]): void {
      this.completedDownloads = games
    },
  },
})

/**
 * Format time from seconds to a human readable format
 * @param {number} seconds - The time in seconds
 * @returns {string} - The formatted time
 */
const formatTime: (seconds: number) => string = (seconds: number): string => {
  const minutes: number = Math.floor(seconds / 60)
  const remainingSeconds: number = Math.floor(seconds % 60)
  return `${minutes} min ${remainingSeconds} sec`
}

/**
 * Format speed to human readable format
 * @param {number} speed - Download speed in bytes per second
 * @returns {string} - Formatted speed with units
 */
const formatSpeed: (speed: number) => string = (speed: number): string => {
  if (speed >= 1048576) {
    return `${(speed / 1048576).toFixed(2)} MB/s`
  } else if (speed >= 1024) {
    return `${(speed / 1024).toFixed(2)} KB/s`
  } else {
    return `${speed.toFixed(2)} B/s`
  }
}

/**
 * Active download game
 * @type {ActiveDownloadGame}
 * @property {string} pathInstallLocation - The path install location
 * @property {number} gameId - The game id
 * @property {string} gameTitle - The game title
 * @property {string} gamePictureUrl - The game picture url
 * @property {boolean} isPlaying - The is playing
 * @property {number} progress - The progress
 * @property {number} totalDownloadedBytesNow - The total downloaded bytes now
 * @property {number} totalSizeToDownload - The total size to download
 * @property {number} gameBinarySize - The game binary size
 * @property {number} speed - The speed
 * @property {string} remainingTime - The remaining time
 */
export type ActiveDownloadGame = {
  pathInstallLocation: string
  gameId: number
  gameTitle: string
  gamePictureUrl: string
  isPlaying: boolean
  progress: number
  totalDownloadedBytesNow: number
  totalSizeToDownload: number
  gameBinarySize: number
  speed: string
  remainingTime: string
}

/**
 * Complete download game
 * @type {CompleteDownloadGame}
 * @property {string} gameTitle - The title
 * @property {string} gamePictureUrl - The image url
 */
export type CompleteDownloadGame = {
  gameTitle: string
  gamePictureUrl: string
  gameId: number
}
