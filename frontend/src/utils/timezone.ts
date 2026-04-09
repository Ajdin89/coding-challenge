import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

/**
 * Convert a local datetime string (from a datetime-local input) + timezone
 * into a UTC ISO string for storage.
 */
export function localToUtc(localDateStr: string, timezone: string): string {
  // localDateStr is "YYYY-MM-DDTHH:mm" from datetime-local input
  const date = new Date(localDateStr);
  const utc = fromZonedTime(date, timezone);
  return utc.toISOString();
}

/**
 * Convert a UTC ISO string into a "YYYY-MM-DDTHH:mm" string in the given timezone,
 * suitable for a datetime-local input value.
 */
export function utcToLocalInput(utcIso: string, timezone: string): string {
  const zoned = toZonedTime(new Date(utcIso), timezone);
  return format(zoned, "yyyy-MM-dd'T'HH:mm", { timeZone: timezone });
}

/**
 * Format a UTC ISO string for display in the given timezone.
 */
export function formatInTimezone(utcIso: string, timezone: string, fmt: string): string {
  const zoned = toZonedTime(new Date(utcIso), timezone);
  return format(zoned, fmt, { timeZone: timezone });
}

/**
 * Get hour + fractional minutes offset from midnight for a UTC time in a given timezone.
 * Used to position events on the time grid (0 = midnight, 23.99 = end of day).
 */
export function getHourOffsetInTimezone(utcIso: string, timezone: string): number {
  const zoned = toZonedTime(new Date(utcIso), timezone);
  return zoned.getHours() + zoned.getMinutes() / 60;
}

/**
 * Return the date portion (YYYY-MM-DD) of a UTC time in a given timezone.
 */
export function getDateInTimezone(utcIso: string, timezone: string): string {
  return formatInTimezone(utcIso, timezone, 'yyyy-MM-dd');
}

/**
 * A curated list of common IANA timezones. Browsers expose Intl.supportedValuesOf
 * in modern engines — fall back to a static list for older ones.
 */
export function getTimezoneList(): string[] {
  try {
    return (Intl as any).supportedValuesOf('timeZone') as string[];
  } catch {
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Sao_Paulo',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Moscow',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Singapore',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Australia/Sydney',
      'Pacific/Auckland',
    ];
  }
}
