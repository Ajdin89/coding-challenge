import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  Alert,
  Stack,
  IconButton,
  Typography,
  CircularProgress,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  Box,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RepeatIcon from '@mui/icons-material/Repeat';
import { isAxiosError } from 'axios';
import { useCalendarStore } from '../../stores/calendarStore';
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../hooks/useEvents';
import {
  EVENT_COLOR_PALETTE,
  getEventColorTheme,
  getEventTextColor,
} from '../../utils/eventColors';
import {
  localToUtc,
  utcToLocalInput,
  getTimezoneList,
  formatInTimezone,
} from '../../utils/timezone';
import type { CalendarEvent, RecurrenceFrequency, RecurrencePayload } from '../../types/event';

/** Parse an ISO offset like "+01:00" or "-05:30" into a signed minute count. */
function offsetToMinutes(offset: string): number {
  const sign = offset.startsWith('-') ? -1 : 1;
  const [h, m] = offset.slice(1).split(':').map(Number);
  return sign * (h * 60 + (m ?? 0));
}

/** Precomputed labels for each IANA timezone, e.g. "(UTC+01:00) Sarajevo". */
const TZ_LABELS = new Map<string, string>();

/**
 * Timezones sorted by current UTC offset (then city name), so the dropdown
 * groups zones by offset the way Outlook does.
 */
/** "Europe/Warsaw" → "Europe/Warsaw"; "America/Argentina/Buenos_Aires" → "America/Buenos Aires". */
function prettifyTzName(tz: string): string {
  const parts = tz.split('/');
  const region = parts[0];
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  return parts.length === 1 ? tz : `${region}/${city}`;
}

const TIMEZONES: readonly string[] = (() => {
  const now = new Date().toISOString();
  const withMeta = getTimezoneList().map((tz) => {
    const offset = formatInTimezone(now, tz, 'xxx');
    const name = prettifyTzName(tz);
    TZ_LABELS.set(tz, `(UTC${offset}) ${name}`);
    return { tz, offsetMin: offsetToMinutes(offset), name };
  });
  withMeta.sort((a, b) =>
    a.offsetMin !== b.offsetMin ? a.offsetMin - b.offsetMin : a.name.localeCompare(b.name)
  );
  return withMeta.map((x) => x.tz);
})();

function getTimezoneLabel(tz: string): string {
  const cached = TZ_LABELS.get(tz);
  if (cached) return cached;
  // Fall back for timezones not in the curated list (e.g. a saved event on
  // an older/unknown zone) — compute once and cache.
  const offset = formatInTimezone(new Date().toISOString(), tz, 'xxx');
  const label = `(UTC${offset}) ${prettifyTzName(tz)}`;
  TZ_LABELS.set(tz, label);
  return label;
}

/** Compact dropdown: caps the menu at ~8 rows and uses dense list items. */
const TIME_SELECT_MENU_PROPS = {
  MenuProps: {
    PaperProps: { sx: { maxHeight: 240 } },
    MenuListProps: { dense: true },
  },
} as const;

/** 30-minute time-of-day options, "HH:mm" → "h:mm AM/PM". */
const HALF_HOUR_TIMES: readonly { value: string; label: string }[] = Array.from(
  { length: 48 },
  (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    const value = `${String(h).padStart(2, '0')}:${m}`;
    return { value, label: formatTimeLabel(value) };
  }
);

