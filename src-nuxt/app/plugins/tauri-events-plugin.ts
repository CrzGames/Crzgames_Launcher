import { defineNuxtPlugin } from '#app'
import { listen } from '@tauri-apps/api/event'
import type { Event as TauriEvent, UnlistenFn } from '@tauri-apps/api/event'

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
 * Mapping payload format for launcher Tauri events.
 */
type TauriEventPayload = Record<string, unknown>
/**
 * Generic event wrapper for launcher download events.
 */
type LauncherTauriEvent = TauriEvent<unknown>

/**
 * Normalise un payload Tauri en objet indexable.
 * @param {unknown} payload - Payload brut.
 * @returns {TauriEventPayload | null} - Payload converti ou `null` s'il est invalide.
 */
const toPayloadRecord: (payload: unknown) => TauriEventPayload | null = (
  payload: unknown,
): TauriEventPayload | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  return payload as TauriEventPayload
}

/**
 * Convertit une valeur inconnue en nombre.
 * @param {unknown} value - Valeur a convertir
 * @param {number} [fallback] - Valeur par defaut si conversion invalide
 * @returns {number} - Valeur numerique convertie.
 */
const toNumber: (value: unknown, fallback?: number) => number = (value: unknown, fallback: number = 0): number => {
  const parsed: number = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Resolve total size from payload.
 * - If payload explicitly contains `totalSizeToDownload`, keep it (including 0).
 * - Otherwise fallback to `gameBinarySize`.
 * @param {Record<string, unknown>} payload - Tauri event payload.
 * @returns {number} Total bytes to download
 */
const resolveTotalSizeToDownloadFromPayload: (payload: Record<string, unknown>) => number = (
  payload: Record<string, unknown>,
): number => {
  const hasTotalSizeToDownload: boolean = Object.prototype.hasOwnProperty.call(payload, 'totalSizeToDownload')
  if (hasTotalSizeToDownload) {
    return Math.max(toNumber(payload.totalSizeToDownload, 0), 0)
  }

  return Math.max(toNumber(payload.gameBinarySize, 0), 0)
}

/**
 * Extrait ou construit un identifiant de session depuis le payload.
 * @param {Record<string, unknown>} payload - Payload de l'event Tauri.
 * @param {number} gameId - Identifiant du jeu
 * @returns {string} - Identifiant de session.
 */
const getSessionIdFromPayload: (payload: Record<string, unknown>, gameId: number) => string = (
  payload: Record<string, unknown>,
  gameId: number,
): string => {
  const rawSessionId: string = typeof payload.sessionId === 'string' ? payload.sessionId.trim() : ''
  if (rawSessionId.length > 0) {
    return rawSessionId
  }

  return `game-${gameId}-unknown-session`
}

/**
 * Verifie si un event appartient a une session deja terminee.
 * @param {number} gameId - Identifiant du jeu
 * @param {string} sessionId - Session de telechargement
 * @returns {boolean} - `true` si la session est deja finalisee.
 */
const isCompletedSessionEvent: (gameId: number, sessionId: string) => boolean = (
  gameId: number,
  sessionId: string,
): boolean => completedSessionByGameId.get(gameId) === sessionId

/**
 * Met a jour la session courante d'un jeu a partir d'un event de progression.
 * @param {number} gameId - Identifiant du jeu
 * @param {string} sessionId - Session de telechargement
 * @returns {void} - Ne retourne aucune valeur.
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
 * @returns {void} - Ne retourne aucune valeur.
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
 * @returns {boolean} - `true` si la route active est Download Manager.
 */
const isDownloadManagerRouteActive: () => boolean = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.location.pathname.includes('/home/download-manager')
}

