/**
 * CookieService
 * @class CookieService
 */
export default class CookieService {
  private static readonly DEFAULT_EXPIRATION_DAYS: number = 7
  private static readonly DAY_IN_MILLISECONDS: number = 24 * 60 * 60 * 1000

  /**
   * Get Cookie
   * @param {string} name - Cookie Name
   * @returns {string | undefined} - Cookie Value or undefined
   */
  public static getCookie(name: string): string | undefined {
    const match: RegExpMatchArray | null = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    if (match) return match[2]
  }

  /**
   * Set Cookie
   * @param {string} name - Cookie Name
   * @param {string} value - Cookie Value
   * @param {number} days - Cookie Expiration Days
   * @returns {void} - void
   */
  public static setCookie(name: string, value: string, days: number = CookieService.DEFAULT_EXPIRATION_DAYS): void {
    const date: Date = new Date()
    date.setTime(date.getTime() + days * CookieService.DAY_IN_MILLISECONDS)
    document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/'
  }

  /**
   * Delete Cookie
   * @param {string} name - Cookie Name
   * @returns {void} - void
   */
  public static deleteCookie(name: string): void {
    this.setCookie(name, '', -1)
  }
}
