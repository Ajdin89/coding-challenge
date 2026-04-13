/**
 * Shared time-grid column rendering used by both WeekView and DayView.
 * Renders a list of hour rows + positioned event chips for a single day column.
 */
import { Box, Typography } from '@mui/material';
import { toZonedTime } from 'date-fns-tz';
import type { CalendarEvent } from '../../../types/event';
import { EventChip } from './EventChip';
import { getHourOffsetInTimezone, getDateInTimezone } from '../../../utils/timezone';

export const HOUR_HEIGHT = 48; // px per hour
const TOTAL_HOURS = 24;

interface TimeGridColumnProps {
  /** ISO date string YYYY-MM-DD for this column in displayTimezone */
  dateStr: string;
  events: CalendarEvent[];
  displayTimezone: string;
  onClickSlot: (startLocal: string, endLocal: string) => void;
  onClickEvent: (event: CalendarEvent) => void;
}

export function TimeGridColumn({
  dateStr,
  events,
  displayTimezone,
  onClickSlot,
  onClickEvent,
}: TimeGridColumnProps) {
  const dayEvents = events.filter(
    (e) => getDateInTimezone(e.startUtc, displayTimezone) === dateStr,
  );

  // Weekend detection (0 = Sun, 6 = Sat) — use noon to avoid DST edge cases
  const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Current time in display timezone
  const nowZoned = toZonedTime(new Date(), displayTimezone);
  const todayStr = `${nowZoned.getFullYear()}-${String(nowZoned.getMonth() + 1).padStart(2, '0')}-${String(nowZoned.getDate()).padStart(2, '0')}`;
  const currentHourFraction = nowZoned.getHours() + nowZoned.getMinutes() / 60;

  const slotBg = (h: number): string | undefined => {
    if (isWeekend) return '#f5f5f5';
    if (dateStr < todayStr) return '#f5f5f5';
    if (dateStr === todayStr && h + 1 <= currentHourFraction) return '#f5f5f5';
    return undefined; // white (default)
  };

  const handleSlotClick = (hour: number) => {
    // Build a local datetime string for the clicked slot
    const [year, month, day] = dateStr.split('-');
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${year}-${month}-${day}T${pad(hour)}:00`;
    const end = `${year}-${month}-${day}T${pad(hour + 1)}:00`;
    onClickSlot(start, end);
  };

  return (
    <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
      {/* Hour slot rows */}
      {Array.from({ length: TOTAL_HOURS }, (_, h) => (
        <Box
          key={h}
          sx={{
            height: HOUR_HEIGHT,
            borderBottom: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            cursor: 'pointer',
            bgcolor: slotBg(h),
            '&:hover': { bgcolor: 'action.hover' },
          }}
          onClick={() => handleSlotClick(h)}
        >
          {/* Half-hour dashed divider */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              borderTop: '1px dashed',
              borderColor: 'divider',
              pointerEvents: 'none',
            }}
          />
        </Box>
      ))}

      {/* Positioned events */}
      {dayEvents.map((event) => {
        const startOffset = getHourOffsetInTimezone(event.startUtc, displayTimezone);
        const endOffset = getHourOffsetInTimezone(event.endUtc, displayTimezone);
        const top = startOffset * HOUR_HEIGHT;
        const height = Math.max((endOffset - startOffset) * HOUR_HEIGHT, 20);

        return (
          <EventChip
            key={event.id}
            event={event}
            displayTimezone={displayTimezone}
            onClick={onClickEvent}
            style={{
              position: 'absolute',
              top,
              left: 2,
              right: 2,
              height,
              zIndex: 1,
            }}
          />
        );
      })}
    </Box>
  );
}

function formatHour(h: number): string {
  if (h === 0) return '';
  if (h === 12) return '12 PM';
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
}

/** Left gutter showing hour labels */
export function TimeGutter() {
  return (
    <Box sx={{ width: 60, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider' }}>
      {/* Empty header row */}
      <Box sx={{ height: 0 }} />
      {Array.from({ length: TOTAL_HOURS }, (_, h) => (
        <Box
          key={h}
          sx={{
            height: HOUR_HEIGHT,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            pr: 1.5,
            pt: 0.5,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '0.7rem', lineHeight: 1, whiteSpace: 'nowrap' }}
          >
            {formatHour(h)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
