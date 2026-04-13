import { getTimezoneList, formatInTimezone } from './timezone';

/** Parse an ISO offset like "+01:00" or "-05:30" into a signed minute count. */
function offsetToMinutes(offset: string): number {
  const sign = offset.startsWith('-') ? -1 : 1;
  const [h, m] = offset.slice(1).split(':').map(Number);
  return sign * (h * 60 + (m ?? 0));
}

/** "Europe/Warsaw" → "Europe/Warsaw"; "America/Argentina/Buenos_Aires" → "America/Buenos Aires". */
function prettifyTzName(tz: string): string {
  const parts = tz.split('/');
  const region = parts[0];
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  return parts.length === 1 ? tz : `${region}/${city}`;
}

/** Precomputed labels for each IANA timezone, e.g. "(UTC+01:00) Sarajevo". */
const TZ_LABELS = new Map<string, string>();

/**
 * Timezones sorted by current UTC offset (then city name), so the dropdown
 * groups zones by offset the way Outlook does.
 */
export const TIMEZONES: readonly string[] = (() => {
  const now = new Date().toISOString();
  const withMeta = getTimezoneList().map((tz) => {
    const offset = formatInTimezone(now, tz, 'xxx');
    const name = prettifyTzName(tz);
    TZ_LABELS.set(tz, `(UTC${offset}) ${name}`);
    return { tz, offsetMin: offsetToMinutes(offset), name };
  });
  withMeta.sort((a, b) =>
    a.offsetMin !== b.offsetMin ? a.offsetMin - b.offsetMin : a.name.localeCompare(b.name),
  );
  return withMeta.map((x) => x.tz);
})();

export function getTimezoneLabel(tz: string): string {
  const cached = TZ_LABELS.get(tz);
  if (cached) return cached;
  // Fall back for timezones not in the curated list (e.g. a saved event on
  // an older/unknown zone) — compute once and cache.
  const offset = formatInTimezone(new Date().toISOString(), tz, 'xxx');
  const label = `(UTC${offset}) ${prettifyTzName(tz)}`;
  TZ_LABELS.set(tz, label);
  return label;
}
