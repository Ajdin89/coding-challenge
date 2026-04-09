import { Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export function RootLayout() {
  return (
    <>
      {/* GLOBAL NAVIGATION */}
      <AppBar position="static">
        <Toolbar>
          <CalendarMonthIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            Calendar
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              component={Link}
              to="/calendar"
              activeProps={{ style: { fontWeight: 'bold', textDecoration: 'underline' } }}
            >
              Calendar
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* PAGE CONTENT */}
      <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
        <Outlet />
      </Container>

      {/* DEVTOOLS (Only shows in dev mode) */}
      <TanStackRouterDevtools />
    </>
  );
}
