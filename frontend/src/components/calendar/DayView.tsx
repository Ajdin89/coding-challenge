import { useRef, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { CalendarEvent } from '../../types/event';
import { useCalendarStore } from '../../stores/calendarStore';
import { TimeGridColumn, TimeGutter, HOUR_HEIGHT } from './TimeGrid';
import { getDateInTimezone } from '../../utils/timezone';

interface DayViewProps {
  events: CalendarEvent[];
}

export function DayView({ events }: DayViewProps) {
  const { currentDate, displayTimezone, openCreateModal, openEditModal } = useCalendarStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const dateStr = format(toZonedTime(currentDate, displayTimezone), 'yyyy-MM-dd');
  const today = getDateInTimezone(new Date().toISOString(), displayTimezone);
  const isToday = dateStr === today;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = HOUR_HEIGHT * 7;
    }
  }, []);

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', borderBottom: '2px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ width: 52, flexShrink: 0 }} />
        <Box sx={{ flex: 1, textAlign: 'center', py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {format(currentDate, 'EEEE')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              ...(isToday && { bgcolor: 'primary.main', color: 'primary.contrastText' }),
            }}
          >
            {format(currentDate, 'd')}
          </Typography>
        </Box>
      </Box>

      {/* Scrollable grid */}
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
        <TimeGutter />
        <Box sx={{ flex: 1, borderLeft: '1px solid', borderColor: 'divider', position: 'relative' }}>
          <TimeGridColumn
            dateStr={dateStr}
            events={events}
            displayTimezone={displayTimezone}
            onClickSlot={(start, end) => openCreateModal(start, end)}
            onClickEvent={openEditModal}
          />
        </Box>
      </Box>
    </Paper>
  );
}
