import { grey, green, indigo } from '@mui/material/colors';

const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);

export default (server, systemTheme, mode) => {
  const darkMode = mode === 'dark';
  const classic = systemTheme.id === 'classic';
  const colors = systemTheme.colors;

  if (classic) {
    return {
      mode,
      background: {
        default: darkMode ? grey[900] : grey[50],
      },
      primary: {
        main:
          validatedColor(server?.attributes?.colorPrimary) ||
          (darkMode ? indigo[200] : indigo[900]),
      },
      secondary: {
        main:
          validatedColor(server?.attributes?.colorSecondary) ||
          (darkMode ? green[200] : green[800]),
      },
      neutral: { main: grey[500] },
      geometry: { main: '#3bb2d0' },
      surface: { main: darkMode ? grey[800] : grey[100] },
      sidebar: {
        main: darkMode ? grey[900] : '#ffffff',
        contrastText: darkMode ? '#f8fafc' : '#172033',
      },
      alwaysDark: { main: grey[900] },
    };
  }

  const divider =
    colors.divider || (darkMode ? 'rgba(148, 163, 184, 0.20)' : 'rgba(15, 23, 42, 0.12)');
  const sidebarText = colors.sidebarText || (darkMode ? '#f8fafc' : '#172033');

  return {
    mode,
    background: {
      default: colors.background || (darkMode ? grey[900] : grey[50]),
      paper: colors.paper || (darkMode ? grey[900] : '#ffffff'),
    },
    primary: {
      main: colors.primary || (darkMode ? indigo[200] : indigo[900]),
    },
    secondary: {
      main: colors.secondary || (darkMode ? green[200] : green[800]),
    },
    text: {
      primary: colors.text || (darkMode ? '#f8fafc' : '#172033'),
      secondary: colors.textSecondary || (darkMode ? grey[400] : grey[700]),
    },
    divider,
    neutral: {
      main: grey[500],
    },
    geometry: {
      main: colors.geometry || '#3bb2d0',
    },
    surface: {
      main: colors.surface || (darkMode ? grey[800] : grey[100]),
    },
    sidebar: {
      main: colors.sidebar || (darkMode ? grey[900] : '#ffffff'),
      contrastText: sidebarText,
    },
    alwaysDark: {
      main: grey[900],
    },
  };
};