function formatTimeLabel(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Split a "YYYY-MM-DDTHH:mm" string into separate date + time parts. */
function splitLocal(local: string): { date: string; time: string } {
  if (!local) return { date: '', time: '' };
  const [date, time] = local.split('T');
  return { date: date ?? '', time: (time ?? '').slice(0, 5) };
}

/** Format the duration between two local date/time pairs as e.g. "1.5 hours". */
function formatDurationLabel(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): string {
  if (!startDate || !startTime || !endDate || !endTime) return '';
  const startMs = new Date(`${startDate}T${startTime}`).getTime();
  const endMs = new Date(`${endDate}T${endTime}`).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return '';
  const diffMin = (endMs - startMs) / 60000;
  if (diffMin <= 0) return '';
  const hours = Math.round((diffMin / 60) * 2) / 2;
  if (hours >= 24) {
    const days = Math.round((hours / 24) * 10) / 10;
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

type RecurrenceState = {
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

function getDayOfWeekFromLocal(localStr: string): number {
  if (!localStr) return new Date().getDay();
  const d = new Date(localStr);
  return Number.isNaN(d.getTime()) ? new Date().getDay() : d.getDay();
}

function defaultUntilFromLocal(localStr: string): string {
  const base = localStr ? new Date(localStr) : new Date();
  const target = Number.isNaN(base.getTime()) ? new Date() : new Date(base);
  target.setMonth(target.getMonth() + 3);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type ContentProps = {
  mode: 'create' | 'edit';
  selectedEvent: CalendarEvent | null | undefined;
  prefillStart: string | undefined;
  prefillEnd: string | undefined;
  displayTimezone: string;
  closeModal: () => void;
};

function EventModalContent({
  mode,
  selectedEvent,
  prefillStart,
  prefillEnd,
  displayTimezone,
  closeModal,
}: ContentProps) {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const [form, setForm] = useState(() => {
    if (mode === 'edit' && selectedEvent) {
      const s = splitLocal(utcToLocalInput(selectedEvent.startUtc, selectedEvent.timezone));
      const e = splitLocal(utcToLocalInput(selectedEvent.endUtc, selectedEvent.timezone));
      return {
        title: selectedEvent.title,
        timezone: selectedEvent.timezone,
        color: selectedEvent.color ?? '',
        startDate: s.date,
        startTime: s.time,
        endDate: e.date,
        endTime: e.time,
        conflictError: null as string | null,
      };
    }
    const s = splitLocal(prefillStart ?? '');
    const e = splitLocal(prefillEnd ?? '');
    return {
      title: '',
      timezone: displayTimezone,
      color: '',
      startDate: s.date,
      startTime: s.time,
      endDate: e.date,
      endTime: e.time,
      conflictError: null as string | null,
    };
  });

  const [recurrence, setRecurrence] = useState<RecurrenceState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { title, startDate, startTime, endDate, endTime, timezone, color, conflictError } = form;
  const isSeries = Boolean(selectedEvent?.seriesId);
  const isEditingSeriesInstance = mode === 'edit' && isSeries;
  const previewTheme = getEventColorTheme({
    id: (selectedEvent?.id ?? title.trim()) || 'preview',
    color: color || null,
  });

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // Normalise the form so end is never earlier than start. Used as a safety net
  // on every change — the date `min` attr and the filtered end-time dropdown
  // already prevent most bad picks, but this handles typed/cleared values and
  // start-side edits that overshoot the existing end.
  const clampEnd = (f: typeof form): typeof form => {
    let { endDate, endTime } = f;
    if (f.startDate && endDate && endDate < f.startDate) {
      endDate = f.startDate;
    }
    if (f.startDate && f.startTime && endDate === f.startDate && endTime && endTime < f.startTime) {
      endTime = f.startTime;
    }
    return { ...f, endDate, endTime };
  };

  // Ensure the currently-selected time is in the options list, even if it's not
  // on the 30-minute grid (e.g. an existing event saved at 14:15).
  const startTimeOptions = useMemo(() => {
    const opts = HALF_HOUR_TIMES.map((o) => ({ ...o }));
    if (startTime && !opts.some((o) => o.value === startTime)) {
      opts.push({ value: startTime, label: formatTimeLabel(startTime) });
      opts.sort((a, b) => a.value.localeCompare(b.value));
    }
    return opts;
  }, [startTime]);

  // End time options include a duration hint relative to the current start.
  // When start and end fall on the same day, earlier times are filtered out.
  const endTimeOptions = useMemo(() => {
    const sameDay = !!startDate && startDate === endDate;
    const opts = HALF_HOUR_TIMES.filter((o) => !sameDay || !startTime || o.value >= startTime).map(
      (o) => {
        const duration = formatDurationLabel(startDate, startTime, endDate, o.value);
        return {
          value: o.value,
          label: duration ? `${o.label} (${duration})` : o.label,
        };
      }
    );
    if (endTime && !opts.some((o) => o.value === endTime)) {
      const duration = formatDurationLabel(startDate, startTime, endDate, endTime);
      const base = formatTimeLabel(endTime);
      opts.push({ value: endTime, label: duration ? `${base} (${duration})` : base });
      opts.sort((a, b) => a.value.localeCompare(b.value));
    }
    return opts;
  }, [startDate, startTime, endDate, endTime]);

  const toggleRecurring = () => {
    if (recurrence) {
      setRecurrence(null);
      return;
    }
    // A recurring event's single occurrence is always same-day — users
    // control the series extent with "Until", not with the end date.
    // If the form had been set up as a multi-day event first, collapse it.
    setForm((f) => clampEnd({ ...f, endDate: f.startDate }));
    const startLocal = startDate && startTime ? `${startDate}T${startTime}` : '';
    setRecurrence({
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [getDayOfWeekFromLocal(startLocal)],
      until: defaultUntilFromLocal(startLocal),
    });
  };

  const updateRecurrence = (patch: Partial<RecurrenceState>) =>
    setRecurrence((r) => (r ? { ...r, ...patch } : r));

  const toggleDayOfWeek = (day: number) => {
    setRecurrence((r) => {
      if (!r) return r;
      const next = r.daysOfWeek.includes(day)
        ? r.daysOfWeek.filter((d) => d !== day)
        : [...r.daysOfWeek, day];
      // Always keep at least one day selected.
      return { ...r, daysOfWeek: next.length === 0 ? r.daysOfWeek : next };
    });
  };

  const buildRecurrencePayload = (): RecurrencePayload | undefined => {
    if (!recurrence) return undefined;
    return {
      frequency: recurrence.frequency,
      interval: recurrence.interval,
      daysOfWeek: recurrence.frequency === 'weekly' ? recurrence.daysOfWeek : undefined,
      until: recurrence.until,
    };
  };

  const handleSave = async () => {
    setForm((f) => ({ ...f, conflictError: null }));
    if (!title.trim() || !startDate || !startTime || !endDate || !endTime) return;

    const startUtc = localToUtc(`${startDate}T${startTime}`, timezone);
    const endUtc = localToUtc(`${endDate}T${endTime}`, timezone);

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          title: title.trim(),
          startUtc,
          endUtc,
          timezone,
          color: color || undefined,
          recurrence: buildRecurrencePayload(),
        });
      } else if (selectedEvent) {
        await updateMutation.mutateAsync({
          id: selectedEvent.id,
          payload: { title: title.trim(), startUtc, endUtc, timezone, color: color || null },
        });
      }
      closeModal();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        const body = err.response.data as {
          message?: string;
          conflictingEvent?: { title: string };
        };
        const conflicting = body?.conflictingEvent?.title;
        setForm((f) => ({
          ...f,
          conflictError: conflicting
            ? `Conflicts with "${conflicting}"`
            : 'This time slot conflicts with an existing event.',
        }));
      }
    }
  };

  const handleDelete = async (scope: 'single' | 'series') => {
    if (!selectedEvent) return;
    await deleteMutation.mutateAsync({ id: selectedEvent.id, scope });
    closeModal();
  };

  const onDeleteClick = () => {
    if (isSeries) {
      setConfirmDelete(true);
      return;
    }
    void handleDelete('single');
  };

  return (
    <>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700 }}>
          {mode === 'create' ? 'New Event' : 'Edit Event'}
        </Typography>
        {mode === 'edit' && (
          <IconButton color="error" onClick={onDeleteClick} disabled={isPending} size="small">
            <DeleteIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={1.75} sx={{ mt: 0.5 }}>
          {conflictError && <Alert severity="error">{conflictError}</Alert>}

          {isEditingSeriesInstance && (
            <Alert severity="info" icon={<RepeatIcon fontSize="inherit" />}>
              This event is part of a recurring series. Edits apply to this occurrence only.
            </Alert>
          )}

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth
            autoFocus
            required
            disabled={isPending}
            size="small"
          />

          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.75, fontSize: '0.85rem' }}
            >
              Color
            </Typography>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, flexWrap: 'wrap' }}>
                <ToggleButton
                  value=""
                  selected={!color}
                  onChange={() => setForm((f) => ({ ...f, color: '' }))}
                  disabled={isPending}
                  size="small"
                  sx={{
                    px: 0.9,
                    py: 0.2,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    minHeight: 30,
                    borderRadius: '999px',
                  }}
                >
                  Auto
                </ToggleButton>

                <ToggleButtonGroup
                  exclusive
                  value={color}
                  onChange={(_, next) => {
                    if (next !== null) {
                      setForm((f) => ({ ...f, color: next }));
                    }
                  }}
                  disabled={isPending}
                  size="small"
                  sx={{
                    flexWrap: 'wrap',
                    gap: 0.4,
                    '& .MuiToggleButtonGroup-grouped': {
                      borderRadius: '999px !important',
                      border: '1px solid',
                      borderColor: 'divider',
                      mx: 0,
                    },
                  }}
                >
                  {EVENT_COLOR_PALETTE.map((theme) => (
                    <ToggleButton
                      key={theme.base}
                      value={theme.base}
                      aria-label={`Select color ${theme.base}`}
                      sx={{ p: 0.25, minWidth: 22, minHeight: 22 }}
                    >
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          bgcolor: theme.base,
                          border: '1px solid rgba(15, 23, 42, 0.12)',
                        }}
                      />
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {!color && (
                <Box
                  sx={(theme) => ({
                    mt: 0.35,
                    px: 0.75,
                    py: 0.35,
                    borderRadius: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.45,
                    bgcolor:
                      theme.palette.mode === 'dark' ? `rgba(255,255,255,0.04)` : previewTheme.bg,
                    border: '1px solid',
                    borderColor:
                      theme.palette.mode === 'dark'
                        ? `rgba(255,255,255,0.08)`
                        : previewTheme.border,
                    color: getEventTextColor(previewTheme.base, theme.palette.mode === 'dark'),
                  })}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: previewTheme.base,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, fontSize: '0.68rem', lineHeight: 1.15 }}
                  >
                    Auto color will be assigned
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) =>
                setForm((f) => {
                  const startDate = e.target.value;
                  // While recurring, every occurrence is same-day — keep
                  // end in sync with start so the duration stays as the
                  // time-of-day delta.
                  const endDate = recurrence ? startDate : f.endDate;
                  return clampEnd({ ...f, startDate, endDate });
                })
              }
              fullWidth
              required
              disabled={isPending}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Start time"
              select
              value={startTime}
              onChange={(e) => setForm((f) => clampEnd({ ...f, startTime: e.target.value }))}
              fullWidth
              required
              disabled={isPending}
              size="small"
              slotProps={{ select: TIME_SELECT_MENU_PROPS }}
            >
              {startTimeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            {!recurrence && (
              <TextField
                label="End date"
                type="date"
                value={endDate}
                onChange={(e) => setForm((f) => clampEnd({ ...f, endDate: e.target.value }))}
                fullWidth
                required
                disabled={isPending}
                size="small"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: startDate || undefined },
                }}
              />
            )}
            <TextField
              label="End time"
              select
              value={endTime}
              onChange={(e) => setForm((f) => clampEnd({ ...f, endTime: e.target.value }))}
              fullWidth
              required
              disabled={isPending}
              size="small"
              slotProps={{ select: TIME_SELECT_MENU_PROPS }}
              sx={recurrence ? { maxWidth: '50%' } : undefined}
            >
              {endTimeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Autocomplete
            options={TIMEZONES}
            value={timezone}
            onChange={(_, v) => v && setForm((f) => ({ ...f, timezone: v }))}
            disabled={isPending}
            getOptionLabel={getTimezoneLabel}
            size="small"
            renderInput={(params) => (
              <TextField {...params} label="Timezone" required size="small" />
            )}
          />

          {mode === 'create' && (
            <Box>
              <ToggleButton
                value="recurring"
                selected={!!recurrence}
                onChange={toggleRecurring}
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
                        updateRecurrence({
                          interval: Number.isFinite(n) && n > 0 ? Math.min(n, 365) : 1,
                        });
                      }}
                      slotProps={{ htmlInput: { min: 1, max: 365 } }}
                      sx={{ width: 72 }}
                      disabled={isPending}
                    />
                    <Select
                      size="small"
                      value={recurrence.frequency}
                      onChange={(e) =>
                        updateRecurrence({
                          frequency: e.target.value as RecurrenceFrequency,
                        })
                      }
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
                          updateRecurrence({ daysOfWeek: next });
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
                          onClick={() => toggleDayOfWeek(d.value)}
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
                      onChange={(e) => updateRecurrence({ until: e.target.value })}
                      disabled={isPending}
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ width: 170 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setRecurrence(null)}
                      disabled={isPending}
                      aria-label="Remove recurrence"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={closeModal} disabled={isPending} size="small">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isPending || !title.trim() || !startDate || !startTime || !endDate || !endTime}
          startIcon={isPending ? <CircularProgress size={16} /> : null}
          size="small"
        >
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete recurring event</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              This event is part of a series. What would you like to delete?
            </Typography>
            <Chip
              icon={<RepeatIcon />}
              label="Series"
              variant="outlined"
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => handleDelete('single')} disabled={isPending} color="error">
            This occurrence
          </Button>
          <Button
            onClick={() => handleDelete('series')}
            disabled={isPending}
            color="error"
            variant="contained"
          >
            Entire series
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function EventModal() {
  const { modal, closeModal, displayTimezone } = useCalendarStore();
  const { open, mode, selectedEvent, prefillStart, prefillEnd } = modal;

  // Changing `key` when the modal opens with new data causes EventModalContent
  // to remount with fresh initialised state — no effect or setState-in-effect needed.
  const contentKey = open
    ? `${mode}-${selectedEvent?.id ?? 'new'}-${prefillStart ?? ''}`
    : 'closed';

  return (
    <Dialog open={open} onClose={closeModal} fullWidth maxWidth="sm">
      {open && (
        <EventModalContent
          key={contentKey}
          mode={mode}
          selectedEvent={selectedEvent}
          prefillStart={prefillStart}
          prefillEnd={prefillEnd}
          displayTimezone={displayTimezone}
          closeModal={closeModal}
        />
      )}
    </Dialog>
  );
}
