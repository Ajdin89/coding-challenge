import { Box, Typography, Tooltip } from '@mui/material';
import type { CalendarEvent } from '../../types/event';
import { formatInTimezone } from '../../utils/timezone';

interface EventChipProps {
  event: CalendarEvent;
  displayTimezone: string;
  onClick?: (event: CalendarEvent) => void;
  compact?: boolean;
  style?: React.CSSProperties;
}

export function EventChip({ event, displayTimezone, onClick, compact = false, style }: EventChipProps) {
  const startLabel = formatInTimezone(event.startUtc, displayTimezone, 'HH:mm');
  const endLabel = formatInTimezone(event.endUtc, displayTimezone, 'HH:mm');

  return (
    <Tooltip title={`${event.title} · ${startLabel}–${endLabel} (${event.timezone})`} arrow>
      <Box
        onClick={() => onClick?.(event)}
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 1,
          px: 0.75,
          py: 0.25,
          cursor: 'pointer',
          overflow: 'hidden',
          userSelect: 'none',
          '&:hover': { bgcolor: 'primary.dark', filter: 'brightness(1.1)' },
          ...style,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
          }}
        >
          {event.title}
        </Typography>
        {!compact && (
          <Typography
            variant="caption"
            sx={{ opacity: 0.85, display: 'block', lineHeight: 1.3, fontSize: '0.65rem' }}
          >
            {startLabel}–{endLabel}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}