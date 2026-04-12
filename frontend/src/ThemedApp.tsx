import { RouterProvider, createRouter } from '@tanstack/react-router';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { routeTree } from './routeTree.gen';
import { useCalendarStore } from './stores/calendarStore';

const router = createRouter({ routeTree });

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function ThemedApp() {
  const themeMode = useCalendarStore((s) => s.themeMode);

  const theme = createTheme({
    palette: {
      mode: themeMode,
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
