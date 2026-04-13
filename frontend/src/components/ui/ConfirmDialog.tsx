import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  type DialogProps,
} from '@mui/material';
import { LoadingButton } from './LoadingButton';

interface Action {
  label: string;
  onClick: () => void;
  color?: 'error' | 'primary' | 'secondary' | 'warning' | 'info' | 'success';
  variant?: 'text' | 'outlined' | 'contained';
}

interface ConfirmDialogProps extends Pick<DialogProps, 'maxWidth'> {
  open: boolean;
  title: string;
  loading?: boolean;
  onClose: () => void;
  actions: Action[];
  children: React.ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  loading = false,
  onClose,
  actions,
  children,
  maxWidth = 'xs',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {actions.map((action) => (
          <LoadingButton
            key={action.label}
            onClick={action.onClick}
            color={action.color}
            variant={action.variant}
            loading={loading}
          >
            {action.label}
          </LoadingButton>
        ))}
      </DialogActions>
    </Dialog>
  );
}
