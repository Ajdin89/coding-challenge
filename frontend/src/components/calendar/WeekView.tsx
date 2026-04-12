import { useRef, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { startOfWeek, addDays, format } from 'date-fns';
import type { CalendarEvent } from '../../types/event';
import { useCalendarStore } from '../../stores/calendarStore';
import { TimeGridColumn, TimeGutter, HOUR_HEIGHT } from './TimeGrid';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WeekViewProps {
  events: CalendarEvent[];
}

export function WeekView({ events }: WeekViewProps) {
  const { currentDate, displayTimezone, openCreateModal, openEditModal } = useCalendarStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Scroll to 8am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = HOUR_HEIGHT * 7;
    }
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Single scroll container — header is sticky inside so it always matches grid width */}
      <Box
        ref={scrollRef}
        sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        {/* Sticky day header */}
        <Box
          sx={{
            display: 'flex',
            borderBottom: '2px solid',
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 2,
            flexShrink: 0,
          }}
        >
          <Box sx={{ width: 60, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider' }} />
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isToday = dateStr === today;
            return (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  textAlign: 'center',
                  py: 1,
                  borderLeft: i > 0 ? '1px solid' : 'none',
                  borderRight: i === days.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {DAY_LABELS[i]}
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(isToday && { bgcolor: 'primary.main', color: 'primary.contrastText' }),
                  }}
                >
                  {format(day, 'd')}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Time grid */}
        <Box sx={{ flex: 1, display: 'flex' }}>
          <TimeGutter />
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            return (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  borderLeft: i > 0 ? '1px solid' : 'none',
                  borderRight: i === days.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  position: 'relative',
                }}
              >
                <TimeGridColumn
                  dateStr={dateStr}
                  events={events}
                  displayTimezone={displayTimezone}
                  onClickSlot={(start, end) => openCreateModal(start, end)}
                  onClickEvent={openEditModal}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}
