import {
  Box,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';
import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useCalendarStore, type CalendarView } from '../../stores/calendarStore';
import { getTimezoneList, getTimezoneCountryCode } from '../../utils/timezone';

const TIMEZONES = getTimezoneList();

const codeBoxSx = {
  fontSize: '0.65rem',
  fontWeight: 700,
  color: 'text.disabled',
  flexShrink: 0,
  letterSpacing: '0.05em',
  ml: 1.2,
} as const;

function formatTitle(view: CalendarView, date: Date): string {
  if (view === 'month') return format(date, 'MMMM yyyy');
  if (view === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    if (format(start, 'MMM') === format(end, 'MMM')) {
      return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
    }
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }
  return format(date, 'EEEE, MMMM d, yyyy');
}

export function CalendarToolbar() {
  const {
    view,
    currentDate,
    displayTimezone,
    setView,
    goToToday,
    goNext,
    goPrev,
    setDisplayTimezone,
    openCreateModal,
  } = useCalendarStore();

  const startAdornment = useMemo(() => {
    const code = getTimezoneCountryCode(displayTimezone);
    return code ? (
      <Box component="span" sx={codeBoxSx}>
        {code}
      </Box>
    ) : undefined;
  }, [displayTimezone]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
        mb: 2,
        overflow: 'visible',
        pt: 1,
      }}
    >
      {/* New Event */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => openCreateModal()}
        size="small"
        sx={{ flexShrink: 0 }}
      >
        New Event
      </Button>

      {/* Today */}
      <Button variant="outlined" onClick={goToToday} size="small" sx={{ flexShrink: 0 }}>
        Today
      </Button>

      {/* Prev / Next */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="Previous">
          <IconButton onClick={goPrev} size="small">
            <NavigateBeforeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Next">
          <IconButton onClick={goNext} size="small">
            <NavigateNextIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Period title */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ flexGrow: 1 }}>
        {formatTitle(view, currentDate)}
      </Typography>

      {/* Timezone selector */}
      <Autocomplete
        options={TIMEZONES}
        value={displayTimezone}
        onChange={(_, v) => v && setDisplayTimezone(v)}
        size="small"
        sx={{ width: 240 }}
        disableClearable
        renderOption={(props, option) => {
          const code = getTimezoneCountryCode(option);
          return (
            <li {...props} style={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ ...codeBoxSx, ml: 0, mr: 2, width: '1.1rem', textAlign: 'center', flexShrink: 0 }}>
                {code}
              </Box>
              {option}
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Timezone"
            InputProps={{ ...params.InputProps, startAdornment }}
          />
        )}
      />

      {/* View toggle */}
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(_, v) => v && setView(v as CalendarView)}
        size="small"
      >
        <ToggleButton value="day">Day</ToggleButton>
        <ToggleButton value="week">Week</ToggleButton>
        <ToggleButton value="month">Month</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
