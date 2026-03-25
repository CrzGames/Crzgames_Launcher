import { defineNuxtPlugin } from '#app'
import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'

import type GameModel from '#src-common/core/models/GameModel'
import { GameService } from '#src-common/core/services/GameService'

import type { GameManifestLocal, GameProgressDownload } from '#src-core/services/TauriService'
import { TauriService } from '#src-core/services/TauriService'
import { createLogger } from '#src-core/utils/logger'
import type { Logger } from '#src-core/utils/logger'

import { useDownloadsStore } from '#src-nuxt/app/stores/downloads.store'
import type { ActiveDownloadGame } from '#src-nuxt/app/stores/downloads.store'

/**
 * Instance du logger pour tracer les evenements des events Tauri
 * - Utilise createLogger avec un contexte specifique a "TauriEvents"
 * @type {Logger}
 */
const logger: Logger = createLogger('TauriEvents')

/**
 * Etat local de tracking des sessions de telechargement par jeu
 */
const latestSessionByGameId: Map<number, string> = new Map<number, string>()
const completedSessionByGameId: Map<number, string> = new Map<number, string>()
const gamePictureUrlCache: Map<number, string> = new Map<number, string>()
const pendingGamePictureByGameId: Map<number, Promise<string>> = new Map<number, Promise<string>>()
const lastPersistAtByGameId: Map<number, number> = new Map<number, number>()
const lastProgressLogAtByGameId: Map<number, number> = new Map<number, number>()
const lastEnqueuedProgressEventAtByGameId: Map<number, number> = new Map<number, number>()

const PERSIST_PROGRESS_INTERVAL_MS: number = 1000
const PROGRESS_LOG_INTERVAL_MS: number = 1000
const PROGRESS_EVENT_ENQUEUE_INTERVAL_MS_DOWNLOAD_MANAGER: number = 120
const PROGRESS_EVENT_ENQUEUE_INTERVAL_MS_BACKGROUND: number = 900
let tauriEventsProcessingQueue: Promise<void> = Promise.resolve()

/**
 * Convertit une valeur inconnue en nombre.
 * @param {unknown} value - Valeur a convertir
 * @param {number} [fallback] - Valeur par defaut si conversion invalide
 * @returns {number}
 */
const toNumber: (value: unknown, fallback?: number) => number = (value: unknown, fallback: number = 0): number => {
  const parsed: number = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Extrait ou construit un identifiant de session depuis le payload.
 * @param {any} payload - Payload de l'event Tauri
 * @param {number} gameId - Identifiant du jeu
 * @returns {string}
 */
const getSessionIdFromPayload: (payload: any, gameId: number) => string = (payload: any, gameId: number): string => {
  const rawSessionId: string = typeof payload?.sessionId === 'string' ? payload.sessionId.trim() : ''
  if (rawSessionId.length > 0) {
    return rawSessionId
  }

  return `game-${gameId}-unknown-session`
}

/**
 * Verifie si un event appartient a une session deja terminee.
 * @param {number} gameId - Identifiant du jeu
 * @param {string} sessionId - Session de telechargement
 * @returns {boolean}
 */
const isCompletedSessionEvent: (gameId: number, sessionId: string) => boolean = (
  gameId: number,
  sessionId: string,
): boolean => completedSessionByGameId.get(gameId) === sessionId

/**
 * Met a jour la session courante d'un jeu a partir d'un event de progression.
 * @param {number} gameId - Identifiant du jeu
 * @param {string} sessionId - Session de telechargement
 * @returns {void}
 */
const trackSessionFromProgressEvent: (gameId: number, sessionId: string) => void = (
  gameId: number,
  sessionId: string,
): void => {
  const previousSessionId: string | undefined = latestSessionByGameId.get(gameId)

  if (previousSessionId !== sessionId) {
    latestSessionByGameId.set(gameId, sessionId)
    completedSessionByGameId.delete(gameId)

    logger.info(
      `[Progress Event] session switched gameId=${gameId} previous=${previousSessionId || 'none'} current=${sessionId}`,
    )
  }
}

/**
 * Enfile un handler d'event Tauri pour les traiter sequentiellement et garder l'ordre.
 * @param {() => Promise<void>} handler - Handler asynchrone a executer
 * @returns {void}
 */
const enqueueTauriEventProcessing: (handler: () => Promise<void>) => void = (handler: () => Promise<void>): void => {
  tauriEventsProcessingQueue = tauriEventsProcessingQueue
    .then(async (): Promise<void> => {
      await handler()
    })
    .catch((error: unknown): void => {
      logger.error('[Tauri Events Queue] Error while processing event', error as Error)
    })
}

/**
 * Indique si la route active est la page Download Manager.
 * @returns {boolean}
 */
const isDownloadManagerRouteActive: () => boolean = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.location.pathname.includes('/home/download-manager')
}

