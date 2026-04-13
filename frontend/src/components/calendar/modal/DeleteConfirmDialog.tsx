import { Stack, Typography, Chip } from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import { ConfirmDialog } from '../../ui/ConfirmDialog';

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
    <ConfirmDialog
      open={open}
      title="Delete recurring event"
      loading={isPending}
      onClose={onClose}
      actions={[
        { label: 'This occurrence', onClick: onDeleteSingle, color: 'error' },
        { label: 'Entire series', onClick: onDeleteSeries, color: 'error', variant: 'contained' },
      ]}
    >
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
    </ConfirmDialog>
  );
}
