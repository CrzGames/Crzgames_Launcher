/**
 * CookieService
 * @class CookieService
 */
export default class CookieService {
  private static readonly DEFAULT_EXPIRATION_DAYS: number = 7
  private static readonly DAY_IN_MILLISECONDS: number = 24 * 60 * 60 * 1000
  private static readonly STORAGE_KEY_PREFIX: string = 'crzgames.'

  /**
   * Check if browser APIs are available.
   * @returns {boolean} - True if running in browser context
   */
  private static isBrowserContext(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
  }

  /**
   * Build localStorage key.
   * @param {string} name - Cookie name
   * @returns {string} - Storage key
   */
  private static getStorageKey(name: string): string {
    return `${this.STORAGE_KEY_PREFIX}${name}`
  }

  /**
   * Read fallback value from localStorage.
   * @param {string} name - Key name
   * @returns {string | undefined} - Stored value
   */
  private static readFromLocalStorage(name: string): string | undefined {
    if (!this.isBrowserContext()) {
      return undefined
    }

    try {
      return window.localStorage.getItem(this.getStorageKey(name)) || undefined
    } catch {
      return undefined
    }
  }

  /**
   * Persist fallback value in localStorage.
   * @param {string} name - Key name
   * @param {string} value - Value to persist
   * @returns {void}
   */
  private static writeToLocalStorage(name: string, value: string): void {
    if (!this.isBrowserContext()) {
      return
    }

    try {
      window.localStorage.setItem(this.getStorageKey(name), value)
    } catch {
      // Ignore storage failures (private mode / restricted storage)
    }
  }

  /**
   * Remove fallback value from localStorage.
   * @param {string} name - Key name
   * @returns {void}
   */
  private static removeFromLocalStorage(name: string): void {
    if (!this.isBrowserContext()) {
      return
    }

    try {
      window.localStorage.removeItem(this.getStorageKey(name))
    } catch {
      // Ignore storage failures
    }
  }

  /**
   * Get Cookie
   * @param {string} name - Cookie Name
   * @returns {string | undefined} - Cookie Value or undefined
   */
  public static getCookie(name: string): string | undefined {
    if (!this.isBrowserContext()) {
      return undefined
    }

    try {
      const match: RegExpMatchArray | null = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
      if (match && match[2]) {
        return decodeURIComponent(match[2])
      }
    } catch {
      // Ignore cookie parsing errors and fallback to localStorage.
    }

    return this.readFromLocalStorage(name)
  }

  /**
   * Set Cookie
   * @param {string} name - Cookie Name
   * @param {string} value - Cookie Value
   * @param {number} days - Cookie Expiration Days
   * @returns {void} - void
   */
  public static setCookie(name: string, value: string, days: number = CookieService.DEFAULT_EXPIRATION_DAYS): void {
    if (!this.isBrowserContext()) {
      return
    }

    const date: Date = new Date()
    date.setTime(date.getTime() + days * CookieService.DAY_IN_MILLISECONDS)

    try {
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`
    } catch {
      // Ignore cookie write failures (can happen on some embedded webviews).
    }

    this.writeToLocalStorage(name, value)
  }

  /**
   * Delete Cookie
   * @param {string} name - Cookie Name
   * @returns {void} - void
   */
  public static deleteCookie(name: string): void {
    if (!this.isBrowserContext()) {
      return
    }

    try {
      document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/;SameSite=Lax`
    } catch {
      // Ignore cookie delete failures.
    }

    this.removeFromLocalStorage(name)
  }
}