/**
 * Retourne l'intervalle de throttling des events de progression selon la page active.
 * @returns {number}
 */
const getProgressEventEnqueueIntervalMs: () => number = (): number => {
  return isDownloadManagerRouteActive()
    ? PROGRESS_EVENT_ENQUEUE_INTERVAL_MS_DOWNLOAD_MANAGER
    : PROGRESS_EVENT_ENQUEUE_INTERVAL_MS_BACKGROUND
}

/**
 * Recupere l'URL d'image d'un jeu avec cache memoize.
 * @param {number} gameId - Identifiant du jeu
 * @param {ReturnType<typeof useDownloadsStore>} downloadsStore - Store des telechargements
 * @returns {Promise<string>}
 */
const getGamePictureUrlByGameId: (
  gameId: number,
  downloadsStore: ReturnType<typeof useDownloadsStore>,
) => Promise<string> = async (
  gameId: number,
  downloadsStore: ReturnType<typeof useDownloadsStore>,
): Promise<string> => {
  const gameFromActiveDownloads: ActiveDownloadGame | undefined = downloadsStore.activeDownloads.find(
    (activeDownload: ActiveDownloadGame): boolean => activeDownload.gameId === gameId,
  )

  if (gameFromActiveDownloads?.gamePictureUrl) {
    return gameFromActiveDownloads.gamePictureUrl
  }

  const cachedPictureUrl: string | undefined = gamePictureUrlCache.get(gameId)
  if (cachedPictureUrl) {
    return cachedPictureUrl
  }

  const pendingRequest: Promise<string> | undefined = pendingGamePictureByGameId.get(gameId)
  if (pendingRequest) {
    return pendingRequest
  }

  const newRequest: Promise<string> = GameService.getGameById(gameId)
    .then((game: GameModel): string => {
      const pictureUrl: string = game.pictureFile.url
      gamePictureUrlCache.set(gameId, pictureUrl)
      pendingGamePictureByGameId.delete(gameId)
      return pictureUrl
    })
    .catch((error: unknown): string => {
      pendingGamePictureByGameId.delete(gameId)
      logger.error(`[Progress Event] Failed to fetch game picture for gameId=${gameId}`, error as Error)
      return ''
    })

  pendingGamePictureByGameId.set(gameId, newRequest)
  return newRequest
}

/**
 * Gestionnaire de telechargements actifs et termines pour les jeux
 * - Utilise le store 'downloadsStore' pour ajouter, mettre a jour et supprimer les telechargements actifs et termines
 * - Utilise les services 'GameService' et 'TauriService' pour recuperer les informations des jeux et les sauvegarder
 */
export default defineNuxtPlugin(async () => {
  let unlistenDownload: UnlistenFn
  let unlistenInstall: UnlistenFn
  let unlistenDownloadError: UnlistenFn

  /**
   * Ecouter l'evenement de progression du telechargement d'un jeu
   */
  unlistenDownload = await listen('download-game-progress', (event: any) => {
    if (!event?.payload) {
      return
    }

    const gameIdFromPayload: number = toNumber(event.payload.gameId, -1)
    if (gameIdFromPayload < 0) {
      return
    }

    const payloadTotalSizeToDownload: number = toNumber(event.payload.totalSizeToDownload, 0)
    const fallbackGameBinarySize: number = toNumber(event.payload.gameBinarySize, 0)
    const totalSizeToDownload: number =
      payloadTotalSizeToDownload > 0 ? payloadTotalSizeToDownload : fallbackGameBinarySize
    const rawTotalDownloaded: number = Math.max(toNumber(event.payload.totalDownloaded, 0), 0)
    const isNearCompletionEvent: boolean = totalSizeToDownload > 0 && rawTotalDownloaded >= totalSizeToDownload

    const now: number = Date.now()
    const lastEnqueuedAt: number = lastEnqueuedProgressEventAtByGameId.get(gameIdFromPayload) || 0
    const currentEnqueueIntervalMs: number = getProgressEventEnqueueIntervalMs()
    const shouldEnqueueEvent: boolean = isNearCompletionEvent || now - lastEnqueuedAt >= currentEnqueueIntervalMs

    if (!shouldEnqueueEvent) {
      return
    }

    lastEnqueuedProgressEventAtByGameId.set(gameIdFromPayload, now)

    enqueueTauriEventProcessing(async (): Promise<void> => {
      await handleDownloadProgress(event)
    })
  })

  /**
   * Ecouter l'evenement d'installation terminee d'un jeu
   */
  unlistenInstall = await listen('game-installation-complete', (event: any) => {
    enqueueTauriEventProcessing(async (): Promise<void> => {
      await handleGameInstallationComplete(event)
    })
  })

  /**
   * Ecouter les erreurs de telechargement pour remettre la card dans un etat coherent.
   */
  unlistenDownloadError = await listen('download-game-error', (event: any) => {
    enqueueTauriEventProcessing((): Promise<void> => {
      handleDownloadError(event)
      return Promise.resolve()
    })
  })

  /**
   * Nettoyage des evenements quand l'application est detruite
   */
  return {
    provide: {
      /**
       * Arreter d'ecouter les evenements Tauri
       * @returns {void}
       */
      unlistenTauriEvents: (): void => {
        unlistenDownload()
        unlistenInstall()
        unlistenDownloadError()
      },
    },
  }
})

