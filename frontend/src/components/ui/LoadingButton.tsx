import { Button, CircularProgress, type ButtonProps } from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export function LoadingButton({ loading = false, disabled, children, ...props }: LoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled ?? loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : props.startIcon}
    >
      {children}
    </Button>
  );
}
