import { useState } from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { isAxiosError } from 'axios';
import { useCalendarStore } from '../../stores/calendarStore';
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../hooks/useEvents';
import { localToUtc, utcToLocalInput, getTimezoneList } from '../../utils/timezone';
import type { CalendarEvent } from '../../types/event';

const TIMEZONES = getTimezoneList();

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

  // Initialised once on mount from props — no effect needed.
  // The parent passes a changing `key` to remount this component when the
  // modal opens with different data, resetting state automatically.
  const [form, setForm] = useState(() => {
    if (mode === 'edit' && selectedEvent) {
      return {
        title: selectedEvent.title,
        timezone: selectedEvent.timezone,
        startLocal: utcToLocalInput(selectedEvent.startUtc, selectedEvent.timezone),
        endLocal: utcToLocalInput(selectedEvent.endUtc, selectedEvent.timezone),
        conflictError: null as string | null,
      };
    }
    return {
      title: '',
      timezone: displayTimezone,
      startLocal: prefillStart ?? '',
      endLocal: prefillEnd ?? '',
      conflictError: null as string | null,
    };
  });

  const { title, startLocal, endLocal, timezone, conflictError } = form;

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleSave = async () => {
    setForm((f) => ({ ...f, conflictError: null }));
    if (!title.trim() || !startLocal || !endLocal) return;

    const startUtc = localToUtc(startLocal, timezone);
    const endUtc = localToUtc(endLocal, timezone);

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({ title: title.trim(), startUtc, endUtc, timezone });
      } else if (selectedEvent) {
        await updateMutation.mutateAsync({
          id: selectedEvent.id,
          payload: { title: title.trim(), startUtc, endUtc, timezone },
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

  const handleDelete = async () => {
    if (!selectedEvent) return;
    await deleteMutation.mutateAsync(selectedEvent.id);
    closeModal();
  };

  return (
    <>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{mode === 'create' ? 'New Event' : 'Edit Event'}</Typography>
        {mode === 'edit' && (
          <IconButton color="error" onClick={handleDelete} disabled={isPending} size="small">
            <DeleteIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {conflictError && <Alert severity="error">{conflictError}</Alert>}

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth
            autoFocus
            required
            disabled={isPending}
          />

          <TextField
            label="Start"
            type="datetime-local"
            value={startLocal}
            onChange={(e) => setForm((f) => ({ ...f, startLocal: e.target.value }))}
            fullWidth
            required
            disabled={isPending}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="End"
            type="datetime-local"
            value={endLocal}
            onChange={(e) => setForm((f) => ({ ...f, endLocal: e.target.value }))}
            fullWidth
            required
            disabled={isPending}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Autocomplete
            options={TIMEZONES}
            value={timezone}
            onChange={(_, v) => v && setForm((f) => ({ ...f, timezone: v }))}
            disabled={isPending}
            renderInput={(params) => <TextField {...params} label="Timezone" required />}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={closeModal} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isPending || !title.trim() || !startLocal || !endLocal}
          startIcon={isPending ? <CircularProgress size={16} /> : null}
        >
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
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
