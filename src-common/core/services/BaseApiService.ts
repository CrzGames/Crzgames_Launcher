import CookieService from '#src-common/core/services/CookieService'
import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

/**
 * BaseApiService
 * @class BaseApiService
 */
export default class BaseApiService {
  protected static apiUrl: string = import.meta.env.VITE_API_BASE_URL
  /**
   * Client
   * @returns {AxiosInstance} - AxiosInstance
   */
  protected static client(): AxiosInstance {
    const token: string | undefined = CookieService.getCookie('authToken')

    return axios.create({
      baseURL: this.apiUrl,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  }

  /**
   * Get
   * @template T
   * @param {string} url - URL
   * @returns {T} - T
   */
  protected static async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<any, any> = await this.client().get(url)
    return response.data
  }

  /**
   * Post
   * @template T
   * @param {string} url - URL
   * @param {any} data - Data
   * @returns {Promise<T>} - Promise<T>
   */
  protected static async post<T>(url: string, data: any): Promise<T> {
    const response: AxiosResponse<any, any> = await this.client().post(url, data)
    return response.data
  }

  /**
   * Put
   * @template T
   * @param {string} url - URL
   * @param {any} data - Data
   * @returns {Promise<T>} - Promise<T>
   */
  protected static async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<any, any> = await this.client().put(url, data)
    return response.data
  }

  /**
   * Delete
   * @template T
   * @param {string} url - URL
   * @returns {Promise<T>} - Promise<T>
   */
  protected static async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<any, any> = await this.client().delete(url)
    return response.data
  }
}
