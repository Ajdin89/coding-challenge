/** Compact dropdown: caps the menu at ~8 rows and uses dense list items. */
export const TIME_SELECT_MENU_PROPS = {
  MenuProps: {
    PaperProps: { sx: { maxHeight: 240 } },
    MenuListProps: { dense: true },
  },
} as const;

/** Format "HH:mm" → "h:mm AM/PM". */
export function formatTimeLabel(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${h < 12 ? 'AM' : 'PM'}`;
}

/** 30-minute time-of-day options, "HH:mm" → "h:mm AM/PM". */
export const HALF_HOUR_TIMES: readonly { value: string; label: string }[] = Array.from(
  { length: 48 },
  (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    const value = `${String(h).padStart(2, '0')}:${m}`;
    return { value, label: formatTimeLabel(value) };
  },
);

/** Split a "YYYY-MM-DDTHH:mm" string into separate date + time parts. */
export function splitLocal(local: string): { date: string; time: string } {
  if (!local) return { date: '', time: '' };
  const [date, time] = local.split('T');
  return { date: date ?? '', time: (time ?? '').slice(0, 5) };
}

/** Format the duration between two local date/time pairs as e.g. "1.5 hours". */
export function formatDurationLabel(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): string {
  if (!startDate || !startTime || !endDate || !endTime) return '';
  const startMs = new Date(`${startDate}T${startTime}`).getTime();
  const endMs = new Date(`${endDate}T${endTime}`).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return '';
  const diffMin = (endMs - startMs) / 60000;
  if (diffMin <= 0) return '';
  const hours = Math.round((diffMin / 60) * 2) / 2;
  if (hours >= 24) {
    const days = Math.round((hours / 24) * 10) / 10;
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}