/**
 * Gerer la progression du telechargement
 * @param {any} event - L'evenement de progression du telechargement
 * @returns {Promise<void>}
 */
const handleDownloadProgress: (event: any) => Promise<void> = async (event: any): Promise<void> => {
  if (!event.payload) {
    return
  }

  const downloadsStore: ReturnType<typeof useDownloadsStore> = useDownloadsStore()

  const gameId: number = toNumber(event.payload.gameId, -1)
  if (gameId < 0) {
    return
  }

  const sessionId: string = getSessionIdFromPayload(event.payload, gameId)

  if (isCompletedSessionEvent(gameId, sessionId)) {
    return
  }

  trackSessionFromProgressEvent(gameId, sessionId)

  const payloadTotalSizeToDownload: number = toNumber(event.payload.totalSizeToDownload, 0)
  const fallbackGameBinarySize: number = toNumber(event.payload.gameBinarySize, 0)
  const totalSizeToDownload: number =
    payloadTotalSizeToDownload > 0 ? payloadTotalSizeToDownload : fallbackGameBinarySize

  const rawTotalDownloaded: number = Math.max(toNumber(event.payload.totalDownloaded, 0), 0)
  const totalDownloaded: number =
    totalSizeToDownload > 0 ? Math.min(rawTotalDownloaded, totalSizeToDownload) : rawTotalDownloaded
  const speed: number = Math.max(toNumber(event.payload.speed, 0), 0)
  const progress: number = totalSizeToDownload > 0 ? (totalDownloaded / totalSizeToDownload) * 100 : 0

  const gamePictureUrl: string = await getGamePictureUrlByGameId(gameId, downloadsStore)

  // Re-check apres await pour ignorer les events devenus obsoletes
  if (isCompletedSessionEvent(gameId, sessionId) || latestSessionByGameId.get(gameId) !== sessionId) {
    return
  }

  const existingActiveDownload: ActiveDownloadGame | undefined = downloadsStore.activeDownloads.find(
    (activeDownload: ActiveDownloadGame): boolean => activeDownload.gameId === gameId,
  )
  const shouldUpsertActiveDownload: boolean = existingActiveDownload?.sessionId !== sessionId

  if (shouldUpsertActiveDownload) {
    const activeDownloadGame: ActiveDownloadGame = {
      pathInstallLocation: event.payload.pathInstallLocation,
      gameId: gameId,
      gameTitle: event.payload.gameTitle,
      gamePictureUrl: gamePictureUrl,
      isPlaying: true,
      progress: progress,
      totalDownloadedBytesNow: totalDownloaded,
      totalSizeToDownload: totalSizeToDownload,
      gameBinarySize: fallbackGameBinarySize || totalSizeToDownload,
      speed: `${speed}`,
      remainingTime: '',
      sessionId: sessionId,
    }
    downloadsStore.addActiveDownload(activeDownloadGame)
  } else if (existingActiveDownload?.isPlaying === false) {
    existingActiveDownload.isPlaying = true
  }

  downloadsStore.updateDownloadProgress(gameId, totalDownloaded, speed, totalSizeToDownload, sessionId)

  const now: number = Date.now()
  const lastLogAt: number = lastProgressLogAtByGameId.get(gameId) || 0
  const shouldLogProgress: boolean =
    now - lastLogAt >= PROGRESS_LOG_INTERVAL_MS || totalDownloaded >= totalSizeToDownload

  if (shouldLogProgress) {
    lastProgressLogAtByGameId.set(gameId, now)
    logger.debug(
      `[Progress Event] session=${sessionId} gameId=${gameId} speed=${speed.toFixed(2)} totalDownloaded=${totalDownloaded} totalSize=${totalSizeToDownload} progress=${progress.toFixed(2)}%`,
    )
  }

  const lastPersistAt: number = lastPersistAtByGameId.get(gameId) || 0
  const shouldPersist: boolean =
    now - lastPersistAt >= PERSIST_PROGRESS_INTERVAL_MS || totalDownloaded >= totalSizeToDownload

  if (shouldPersist) {
    lastPersistAtByGameId.set(gameId, now)

    const gameProgressDownload: GameProgressDownload = {
      userId: toNumber(event.payload.userId),
      gameId: gameId,
      gameTitle: event.payload.gameTitle,
      pathInstallLocation: event.payload.pathInstallLocation,
      totalSizeToDownload: totalSizeToDownload,
      totalDownloadedBytesNow: totalDownloaded,
      gameVersion: event.payload.gameVersion,
    }

    void TauriService.saveGameProgressDownload(gameProgressDownload)
  }
}

