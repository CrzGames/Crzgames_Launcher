import { DateTime } from 'luxon'

/**
 * Convert a date string to a formatted string
 * @param {string} dateString - date string to convert
 * @returns {string | 'Invalid DateTime'} - formatted date string
 */
export const dateToStr: (dateString?: string) => string | 'Invalid DateTime' = (
  dateString?: string,
): string | 'Invalid DateTime' => {
  if (!dateString) return ''
  return DateTime.fromISO(dateString).toFormat("dd/MM/yy - HH'h'mm")
}
