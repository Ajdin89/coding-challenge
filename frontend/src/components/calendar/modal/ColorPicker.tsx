import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  EVENT_COLOR_PALETTE,
  getEventColorTheme,
  getEventTextColor,
} from '../../../utils/eventColors';

interface ColorPickerProps {
  color: string;
  isPending: boolean;
  /** Used to compute the auto-color preview (event id or title). */
  previewId: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, isPending, previewId, onChange }: ColorPickerProps) {
  const previewTheme = getEventColorTheme({ id: previewId, color: color || null });

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontSize: '0.85rem' }}>
        Color
      </Typography>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, flexWrap: 'wrap' }}>
          <ToggleButton
            value=""
            selected={!color}
            onChange={() => onChange('')}
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
              if (next !== null) onChange(next);
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
  );
}