/**
 * Gerer l'evenement de fin d'installation d'un jeu
 * @param {any} event - L'evenement de fin d'installation du jeu
 * @returns {Promise<void>}
 */
const handleGameInstallationComplete: (event: any) => Promise<void> = async (event: any): Promise<void> => {
  if (!event.payload) {
    return
  }

  const downloadsStore: ReturnType<typeof useDownloadsStore> = useDownloadsStore()

  const gameId: number = toNumber(event.payload.gameId, -1)
  if (gameId < 0) {
    return
  }

  const sessionId: string = getSessionIdFromPayload(event.payload, gameId)

  latestSessionByGameId.set(gameId, sessionId)
  completedSessionByGameId.set(gameId, sessionId)
  lastPersistAtByGameId.delete(gameId)
  lastProgressLogAtByGameId.delete(gameId)
  lastEnqueuedProgressEventAtByGameId.delete(gameId)

  const payloadTotalSizeToDownload: number = toNumber(event.payload.totalSizeToDownload, 0)
  const fallbackGameBinarySize: number = toNumber(event.payload.gameBinarySize, 0)
  const totalSizeToDownload: number =
    payloadTotalSizeToDownload > 0 ? payloadTotalSizeToDownload : fallbackGameBinarySize
  const rawTotalDownloaded: number = Math.max(toNumber(event.payload.totalDownloaded, totalSizeToDownload), 0)
  const totalDownloaded: number =
    totalSizeToDownload > 0 ? Math.min(rawTotalDownloaded, totalSizeToDownload) : rawTotalDownloaded

  logger.info('Game downloaded and installed successfully:' + JSON.stringify(event.payload))
  logger.info(
    `[Installation Complete Event] session=${sessionId} gameId=${gameId} userId=${toNumber(event.payload.userId)} filesCount=${toNumber(event.payload.filesCount)} totalDownloaded=${totalDownloaded} totalSizeToDownload=${totalSizeToDownload}`,
  )

  const gameManifest: GameManifestLocal = {
    pathInstallLocation: event.payload.fileLocationDownload,
    gameId: gameId,
    gameTitle: event.payload.gameTitle,
    gameBinarySize: fallbackGameBinarySize || totalSizeToDownload,
    version: event.payload.gameVersion,
    files: [],
  }

  downloadsStore.updateDownloadProgress(gameId, totalDownloaded, 0, totalSizeToDownload, sessionId)

  try {
    await TauriService.finalizeDownload(toNumber(event.payload.userId), gameManifest)
  } catch (error: unknown) {
    logger.error(
      `[Installation Complete Event] finalizeDownload failed session=${sessionId} gameId=${gameId}`,
      error as Error,
    )
  }

  await downloadsStore.addCompleteDownload(gameManifest.gameId)
}

/**
 * Gere l'evenement d'erreur de telechargement.
 * @param {any} event - L'evenement d'erreur du telechargement
 * @returns {void}
 */
const handleDownloadError: (event: any) => void = (event: any): void => {
  if (!event?.payload) {
    return
  }

  const downloadsStore: ReturnType<typeof useDownloadsStore> = useDownloadsStore()
  const gameId: number = toNumber(event.payload.gameId, -1)
  if (gameId < 0) {
    return
  }

  const sessionId: string = getSessionIdFromPayload(event.payload, gameId)
  latestSessionByGameId.set(gameId, sessionId)
  completedSessionByGameId.delete(gameId)

  const activeDownload: ActiveDownloadGame | undefined = downloadsStore.activeDownloads.find(
    (download: ActiveDownloadGame): boolean => download.gameId === gameId,
  )
  if (activeDownload) {
    activeDownload.isPlaying = false
    activeDownload.speed = '0 B/s'
  }

  logger.error(
    `[Download Error Event] session=${sessionId} gameId=${gameId} error=${String(event.payload.error || 'unknown')}`,
  )
}
