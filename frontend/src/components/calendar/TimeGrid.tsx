/**
 * Shared time-grid column rendering used by both WeekView and DayView.
 * Renders a list of hour rows + positioned event chips for a single day column.
 */
import { Box, Typography } from '@mui/material';
import type { CalendarEvent } from '../../types/event';
import { EventChip } from './EventChip';
import { getHourOffsetInTimezone, getDateInTimezone } from '../../utils/timezone';

export const HOUR_HEIGHT = 64; // px per hour
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
          onClick={() => handleSlotClick(h)}
          sx={{
            height: HOUR_HEIGHT,
            borderBottom: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        />
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

/** Left gutter showing hour labels */
export function TimeGutter() {
  return (
    <Box sx={{ width: 52, flexShrink: 0 }}>
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
            pr: 1,
            pt: 0.25,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
