import { useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import palette from './palette';
import { getThemeDimensions } from './dimensions';
import components from './components';
import { getSystemTheme } from './systemThemes';

export default (server, systemThemeId, darkMode, direction) =>
  useMemo(() => {
    const systemTheme = getSystemTheme(systemThemeId);
    const mode = systemTheme.mode === 'system' ? (darkMode ? 'dark' : 'light') : systemTheme.mode;
    return createTheme({
      typography:
        systemTheme.id === 'classic'
          ? { fontFamily: 'Roboto,Segoe UI,Helvetica Neue,Arial,sans-serif' }
          : {
              fontFamily: 'Inter,Roboto,Segoe UI,Helvetica Neue,Arial,sans-serif',
              button: {
                fontWeight: 700,
                letterSpacing: '0.01em',
              },
            },
      palette: palette(server, systemTheme, mode),
      direction,
      dimensions: getThemeDimensions(systemTheme),
      components: components(systemTheme),
      shape: {
        borderRadius: systemTheme.shape.borderRadius,
      },
      systemTheme: {
        ...systemTheme,
        resolvedMode: mode,
      },
    });
  }, [server, systemThemeId, darkMode, direction]);
