import { alpha, darken, lighten } from '@mui/material/styles';

export const EVENT_COLOR_PALETTE = [
  { base: '#3B82F6', bg: '#E8F1FF', border: '#B8D2FF' },
  { base: '#14B8A6', bg: '#E7FBF8', border: '#B1EFE6' },
  { base: '#8B5CF6', bg: '#F2ECFF', border: '#D8C8FF' },
  { base: '#F97316', bg: '#FFF1E8', border: '#FFD2B4' },
  { base: '#EF4444', bg: '#FDECEC', border: '#F7BBBB' },
  { base: '#06B6D4', bg: '#E7F9FE', border: '#B7EBF8' },
  { base: '#64748B', bg: '#EEF2F6', border: '#CBD5E1' },
  { base: '#10B981', bg: '#E8FBF3', border: '#B7EFD7' },
] as const;

export interface EventColorTheme {
  base: string;
  bg: string;
  border: string;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function deriveTheme(base: string): EventColorTheme {
  return {
    base,
    bg: alpha(base, 0.12),
    border: alpha(base, 0.28),
  };
}

export function getEventColorTheme(event: { id: string; color?: string | null }): EventColorTheme {
  if (event.color) {
    return (
      EVENT_COLOR_PALETTE.find((theme) => theme.base.toLowerCase() === event.color?.toLowerCase()) ??
      deriveTheme(event.color)
    );
  }
  return EVENT_COLOR_PALETTE[hashString(event.id) % EVENT_COLOR_PALETTE.length];
}

export function getEventTextColor(base: string, isDarkMode: boolean) {
  return isDarkMode ? lighten(base, 0.35) : darken(base, 0.35);
}