/**
 * Retourne l'intervalle de throttling des events de progression selon la page active.
 * @returns {number} - Intervalle en millisecondes.
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
 * @returns {Promise<string>} - URL de l'image.
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
export default defineNuxtPlugin<{ unlistenTauriEvents: () => void }>(async () => {
  let unlistenDownload: UnlistenFn
  let unlistenInstall: UnlistenFn
  let unlistenDownloadError: UnlistenFn

  /**
   * Ecouter l'evenement de progression du telechargement d'un jeu
   */
  unlistenDownload = await listen<TauriEventPayload>('download-game-progress', (event: LauncherTauriEvent) => {
    const payload: TauriEventPayload | null = toPayloadRecord(event.payload)
    if (!payload) {
      return
    }

    const gameIdFromPayload: number = toNumber(payload.gameId, -1)
    if (gameIdFromPayload < 0) {
      return
    }

    const totalSizeToDownload: number = resolveTotalSizeToDownloadFromPayload(payload)
    const rawTotalDownloaded: number = Math.max(toNumber(payload.totalDownloaded, 0), 0)
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
  unlistenInstall = await listen<TauriEventPayload>('game-installation-complete', (event: LauncherTauriEvent) => {
    enqueueTauriEventProcessing(async (): Promise<void> => {
      await handleGameInstallationComplete(event)
    })
  })

  /**
   * Ecouter les erreurs de telechargement pour remettre la card dans un etat coherent.
   */
  unlistenDownloadError = await listen<TauriEventPayload>('download-game-error', (event: LauncherTauriEvent) => {
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
       * @returns {void} - Ne retourne aucune valeur.
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
 * @param {LauncherTauriEvent} event - L'evenement de progression du telechargement.
 * @returns {Promise<void>} - Promesse de traitement.
 */
const handleDownloadProgress: (event: LauncherTauriEvent) => Promise<void> = async (
  event: LauncherTauriEvent,
): Promise<void> => {
  const payload: TauriEventPayload | null = toPayloadRecord(event.payload)
  if (!payload) {
    return
  }

  const downloadsStore: ReturnType<typeof useDownloadsStore> = useDownloadsStore()

  const gameId: number = toNumber(payload.gameId, -1)
  if (gameId < 0) {
    return
  }

  const sessionId: string = getSessionIdFromPayload(payload, gameId)

  if (isCompletedSessionEvent(gameId, sessionId)) {
    return
  }

  trackSessionFromProgressEvent(gameId, sessionId)

  const totalSizeToDownload: number = resolveTotalSizeToDownloadFromPayload(payload)
  const fallbackGameBinarySize: number = toNumber(payload.gameBinarySize, 0)

  const rawTotalDownloaded: number = Math.max(toNumber(payload.totalDownloaded, 0), 0)
  const totalDownloaded: number = totalSizeToDownload > 0 ? Math.min(rawTotalDownloaded, totalSizeToDownload) : 0
  const speed: number = totalSizeToDownload > 0 ? Math.max(toNumber(payload.speed, 0), 0) : 0
  const progress: number = totalSizeToDownload > 0 ? (totalDownloaded / totalSizeToDownload) * 100 : 100

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
    const gameVersionFromPayload: string = String(payload.gameVersion || '').trim()
    const activeDownloadGame: ActiveDownloadGame = {
      pathInstallLocation: String(payload.pathInstallLocation || ''),
      gameId: gameId,
      gameTitle: String(payload.gameTitle || ''),
      ...(gameVersionFromPayload ? { gameVersion: gameVersionFromPayload } : {}),
      gamePictureUrl: gamePictureUrl,
      isPlaying: true,
      isPreparingResume: false,
      progress: progress,
      totalDownloadedBytesNow: totalDownloaded,
      totalSizeToDownload: totalSizeToDownload,
      gameBinarySize: totalSizeToDownload > 0 ? fallbackGameBinarySize || totalSizeToDownload : 0,
      speed: `${speed}`,
      remainingTime: '',
      sessionId: sessionId,
      hasError: false,
      errorMessage: undefined,
    }
    downloadsStore.addActiveDownload(activeDownloadGame)
  } else if (existingActiveDownload?.isPlaying === false) {
    existingActiveDownload.isPlaying = true
    existingActiveDownload.isPreparingResume = false
    existingActiveDownload.hasError = false
    existingActiveDownload.errorMessage = undefined
  }

  if (totalSizeToDownload === 0) {
    const zeroDownload: ActiveDownloadGame | undefined = downloadsStore.activeDownloads.find(
      (activeDownload: ActiveDownloadGame): boolean => activeDownload.gameId === gameId,
    )
    if (zeroDownload) {
      zeroDownload.isPlaying = false
      zeroDownload.progress = 100
      zeroDownload.totalDownloadedBytesNow = 0
      zeroDownload.totalSizeToDownload = 0
      zeroDownload.speed = '0 B/s'
      zeroDownload.remainingTime = '0 min 0 sec'
    }
    return
  }

  downloadsStore.updateDownloadProgress(gameId, totalDownloaded, speed, totalSizeToDownload, sessionId)

  const activeDownloadAfterProgressUpdate: ActiveDownloadGame | undefined = downloadsStore.activeDownloads.find(
    (activeDownload: ActiveDownloadGame): boolean => activeDownload.gameId === gameId,
  )
  if (activeDownloadAfterProgressUpdate) {
    const gameVersionFromPayload: string = String(payload.gameVersion || '').trim()
    if (gameVersionFromPayload) {
      activeDownloadAfterProgressUpdate.gameVersion = gameVersionFromPayload
    }
  }

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
      userId: toNumber(payload.userId),
      gameId: gameId,
      gameTitle: String(payload.gameTitle || ''),
      pathInstallLocation: String(payload.pathInstallLocation || ''),
      totalSizeToDownload: totalSizeToDownload,
      totalDownloadedBytesNow: totalDownloaded,
      gameVersion: String(payload.gameVersion || ''),
    }

    void TauriService.saveGameProgressDownload(gameProgressDownload)
  }
}

/**
 * Gerer l'evenement de fin d'installation d'un jeu
 * @param {LauncherTauriEvent} event - L'evenement de fin d'installation du jeu.
 * @returns {Promise<void>} - Promesse de traitement.
 */
const handleGameInstallationComplete: (event: LauncherTauriEvent) => Promise<void> = async (
  event: LauncherTauriEvent,
): Promise<void> => {
  const payload: TauriEventPayload | null = toPayloadRecord(event.payload)
  if (!payload) {
    return
  }

  const downloadsStore: ReturnType<typeof useDownloadsStore> = useDownloadsStore()

  const gameId: number = toNumber(payload.gameId, -1)
  if (gameId < 0) {
    return
  }

  const sessionId: string = getSessionIdFromPayload(payload, gameId)

  latestSessionByGameId.set(gameId, sessionId)
  completedSessionByGameId.set(gameId, sessionId)
  lastPersistAtByGameId.delete(gameId)
  lastProgressLogAtByGameId.delete(gameId)
  lastEnqueuedProgressEventAtByGameId.delete(gameId)

  const totalSizeToDownload: number = resolveTotalSizeToDownloadFromPayload(payload)
  const fallbackGameBinarySize: number = toNumber(payload.gameBinarySize, 0)
  const rawTotalDownloaded: number = Math.max(toNumber(payload.totalDownloaded, totalSizeToDownload), 0)
  const totalDownloaded: number =
    totalSizeToDownload > 0 ? Math.min(rawTotalDownloaded, totalSizeToDownload) : rawTotalDownloaded

  logger.info('Game downloaded and installed successfully:' + JSON.stringify(payload))
  logger.info(
    `[Installation Complete Event] session=${sessionId} gameId=${gameId} userId=${toNumber(payload.userId)} filesCount=${toNumber(payload.filesCount)} totalDownloaded=${totalDownloaded} totalSizeToDownload=${totalSizeToDownload}`,
  )

  const gameManifest: GameManifestLocal = {
    pathInstallLocation: String(payload.fileLocationDownload || ''),
    gameId: gameId,
    gameTitle: String(payload.gameTitle || ''),
    gameBinarySize: fallbackGameBinarySize || totalSizeToDownload,
    version: String(payload.gameVersion || ''),
    files: [],
  }

  downloadsStore.updateDownloadProgress(gameId, totalDownloaded, 0, totalSizeToDownload, sessionId)

  try {
    await TauriService.finalizeDownload(toNumber(payload.userId), gameManifest)
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
 * @param {LauncherTauriEvent} event - L'evenement d'erreur du telechargement.
 * @returns {void} - Ne retourne aucune valeur.
 */
const handleDownloadError: (event: LauncherTauriEvent) => void = (event: LauncherTauriEvent): void => {
  const payload: TauriEventPayload | null = toPayloadRecord(event.payload)
  if (!payload) {
    return
  }

  const downloadsStore: ReturnType<typeof useDownloadsStore> = useDownloadsStore()
  const gameId: number = toNumber(payload.gameId, -1)
  if (gameId < 0) {
    return
  }

  const sessionId: string = getSessionIdFromPayload(payload, gameId)
  latestSessionByGameId.set(gameId, sessionId)
  completedSessionByGameId.delete(gameId)

  const activeDownload: ActiveDownloadGame | undefined = downloadsStore.activeDownloads.find(
    (download: ActiveDownloadGame): boolean => download.gameId === gameId,
  )
  if (activeDownload) {
    activeDownload.isPlaying = false
    activeDownload.speed = '0 B/s'
    activeDownload.remainingTime = '0 min 0 sec'
  }

  const rawError: string = String(payload.error || 'unknown')
  const normalizedError: string = rawError.toLowerCase()
  const isExpectedInterruption: boolean =
    normalizedError.includes('download paused') || normalizedError.includes('download canceled')

  if (isExpectedInterruption) {
    if (activeDownload) {
      activeDownload.hasError = false
      activeDownload.errorMessage = undefined
    }
    logger.info(`[Download Event] session=${sessionId} gameId=${gameId} interruption=${rawError}`)
    return
  }

  if (activeDownload) {
    activeDownload.hasError = true
    activeDownload.errorMessage = rawError
  }

  logger.error(`[Download Error Event] session=${sessionId} gameId=${gameId} error=${rawError}`)
}
