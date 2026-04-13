import { Paper, type PaperProps } from '@mui/material';

/**
 * Shared wrapper for calendar views (Day, Week, Month).
 * Provides a full-height outlined card with hidden overflow so inner
 * scroll containers don't bleed outside the panel boundary.
 */
export function ViewContainer({ children, ...props }: PaperProps) {
  return (
    <Paper
      variant="outlined"
      {...props}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        ...props.sx,
      }}
    >
      {children}
    </Paper>
  );
}
