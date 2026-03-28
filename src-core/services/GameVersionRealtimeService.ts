import { Subscription, Transmit } from '@adonisjs/transmit-client'
import CookieService from '#src-common/core/services/CookieService'
import { createLogger } from '#src-core/utils/logger'
import type { Logger } from '#src-core/utils/logger'

export type GameVersionAvailableRealtimePayload = {
  gameId: number
  gameTitle: string
  version: string
  isAvailable: boolean
  publishedAt: string
}

export type GameVersionRealtimeListener = (
  payload: GameVersionAvailableRealtimePayload,
) => void | Promise<void>

export type StopListeningToGameVersionUpdates = () => Promise<void>

export class GameVersionRealtimeService {
  private static readonly CHANNEL: string = 'launcher/game-versions/available'
  private static readonly logger: Logger = createLogger('GameVersionRealtimeService')

  private static client: Transmit | null = null
  private static subscription: Subscription | null = null
  private static unsubscribeOnMessage: (() => void) | null = null
  private static listeners: Set<GameVersionRealtimeListener> = new Set<GameVersionRealtimeListener>()

  private static getBaseUrl(): string {
    const configuredBaseUrl: string = String(import.meta.env.VITE_API_BASE_URL || '').trim()
    if (!configuredBaseUrl) {
      throw new Error('VITE_API_BASE_URL is missing for realtime game version updates')
    }

    return configuredBaseUrl
  }

  private static attachAuthorizationHeader(request: Request): void {
    const token: string | undefined = CookieService.getCookie('authToken')
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
  }

  private static ensureClient(): Transmit {
    if (this.client) {
      return this.client
    }

    this.client = new Transmit({
      baseUrl: this.getBaseUrl(),
      maxReconnectAttempts: 20,
      beforeSubscribe: (request: Request): void => {
        this.attachAuthorizationHeader(request)
      },
      beforeUnsubscribe: (request: Request): void => {
        this.attachAuthorizationHeader(request)
      },
      onSubscribeFailed: (response: Response): void => {
        this.logger.warn(
          `[SSE] Subscription failed status=${response.status} channel=${this.CHANNEL}`,
        )
      },
      onReconnectAttempt: (attempt: number): void => {
        this.logger.info(`[SSE] Reconnect attempt #${attempt}`)
      },
      onReconnectFailed: (): void => {
        this.logger.error('[SSE] Reconnect failed')
      },
    })

    this.client.on('connected', (): void => {
      this.logger.info('[SSE] Connected')
    })

    this.client.on('disconnected', (): void => {
      this.logger.warn('[SSE] Disconnected')
    })

    this.client.on('reconnecting', (): void => {
      this.logger.info('[SSE] Reconnecting')
    })

    return this.client
  }

  private static normalizePayload(payload: unknown): GameVersionAvailableRealtimePayload | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const rawPayload: Record<string, unknown> = payload as Record<string, unknown>
    const gameId: number = Number(rawPayload.gameId)
    const version: string = String(rawPayload.version || '').trim()
    const gameTitle: string = String(rawPayload.gameTitle || '').trim()
    const isAvailable: boolean = Boolean(rawPayload.isAvailable)
    const publishedAt: string = String(rawPayload.publishedAt || '').trim()

    if (!Number.isFinite(gameId) || gameId <= 0 || !version || !gameTitle) {
      return null
    }

    return {
      gameId,
      gameTitle,
      version,
      isAvailable,
      publishedAt,
    }
  }

  private static async dispatch(payload: unknown): Promise<void> {
    const normalizedPayload: GameVersionAvailableRealtimePayload | null = this.normalizePayload(payload)
    if (!normalizedPayload) {
      this.logger.warn('[SSE] Ignored malformed payload on game version channel')
      return
    }

    for (const listener of this.listeners) {
      try {
        await listener(normalizedPayload)
      } catch (error: unknown) {
        this.logger.error(
          `[SSE] Listener error: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
  }

  private static async ensureSubscription(): Promise<void> {
    const client: Transmit = this.ensureClient()

    if (!this.subscription || this.subscription.isDeleted) {
      this.subscription = client.subscription(this.CHANNEL)
    }

    if (!this.unsubscribeOnMessage && this.subscription) {
      this.unsubscribeOnMessage = this.subscription.onMessage<unknown>((payload: unknown): void => {
        void this.dispatch(payload)
      })
    }

    if (this.subscription && !this.subscription.isCreated) {
      await this.subscription.create()
      this.logger.info(`[SSE] Subscribed to ${this.CHANNEL}`)
    }
  }

  public static async subscribe(
    listener: GameVersionRealtimeListener,
  ): Promise<StopListeningToGameVersionUpdates> {
    this.listeners.add(listener)
    await this.ensureSubscription()

    return async (): Promise<void> => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) {
        await this.disconnect()
      }
    }
  }

  public static async disconnect(): Promise<void> {
    if (this.subscription) {
      try {
        if (this.subscription.isCreated && !this.subscription.isDeleted) {
          await this.subscription.delete()
        }
      } catch (error: unknown) {
        this.logger.warn(
          `[SSE] Failed to delete subscription: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage()
      this.unsubscribeOnMessage = null
    }

    this.subscription = null

    if (this.client) {
      this.client.close()
      this.client = null
    }
  }
}

