import { defineStore } from 'pinia'

import type GameModel from '#src-common/core/models/GameModel'
import type UserModel from '#src-common/core/models/UserModel'
import { GameService } from '#src-common/core/services/GameService'

import type { GameManifestLocal, GameProgressDownload } from '#src-core/services/TauriService'
import { TauriService } from '#src-core/services/TauriService'

/* TYPES */
/**
 * DownloadsStoreState permet de gÃƒÂ©rer les tÃƒÂ©lÃƒÂ©chargements actifs et complÃƒÂ©tÃƒÂ©s de l'utilisateur.
 * @type {object} DownloadsStoreState
 * @property {ActiveDownloadGame[]} activeDownloads - Les tÃƒÂ©lÃƒÂ©chargements actifs
 * @property {CompleteDownloadGame[]} completedDownloads - Les tÃƒÂ©lÃƒÂ©chargements complÃƒÂ©tÃƒÂ©s
 */
type DownloadsStoreState = {
  activeDownloads: ActiveDownloadGame[]
  completedDownloads: CompleteDownloadGame[]
  persistedDownloadsLoadedForUserId: number | null
}

/**
 * Downloads store state permet de gÃƒÂ©rer les tÃƒÂ©lÃƒÂ©chargements actifs et complÃƒÂ©tÃƒÂ©s
 * de l'utilisateur.
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const useDownloadsStore = defineStore('downloads', {
  /**
   * Permet de dÃƒÂ©finir l'ÃƒÂ©tat du store des tÃƒÂ©lÃƒÂ©chargements.
   * @returns {DownloadsStoreState} - Retourne l'ÃƒÂ©tat initial du store des tÃƒÂ©lÃƒÂ©chargements
   */
  state: (): DownloadsStoreState => ({
    activeDownloads: [],
    completedDownloads: [],
    persistedDownloadsLoadedForUserId: null,
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
      if (this.persistedDownloadsLoadedForUserId === user.id) {
        return
      }

      if (this.persistedDownloadsLoadedForUserId !== null && this.persistedDownloadsLoadedForUserId !== user.id) {
        this.activeDownloads = []
        this.completedDownloads = []
      }

      const gameProgressDownloads: GameProgressDownload[] | undefined = await TauriService.getGameProgressDownloads(
        user.id,
      )

      if (!gameProgressDownloads || gameProgressDownloads.length === 0) {
        this.persistedDownloadsLoadedForUserId = user.id
        return
      }

      for (const gameProgressDownload of gameProgressDownloads) {
        try {
          const gameManifestLocal: GameManifestLocal | undefined = await TauriService.getContentLocalManifest(
            gameProgressDownload.pathInstallLocation,
          )
          if (!gameManifestLocal) {
            continue
          }

          const game: GameModel = await GameService.getGameById(gameManifestLocal.gameId)

          const totalSizeToDownload: number =
            gameProgressDownload.totalSizeToDownload > 0
              ? gameProgressDownload.totalSizeToDownload
              : gameManifestLocal.gameBinarySize || 0
          const persistedDownloadedBytes: number = Number.isFinite(gameProgressDownload.totalDownloadedBytesNow)
            ? Math.max(gameProgressDownload.totalDownloadedBytesNow || 0, 0)
            : 0
          const clampedDownloadedBytesNow: number = Math.min(persistedDownloadedBytes, totalSizeToDownload)

          const activeDownload: ActiveDownloadGame = {
            pathInstallLocation: gameProgressDownload.pathInstallLocation,
            gameId: gameManifestLocal.gameId,
            gameTitle: gameManifestLocal.gameTitle,
            gameVersion: gameProgressDownload.gameVersion || gameManifestLocal.version,
            gamePictureUrl: game.pictureFile.url,
            isPlaying: false,
            progress: totalSizeToDownload > 0 ? Math.round((clampedDownloadedBytesNow / totalSizeToDownload) * 100) : 0,
            totalDownloadedBytesNow: clampedDownloadedBytesNow,
            totalSizeToDownload: totalSizeToDownload,
            gameBinarySize: gameManifestLocal.gameBinarySize,
            speed: '0 B/s',
            remainingTime: '0 min 0 sec',
            hasError: false,
            errorMessage: undefined,
          }

          this.addActiveDownload(activeDownload)
        } catch {
          continue
        }
      }

      this.persistedDownloadsLoadedForUserId = user.id
    },
    /**
     * Add active download
     * @param {ActiveDownloadGame} newGame - The game
     * @returns {void}
     */
    addActiveDownload(newGame: ActiveDownloadGame): void {
      // Checker si il y a un gameId correspondant dÃƒÂ©jÃƒÂ  dans le tableau le remplacer sinon ajouter
      const indexActiveDownload: number = this.activeDownloads.findIndex(
        (game: ActiveDownloadGame): boolean => game.gameId === newGame.gameId,
      )

      if (indexActiveDownload !== -1) {
        const currentActiveDownload: ActiveDownloadGame | undefined = this.activeDownloads[indexActiveDownload]
        if (!currentActiveDownload) {
          return
        }

        const hasSessionChanged: boolean =
          !!newGame.sessionId &&
          !!currentActiveDownload.sessionId &&
          newGame.sessionId !== currentActiveDownload.sessionId

        this.activeDownloads[indexActiveDownload] = {
          ...currentActiveDownload,
          ...newGame,
          hasError: newGame.hasError ?? (hasSessionChanged ? false : currentActiveDownload.hasError),
          errorMessage: newGame.errorMessage ?? (hasSessionChanged ? undefined : currentActiveDownload.errorMessage),
          smoothedSpeedBytesPerSecond: hasSessionChanged ? 0 : currentActiveDownload.smoothedSpeedBytesPerSecond,
          sessionStartedAtMs: hasSessionChanged ? undefined : currentActiveDownload.sessionStartedAtMs,
          sessionStartedDownloadedBytes: hasSessionChanged
            ? undefined
            : currentActiveDownload.sessionStartedDownloadedBytes,
          etaSecondsSmoothed: hasSessionChanged ? undefined : currentActiveDownload.etaSecondsSmoothed,
          lastTotalDownloadedBytes: hasSessionChanged ? undefined : currentActiveDownload.lastTotalDownloadedBytes,
          lastProgressAtMs: hasSessionChanged ? undefined : currentActiveDownload.lastProgressAtMs,
        }
      } else {
        this.activeDownloads.push(newGame)
      }

      // Checker si le jeu est dÃƒÂ©jÃƒÂ  dans les jeux complÃƒÂ©tÃƒÂ©s et le retirer
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
     * @param {string} [sessionId] - Current download session identifier
     * @returns {void}
     */
    updateDownloadProgress(
      gameId: number,
      totalDownloadedBytesNow: number,
      speed: number,
      totalSizeToDownload: number,
      sessionId?: string,
    ): void {
      const game: ActiveDownloadGame | undefined = this.activeDownloads.find(
        (game: ActiveDownloadGame): boolean => game.gameId === gameId,
      )

      if (game) {
        const now: number = Date.now()

        if (game.hasError) {
          game.hasError = false
          game.errorMessage = undefined
        }

        if (sessionId && game.sessionId !== sessionId) {
          game.sessionId = sessionId
          game.smoothedSpeedBytesPerSecond = 0
          game.sessionStartedAtMs = now
          game.sessionStartedDownloadedBytes = Math.max(totalDownloadedBytesNow || 0, 0)
          game.etaSecondsSmoothed = undefined
          game.lastTotalDownloadedBytes = game.sessionStartedDownloadedBytes
          game.lastProgressAtMs = now
        }

        const effectiveTotalSize: number =
          totalSizeToDownload > 0
            ? totalSizeToDownload
            : game.totalSizeToDownload > 0
              ? game.totalSizeToDownload
              : game.gameBinarySize > 0
                ? game.gameBinarySize
                : 1
        const clampedDownloadedBytesNow: number = Math.min(
          Math.max(totalDownloadedBytesNow || 0, 0),
          effectiveTotalSize,
        )
        game.totalDownloadedBytesNow = clampedDownloadedBytesNow
        game.totalSizeToDownload = effectiveTotalSize
        game.progress = Math.round((clampedDownloadedBytesNow / effectiveTotalSize) * 100)

        if (clampedDownloadedBytesNow >= effectiveTotalSize) {
          game.smoothedSpeedBytesPerSecond = 0
          game.speed = '0 B/s'
          game.remainingTime = '0 min 0 sec'
          game.etaSecondsSmoothed = 0
          return
        }

        if (!game.sessionStartedAtMs) {
          game.sessionStartedAtMs = now
          game.sessionStartedDownloadedBytes = clampedDownloadedBytesNow
        }

        const previousDownloadedBytes: number = game.lastTotalDownloadedBytes ?? clampedDownloadedBytesNow
        const previousProgressAtMs: number = game.lastProgressAtMs ?? now
        const downloadedDelta: number = Math.max(0, clampedDownloadedBytesNow - previousDownloadedBytes)
        const elapsedSecondsSincePreviousTick: number = Math.max((now - previousProgressAtMs) / 1000, 0.05)
        const measuredSpeedFromProgressDelta: number = downloadedDelta / elapsedSecondsSincePreviousTick

        const previousSmoothedSpeed: number = game.smoothedSpeedBytesPerSecond || 0
        let smoothedSpeed: number = previousSmoothedSpeed

        if (measuredSpeedFromProgressDelta > 0) {
          const smoothingAlpha: number = previousSmoothedSpeed > 0 ? 0.2 : 1
          smoothedSpeed =
            previousSmoothedSpeed > 0
              ? previousSmoothedSpeed * (1 - smoothingAlpha) + measuredSpeedFromProgressDelta * smoothingAlpha
              : measuredSpeedFromProgressDelta
        } else if (speed > 0) {
          const smoothingAlpha: number = previousSmoothedSpeed > 0 ? 0.12 : 1
          smoothedSpeed =
            previousSmoothedSpeed > 0 ? previousSmoothedSpeed * (1 - smoothingAlpha) + speed * smoothingAlpha : speed
        } else if (previousSmoothedSpeed > 0) {
          // Evite les sauts brutaux lorsque le tick courant recoit temporairement 0 bytes.
          smoothedSpeed = previousSmoothedSpeed * 0.97
        }

        game.smoothedSpeedBytesPerSecond = smoothedSpeed

        const sessionStartedAtMs: number = game.sessionStartedAtMs || now
        const sessionStartedDownloadedBytes: number = game.sessionStartedDownloadedBytes ?? clampedDownloadedBytesNow
        const elapsedSecondsSinceSessionStart: number = Math.max((now - sessionStartedAtMs) / 1000, 0.2)
        const downloadedSinceSessionStart: number = Math.max(
          0,
          clampedDownloadedBytesNow - sessionStartedDownloadedBytes,
        )
        const averageSessionSpeed: number = downloadedSinceSessionStart / elapsedSecondsSinceSessionStart
        const effectiveSpeedForEta: number = Math.max(smoothedSpeed, averageSessionSpeed * 0.6)

        if (effectiveSpeedForEta <= 0) {
          game.speed = game.speed || '0 B/s'
          game.remainingTime = game.remainingTime || '0 min 0 sec'
          return
        }

        game.speed = formatSpeed(effectiveSpeedForEta)
        const remainingBytes: number = Math.max(0, effectiveTotalSize - clampedDownloadedBytesNow)
        const rawRemainingSeconds: number = remainingBytes / effectiveSpeedForEta

        if (typeof game.etaSecondsSmoothed === 'number') {
          const smoothedEta: number = game.etaSecondsSmoothed * 0.75 + rawRemainingSeconds * 0.25
          const maxEtaIncreasePerTick: number = Math.max(10, game.etaSecondsSmoothed * 0.2)
          game.etaSecondsSmoothed = Math.min(smoothedEta, game.etaSecondsSmoothed + maxEtaIncreasePerTick)
        } else {
          game.etaSecondsSmoothed = rawRemainingSeconds
        }

        game.remainingTime = formatTime(game.etaSecondsSmoothed)
        game.lastTotalDownloadedBytes = clampedDownloadedBytesNow
        game.lastProgressAtMs = now
      }
    },
    /**
     * Complete download
     * @param {number} gameId - The game id
     * @returns {void}
     */
    async addCompleteDownload(gameId: number): Promise<void> {
      // VÃƒÂ©rifier si le jeu est dÃƒÂ©jÃƒÂ  dans les tÃƒÂ©lÃƒÂ©chargements complÃƒÂ©tÃƒÂ©s
      const isAlreadyCompleted: boolean = this.completedDownloads.some(
        (completedGame: { gameId: number }): boolean => completedGame.gameId === gameId,
      )

      if (isAlreadyCompleted) {
        return
      }

      // Rechercher le jeu dans les tÃƒÂ©lÃƒÂ©chargements actifs
      const index: number = this.activeDownloads.findIndex(
        (game: ActiveDownloadGame): boolean => game.gameId === gameId,
      )

      if (index !== -1) {
        const game: ActiveDownloadGame | undefined = this.activeDownloads.splice(index, 1)[0]
        if (!game) {
          return
        }

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
  gameVersion?: string
  gamePictureUrl: string
  isPlaying: boolean
  progress: number
  totalDownloadedBytesNow: number
  totalSizeToDownload: number
  gameBinarySize: number
  speed: string
  remainingTime: string
  sessionId?: string
  smoothedSpeedBytesPerSecond?: number
  sessionStartedAtMs?: number
  sessionStartedDownloadedBytes?: number
  etaSecondsSmoothed?: number
  lastTotalDownloadedBytes?: number
  lastProgressAtMs?: number
  hasError?: boolean
  errorMessage?: string
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
