import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

import CookieService from '#src-common/core/services/CookieService'

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
   * @returns {Promise<T>} - Promise<T>
   */
  protected static async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client().get<T>(url)
    return response.data
  }

  /**
   * Post
   * @template T
   * @template D
   * @param {string} url - URL
   * @param {D} data - Data
   * @returns {Promise<T>} - Promise<T>
   */
  protected static async post<T, D = unknown>(url: string, data: D): Promise<T> {
    const response: AxiosResponse<T> = await this.client().post<T>(url, data)
    return response.data
  }

  /**
   * Put
   * @template T
   * @template D
   * @param {string} url - URL
   * @param {D | undefined} data - Data
   * @returns {Promise<T>} - Promise<T>
   */
  protected static async put<T, D = unknown>(url: string, data?: D): Promise<T> {
    const response: AxiosResponse<T> = await this.client().put<T>(url, data)
    return response.data
  }

  /**
   * Delete
   * @template T
   * @param {string} url - URL
   * @returns {Promise<T>} - Promise<T>
   */
  protected static async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client().delete<T>(url)
    return response.data
  }
}
