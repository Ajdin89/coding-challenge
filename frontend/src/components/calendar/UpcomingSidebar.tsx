import { useEffect, useState } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { formatDistanceToNowStrict } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { CalendarEvent } from '../../types/event';
import { getEventColorTheme, getEventTextColor } from '../../utils/eventColors';
import { formatInTimezone } from '../../utils/timezone';

interface UpcomingSidebarProps {
  events: CalendarEvent[];
  displayTimezone: string;
  onSelectEvent?: (event: CalendarEvent) => void;
}

function getRelativeLabel(event: CalendarEvent, now: number) {
  const start = new Date(event.startUtc).getTime();
  const end = new Date(event.endUtc).getTime();

  if (start <= now && end >= now) {
    return 'Happening now';
  }

  return `In ${formatDistanceToNowStrict(new Date(event.startUtc), { addSuffix: false })}`;
}

export function UpcomingSidebar({
  events,
  displayTimezone,
  onSelectEvent,
}: UpcomingSidebarProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const upcomingEvents = [...events]
    .filter((event) => new Date(event.endUtc).getTime() >= now)
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())
    .slice(0, 6);

  return (
    <Paper
      variant="outlined"
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background:
            'linear-gradient(180deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0) 100%)',
        }}
      >
        <Typography variant="overline" sx={{ letterSpacing: '0.14em', color: 'primary.main' }}>
          Upcoming
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          Next on your calendar
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {upcomingEvents.length > 0
            ? `${upcomingEvents.length} upcoming event${upcomingEvents.length === 1 ? '' : 's'}`
            : 'No upcoming events right now'}
        </Typography>
      </Box>

      <Stack spacing={1.25} sx={{ p: 1.5, overflowY: 'auto' }}>
        {upcomingEvents.map((event) => {
          const colors = getEventColorTheme(event);
          const day = toZonedTime(new Date(event.startUtc), displayTimezone);

          return (
            <Box
              key={event.id}
              onClick={() => onSelectEvent?.(event)}
              sx={(theme) => ({
                display: 'grid',
                gridTemplateColumns: '56px 1fr',
                gap: 1.25,
                p: 1.25,
                borderRadius: 2,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: alpha(colors.base, theme.palette.mode === 'dark' ? 0.38 : 0.2),
                bgcolor:
                  theme.palette.mode === 'dark' ? alpha(colors.base, 0.12) : colors.bg,
                transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: `0 10px 24px ${alpha(colors.base, 0.12)}`,
                  borderColor: alpha(colors.base, theme.palette.mode === 'dark' ? 0.6 : 0.32),
                },
              })}
            >
              <Box
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(colors.base, 0.14),
                  color: getEventTextColor(colors.base, false),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 56,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {formatInTimezone(event.startUtc, displayTimezone, 'MMM')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.05 }}>
                  {day.getDate()}
                </Typography>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {event.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatInTimezone(event.startUtc, displayTimezone, 'EEE, d MMM')}
                </Typography>
                <Typography variant="body2" sx={{ color: getEventTextColor(colors.base, false) }}>
                  {formatInTimezone(event.startUtc, displayTimezone, 'HH:mm')} -{' '}
                  {formatInTimezone(event.endUtc, displayTimezone, 'HH:mm')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getRelativeLabel(event, now)}
                  {event.timezone !== displayTimezone ? ` • ${event.timezone}` : ''}
                </Typography>
              </Box>
            </Box>
          );
        })}

        {upcomingEvents.length === 0 && (
          <Box
            sx={{
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              p: 2,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">Create an event to see your next meetings here.</Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
