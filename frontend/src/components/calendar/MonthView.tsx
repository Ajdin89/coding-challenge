import { Box, Typography, Paper } from '@mui/material';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { CalendarEvent } from '../../types/event';
import { useCalendarStore } from '../../stores/calendarStore';
import { EventChip } from './EventChip';
import { getDateInTimezone } from '../../utils/timezone';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_VISIBLE = 3;

interface MonthViewProps {
  events: CalendarEvent[];
}

export function MonthView({ events }: MonthViewProps) {
  const { currentDate, displayTimezone, openCreateModal, openEditModal, setView, goToDate } =
    useCalendarStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const today = getDateInTimezone(new Date().toISOString(), displayTimezone);

  const handleDayClick = (day: Date) => {
    goToDate(day);
    setView('day');
  };

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Day-of-week headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid', borderColor: 'divider', flexShrink: 0 }}>
        {DAY_HEADERS.map((d) => (
          <Box key={d} sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {d}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: '1fr',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {days.map((day, idx) => {
          const dateStr = format(toZonedTime(day, displayTimezone), 'yyyy-MM-dd');
          const isToday = dateStr === today;
          const isCurrentMonth = isSameMonth(day, currentDate);

          const dayEvents = events.filter(
            (e) => getDateInTimezone(e.startUtc, displayTimezone) === dateStr,
          );
          const visible = dayEvents.slice(0, MAX_VISIBLE);
          const overflow = dayEvents.length - MAX_VISIBLE;

          return (
            <Box
              key={idx}
              sx={{
                borderRight: (idx + 1) % 7 !== 0 ? '1px solid' : 'none',
                borderBottom: idx < days.length - 7 ? '1px solid' : 'none',
                borderColor: 'divider',
                p: 0.5,
                minHeight: 80,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
                bgcolor: isCurrentMonth ? 'background.paper' : 'action.disabledBackground',
              }}
            >
              {/* Day number */}
              <Box
                onClick={() => handleDayClick(day)}
                sx={{ display: 'flex', justifyContent: 'flex-end', cursor: 'pointer' }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isToday ? 700 : 400,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                    ...(isToday && { bgcolor: 'primary.main', color: 'primary.contrastText' }),
                  }}
                >
                  {format(day, 'd')}
                </Typography>
              </Box>

              {/* Events */}
              {visible.map((event) => (
                <EventChip
                  key={event.id}
                  event={event}
                  displayTimezone={displayTimezone}
                  onClick={openEditModal}
                  compact
                />
              ))}

              {overflow > 0 && (
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ cursor: 'pointer', pl: 0.5 }}
                  onClick={() => handleDayClick(day)}
                >
                  +{overflow} more
                </Typography>
              )}

              {/* Click empty area to create */}
              <Box
                sx={{ flex: 1, cursor: 'pointer' }}
                onClick={() => {
                  const y = format(day, 'yyyy');
                  const m = format(day, 'MM');
                  const d = format(day, 'dd');
                  openCreateModal(`${y}-${m}-${d}T09:00`, `${y}-${m}-${d}T10:00`);
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
