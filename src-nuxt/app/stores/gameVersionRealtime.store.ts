import { defineStore } from 'pinia'

type GameVersionRealtimeState = {
  latestAvailableVersionByGameId: Record<number, string>
  latestNotifiedVersionByGameId: Record<number, string>
}

const normalizeVersion: (version?: string) => string | undefined = (version?: string): string | undefined => {
  const normalizedVersion: string = String(version || '').trim()
  return normalizedVersion.length > 0 ? normalizedVersion : undefined
}

export const useGameVersionRealtimeStore = defineStore('gameVersionRealtimeStore', {
  state: (): GameVersionRealtimeState => ({
    latestAvailableVersionByGameId: {},
    latestNotifiedVersionByGameId: {},
  }),
  actions: {
    cacheLatestAvailableVersion(gameId: number, version?: string): void {
      const normalizedVersion: string | undefined = normalizeVersion(version)
      if (!normalizedVersion || !Number.isFinite(gameId) || gameId <= 0) {
        return
      }

      this.latestAvailableVersionByGameId = {
        ...this.latestAvailableVersionByGameId,
        [gameId]: normalizedVersion,
      }
    },
    getLatestAvailableVersionByGameId(gameId: number): string | undefined {
      return normalizeVersion(this.latestAvailableVersionByGameId[gameId])
    },
    hasAlreadyNotifiedVersion(gameId: number, version: string): boolean {
      return normalizeVersion(this.latestNotifiedVersionByGameId[gameId]) === normalizeVersion(version)
    },
    markVersionAsNotified(gameId: number, version: string): void {
      const normalizedVersion: string | undefined = normalizeVersion(version)
      if (!normalizedVersion || !Number.isFinite(gameId) || gameId <= 0) {
        return
      }

      this.latestNotifiedVersionByGameId = {
        ...this.latestNotifiedVersionByGameId,
        [gameId]: normalizedVersion,
      }
    },
    clearAll(): void {
      this.latestAvailableVersionByGameId = {}
      this.latestNotifiedVersionByGameId = {}
    },
  },
})
