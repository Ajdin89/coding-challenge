import { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { DayBadge } from '../../ui/DayBadge';
import { ViewContainer } from '../../ui/ViewContainer';
import { toZonedTime } from 'date-fns-tz';
import type { CalendarEvent } from '../../../types/event';
import { useCalendarStore } from '../../../stores/calendarStore';
import { TimeGridColumn, TimeGutter, HOUR_HEIGHT } from '../shared/TimeGrid';
import { getDateInTimezone } from '../../../utils/timezone';

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
    <ViewContainer>
      {/* Single scroll container — header sticky inside so width always matches grid */}
      <Box
        ref={scrollRef}
        sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        {/* Sticky header */}
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
          <Box sx={{ width: 60, flexShrink: 0 }} />
          <Box sx={{ flex: 1, textAlign: 'center', py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {format(currentDate, 'EEEE')}
            </Typography>
            <DayBadge day={format(currentDate, 'd')} isToday={isToday} size={36} variant="h6" />
          </Box>
        </Box>

        {/* Time grid */}
        <Box sx={{ flex: 1, display: 'flex' }}>
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
      </Box>
    </ViewContainer>
  );
}
