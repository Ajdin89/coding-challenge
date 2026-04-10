import { createFileRoute } from '@tanstack/react-router';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useCalendarStore } from '../../stores/calendarStore';
import { useEvents } from '../../hooks/useEvents';
import { CalendarToolbar } from '../../components/calendar/CalendarToolbar';
import { WeekView } from '../../components/calendar/WeekView';
import { DayView } from '../../components/calendar/DayView';
import { MonthView } from '../../components/calendar/MonthView';
import { EventModal } from '../../components/calendar/EventModal';

export const Route = createFileRoute('/calendar/')({
  component: CalendarPage,
});

function CalendarPage() {
  const { view } = useCalendarStore();
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
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {view === 'week' && <WeekView events={events} />}
          {view === 'day' && <DayView events={events} />}
          {view === 'month' && <MonthView events={events} />}
        </Box>
      )}

      <EventModal />
    </Box>
  );
}
