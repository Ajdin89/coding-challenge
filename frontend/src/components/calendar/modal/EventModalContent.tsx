import {
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
  MenuItem,
} from '@mui/material';
import { LoadingButton } from '../../ui/LoadingButton';
import DeleteIcon from '@mui/icons-material/Delete';
import RepeatIcon from '@mui/icons-material/Repeat';
import { TIMEZONES, getTimezoneLabel } from '../../../utils/timezoneOptions';
import { TIME_SELECT_MENU_PROPS } from '../../../utils/timeOptions';
import type { CalendarEvent } from '../../../types/event';
import { ColorPicker } from './ColorPicker';
import { RecurrencePanel } from './RecurrencePanel';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useEventForm } from './useEventForm';

export type ContentProps = {
  mode: 'create' | 'edit';
  selectedEvent: CalendarEvent | null | undefined;
  prefillStart: string | undefined;
  prefillEnd: string | undefined;
  displayTimezone: string;
  closeModal: () => void;
};

export function EventModalContent(props: ContentProps) {
  const { mode, closeModal } = props;
  const {
    title, startDate, startTime, endDate, endTime, timezone, color, conflictError,
    recurrence, confirmDelete,
    isPending, isEditingSeriesInstance, previewId,
    startTimeOptions, endTimeOptions,
    setTitle, setColor, setTimezone,
    setStartDate, setStartTime, setEndDate, setEndTime,
    setConfirmDelete,
    handleSave, handleDelete, onDeleteClick,
    toggleRecurring, updateRecurrence, toggleDayOfWeek,
  } = useEventForm(props);

  const isSaveDisabled =
    isPending || !title.trim() || !startDate || !startTime || !endDate || !endTime;

  return (
    <>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700 }}>
          {mode === 'create' ? 'New Event' : 'Edit Event'}
        </Typography>
        {mode === 'edit' && (
          <IconButton color="error" onClick={onDeleteClick} disabled={isPending}>
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
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            autoFocus
            required
            disabled={isPending}
          />

          <ColorPicker
            color={color}
            isPending={isPending}
            previewId={previewId}
            onChange={setColor}
          />

          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              required
              disabled={isPending}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Start time"
              select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              fullWidth
              required
              disabled={isPending}
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
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                required
                disabled={isPending}
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
              onChange={(e) => setEndTime(e.target.value)}
              fullWidth
              required
              disabled={isPending}
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
            onChange={(_, v) => v && setTimezone(v)}
            disabled={isPending}
            getOptionLabel={getTimezoneLabel}
            size="small"
            renderInput={(params) => (
              <TextField {...params} label="Timezone" required />
            )}
          />

          {mode === 'create' && (
            <RecurrencePanel
              recurrence={recurrence}
              isPending={isPending}
              onToggle={toggleRecurring}
              onUpdate={updateRecurrence}
              onToggleDayOfWeek={toggleDayOfWeek}
              onRemove={() => toggleRecurring()}
            />
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={closeModal} disabled={isPending}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          disabled={isSaveDisabled}
          loading={isPending}
        >
          {mode === 'create' ? 'Create' : 'Save'}
        </LoadingButton>
      </DialogActions>

      <DeleteConfirmDialog
        open={confirmDelete}
        isPending={isPending}
        onClose={() => setConfirmDelete(false)}
        onDeleteSingle={() => void handleDelete('single')}
        onDeleteSeries={() => void handleDelete('series')}
      />
    </>
  );
}
