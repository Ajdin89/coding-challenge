import { Typography, type TypographyProps } from '@mui/material';

interface DayBadgeProps {
  day: number | string;
  isToday?: boolean;
  /** Renders the number in a muted colour — used for days outside the current month */
  dimmed?: boolean;
  size?: number;
  variant?: TypographyProps['variant'];
}

/**
 * Circular day-number badge used in calendar day/week/month headers.
 * Highlights with primary colour when `isToday` is true.
 */
export function DayBadge({ day, isToday = false, dimmed = false, size = 28, variant = 'subtitle2' }: DayBadgeProps) {
  return (
    <Typography
      variant={variant}
      sx={{
        fontWeight: isToday ? 700 : 400,
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: dimmed ? 'text.disabled' : 'text.primary',
        ...(isToday && { bgcolor: 'primary.main', color: 'primary.contrastText' }),
      }}
    >
      {day}
    </Typography>
  );
}
