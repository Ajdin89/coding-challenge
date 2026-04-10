import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export function RootLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* GLOBAL NAVIGATION */}
      <AppBar position="static">
        <Toolbar>
          <CalendarMonthIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            Calendar
          </Typography>

          <Box sx={{ flexGrow: 1 }} />
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
