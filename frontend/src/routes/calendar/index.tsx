import { createFileRoute } from '@tanstack/react-router';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useCalendarStore } from '../../stores/calendarStore';
import { useEvents } from '../../hooks/useEvents';
import { CalendarToolbar } from '../../components/calendar/CalendarToolbar';
import { WeekView } from '../../components/calendar/views/WeekView';
import { DayView } from '../../components/calendar/views/DayView';
import { MonthView } from '../../components/calendar/views/MonthView';
import { EventModal } from '../../components/calendar/modal/EventModal';
import { UpcomingSidebar } from '../../components/calendar/UpcomingSidebar';

export const Route = createFileRoute('/calendar/')({
  component: CalendarPage,
});

function CalendarPage() {
  const { view, displayTimezone, openEditModal } = useCalendarStore();
  const { data: events = [], isLoading, isError } = useEvents();

  if (isError) {
    return <Alert severity="error">Failed to load events. Is the backend running?</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <CalendarToolbar />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 2,
            p: 2,
          }}
        >
          <Box
            sx={{
              width: { xs: '100%', lg: 260 },
              flexShrink: 0,
              minHeight: { xs: 260, lg: 0 },
              order: { xs: 2, lg: 1 },
            }}
          >
            <UpcomingSidebar
              events={events}
              displayTimezone={displayTimezone}
              onSelectEvent={openEditModal}
            />
          </Box>

          <Box
            sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', order: { xs: 1, lg: 2 } }}
          >
            {view === 'week' && <WeekView events={events} />}
            {view === 'day' && <DayView events={events} />}
            {view === 'month' && <MonthView events={events} />}
          </Box>
        </Box>
      )}

      <EventModal />
    </Box>
  );
}
