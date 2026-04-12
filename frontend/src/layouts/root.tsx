import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { AppBar, Toolbar, Typography, Container, Box, Switch } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useCalendarStore } from '../stores/calendarStore';

export function RootLayout() {
  const themeMode = useCalendarStore((s) => s.themeMode);
  const toggleTheme = useCalendarStore((s) => s.toggleTheme);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* GLOBAL NAVIGATION */}
      <AppBar position="static">
        <Toolbar>
          <CalendarMonthIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            Calendar Scheduling App
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DarkModeIcon fontSize="small" />
            <Switch
              checked={themeMode === 'dark'}
              onChange={toggleTheme}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: 'white' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'rgba(255,255,255,0.4)' },
              }}
            />
            <LightModeIcon fontSize="small" />
          </Box>
        </Toolbar>
      </AppBar>

      {/* PAGE CONTENT */}
      <Container maxWidth="xl" sx={{ flex: 1, overflow: 'hidden', py: 2, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Container>

      {/* DEVTOOLS (Only shows in dev mode) */}
      <TanStackRouterDevtools />
    </Box>
  );
}
