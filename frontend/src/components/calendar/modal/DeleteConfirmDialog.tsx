import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';

interface DeleteConfirmDialogProps {
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onDeleteSingle: () => void;
  onDeleteSeries: () => void;
}

export function DeleteConfirmDialog({
  open,
  isPending,
  onClose,
  onDeleteSingle,
  onDeleteSeries,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
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
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={onDeleteSingle} disabled={isPending} color="error">
          This occurrence
        </Button>
        <Button onClick={onDeleteSeries} disabled={isPending} color="error" variant="contained">
          Entire series
        </Button>
      </DialogActions>
    </Dialog>
  );
}
