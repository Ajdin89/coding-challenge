import { Box, Typography, Tooltip } from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import { alpha, darken, lighten } from '@mui/material/styles';
import type { CalendarEvent } from '../../types/event';
import { getEventColorTheme, getEventTextColor } from '../../utils/eventColors';
import { formatInTimezone } from '../../utils/timezone';

interface EventChipProps {
  event: CalendarEvent;
  displayTimezone: string;
  onClick?: (event: CalendarEvent) => void;
  compact?: boolean;
  style?: React.CSSProperties;
}

export function EventChip({
  event,
  displayTimezone,
  onClick,
  compact = false,
  style,
}: EventChipProps) {
  const startLabel = formatInTimezone(event.startUtc, displayTimezone, 'HH:mm');
  const endLabel = formatInTimezone(event.endUtc, displayTimezone, 'HH:mm');
  const colors = getEventColorTheme(event);

  return (
    <Tooltip
      title={`${event.title} - ${startLabel}-${endLabel} (${event.timezone})${
        event.seriesId ? ' - recurring' : ''
      }`}
      arrow
    >
      <Box
        onClick={() => onClick?.(event)}
        sx={(theme) => ({
          bgcolor:
            theme.palette.mode === 'dark' ? alpha(colors.base, 0.22) : colors.bg,
          color:
            getEventTextColor(colors.base, theme.palette.mode === 'dark'),
          border: '1px solid',
          borderColor:
            theme.palette.mode === 'dark' ? alpha(colors.base, 0.45) : colors.border,
          borderRadius: 1.5,
          px: 0.75,
          py: 0.25,
          cursor: 'pointer',
          overflow: 'hidden',
          userSelect: 'none',
          boxShadow: '0 1px 0 rgba(15, 23, 42, 0.03)',
          transition: 'background-color 120ms ease, border-color 120ms ease, transform 120ms ease',
          '&:hover': {
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(colors.base, 0.28)
                : lighten(colors.bg, 0.02),
            borderColor:
              theme.palette.mode === 'dark'
                ? alpha(colors.base, 0.6)
                : darken(colors.border, 0.06),
            transform: 'translateY(-1px)',
          },
          ...style,
        })}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            minWidth: 0,
          }}
        >
          {event.seriesId && <RepeatIcon sx={{ fontSize: '0.85rem', flexShrink: 0 }} />}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
              flex: 1,
              minWidth: 0,
            }}
          >
            {event.title}
          </Typography>
        </Box>
        {!compact && (
          <Typography
            variant="caption"
            sx={{ opacity: 0.78, display: 'block', lineHeight: 1.3, fontSize: '0.65rem' }}
          >
            {startLabel}-{endLabel}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}
