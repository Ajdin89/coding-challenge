import { useState, useEffect } from 'react';
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

const TIMEZONES = getTimezoneList();

export function EventModal() {
  const { modal, closeModal, displayTimezone } = useCalendarStore();
  const { open, mode, selectedEvent, prefillStart, prefillEnd } = modal;

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const [title, setTitle] = useState('');
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');
  const [timezone, setTimezone] = useState(displayTimezone);
  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setConflictError(null);
    if (mode === 'edit' && selectedEvent) {
      setTitle(selectedEvent.title);
      setTimezone(selectedEvent.timezone);
      setStartLocal(utcToLocalInput(selectedEvent.startUtc, selectedEvent.timezone));
      setEndLocal(utcToLocalInput(selectedEvent.endUtc, selectedEvent.timezone));
    } else {
      setTitle('');
      setTimezone(displayTimezone);
      setStartLocal(prefillStart ?? '');
      setEndLocal(prefillEnd ?? '');
    }
  }, [open, mode, selectedEvent, prefillStart, prefillEnd, displayTimezone]);

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleSave = async () => {
    setConflictError(null);
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
          message?: { message?: string; conflictingEvent?: { title: string } };
        };
        const conflicting = body?.message?.conflictingEvent?.title;
        setConflictError(
          conflicting
            ? `Conflicts with "${conflicting}"`
            : 'This time slot conflicts with an existing event.'
        );
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    await deleteMutation.mutateAsync(selectedEvent.id);
    closeModal();
  };

  return (
    <Dialog open={open} onClose={closeModal} fullWidth maxWidth="sm">
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
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            autoFocus
            required
            disabled={isPending}
          />

          <TextField
            label="Start"
            type="datetime-local"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            fullWidth
            required
            disabled={isPending}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="End"
            type="datetime-local"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            fullWidth
            required
            disabled={isPending}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Autocomplete
            options={TIMEZONES}
            value={timezone}
            onChange={(_, v) => v && setTimezone(v)}
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
    </Dialog>
  );
}
