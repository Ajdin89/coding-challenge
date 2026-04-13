import {
  Box,
  Stack,
  Typography,
  TextField,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RepeatIcon from '@mui/icons-material/Repeat';
import type { RecurrenceFrequency } from '../../../types/event';

export type RecurrenceState = {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: number[];
  until: string; // YYYY-MM-DD
};

// Display order: Mon-first like Microsoft calendar.
const WEEK_DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
  { value: 0, label: 'S' },
];

interface RecurrencePanelProps {
  recurrence: RecurrenceState | null;
  isPending: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<RecurrenceState>) => void;
  onToggleDayOfWeek: (day: number) => void;
  onRemove: () => void;
}

export function RecurrencePanel({
  recurrence,
  isPending,
  onToggle,
  onUpdate,
  onToggleDayOfWeek,
  onRemove,
}: RecurrencePanelProps) {
  return (
    <Box>
      <ToggleButton
        value="recurring"
        selected={!!recurrence}
        onChange={onToggle}
        disabled={isPending}
        size="small"
        sx={{
          textTransform: 'none',
          borderRadius: 2,
          px: 1.25,
          py: 0.45,
          gap: 0.75,
          fontSize: '0.9rem',
        }}
      >
        <RepeatIcon fontSize="small" />
        Recurring
      </ToggleButton>

      {recurrence && (
        <Stack spacing={1.5} sx={{ mt: 1.5, pl: 0.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Repeat every
            </Typography>
            <TextField
              type="number"
              size="small"
              value={recurrence.interval}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                onUpdate({ interval: Number.isFinite(n) && n > 0 ? Math.min(n, 365) : 1 });
              }}
              slotProps={{ htmlInput: { min: 1, max: 365 } }}
              sx={{ width: 72 }}
              disabled={isPending}
            />
            <Select
              size="small"
              value={recurrence.frequency}
              onChange={(e) => onUpdate({ frequency: e.target.value as RecurrenceFrequency })}
              disabled={isPending}
              sx={{ minWidth: 110 }}
            >
              <MenuItem value="daily">day</MenuItem>
              <MenuItem value="weekly">week</MenuItem>
              <MenuItem value="monthly">month</MenuItem>
              <MenuItem value="yearly">year</MenuItem>
            </Select>
          </Stack>

          {recurrence.frequency === 'weekly' && (
            <ToggleButtonGroup
              value={recurrence.daysOfWeek}
              onChange={(_, next) => {
                if (Array.isArray(next) && next.length > 0) {
                  onUpdate({ daysOfWeek: next });
                }
              }}
              size="small"
              disabled={isPending}
              sx={{
                gap: 1,
                '& .MuiToggleButton-root': {
                  borderRadius: '50%',
                  border: '1px solid',
                  borderColor: 'divider',
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  p: 0,
                },
                '& .MuiToggleButtonGroup-grouped': {
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '50% !important',
                  mx: 0,
                },
              }}
            >
              {WEEK_DAYS.map((d) => (
                <ToggleButton
                  key={d.value}
                  value={d.value}
                  onClick={() => onToggleDayOfWeek(d.value)}
                  aria-label={`Day ${d.value}`}
                >
                  {d.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Until
            </Typography>
            <TextField
              type="date"
              size="small"
              value={recurrence.until}
              onChange={(e) => onUpdate({ until: e.target.value })}
              disabled={isPending}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 170 }}
            />
            <IconButton
              size="small"
              onClick={onRemove}
              disabled={isPending}
              aria-label="Remove recurrence"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
