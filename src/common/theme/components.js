const translucent = (color, alpha) => {
  if (!color?.startsWith('#') || color.length !== 7) {
    return color;
  }
  const value = Number.parseInt(color.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const classicComponents = {
  MuiUseMediaQuery: {
    defaultProps: { noSsr: true },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({ backgroundColor: theme.palette.background.default }),
    },
  },
  MuiButton: {
    styleOverrides: {
      sizeMedium: { height: '40px' },
    },
  },
  MuiFormControl: {
    defaultProps: { size: 'small' },
  },
  MuiSnackbar: {
    defaultProps: { anchorOrigin: { vertical: 'bottom', horizontal: 'center' } },
  },
  MuiTooltip: {
    defaultProps: { enterDelay: 500, enterNextDelay: 500 },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        '@media print': { color: theme.palette.alwaysDark.main },
      }),
    },
  },
};

export default (systemTheme) => {
  if (systemTheme.id === 'classic') {
    return classicComponents;
  }

  return {
    MuiUseMediaQuery: {
      defaultProps: {
        noSsr: true,
      },
    },
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        html: {
          colorScheme: theme.palette.mode,
        },
        body: {
          background: systemTheme.effects.pageGradient,
          backgroundColor: theme.palette.background.default,
          transition: 'background-color 180ms ease, color 180ms ease',
        },
        '::selection': {
          backgroundColor: translucent(theme.palette.primary.main, 0.28),
        },
        '.maplibregl-ctrl-group': {
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${systemTheme.shape.inputRadius}px !important`,
          backgroundColor: `${translucent(theme.palette.background.paper, 0.92)} !important`,
          boxShadow: `${systemTheme.effects.shadow} !important`,
        },
        '.maplibregl-ctrl-group button': {
          filter: theme.palette.mode === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none',
        },
        '.maplibregl-popup-content': {
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${systemTheme.shape.cardRadius}px`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: systemTheme.effects.shadow,
        },
        '.maplibregl-popup-tip': {
          borderTopColor: theme.palette.background.paper,
          borderBottomColor: theme.palette.background.paper,
        },
      }),
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage:
            systemTheme.id === 'futuristicGradient'
              ? 'linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.012))'
              : 'none',
          borderColor: theme.palette.divider,
          transition: 'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: systemTheme.shape.cardRadius,
          backgroundColor: translucent(
            theme.palette.background.paper,
            systemTheme.mode === 'dark' ? 0.94 : 0.98,
          ),
          boxShadow: systemTheme.effects.shadow,
          backdropFilter: systemTheme.id === 'futuristicGradient' ? 'blur(14px)' : 'none',
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          color: theme.palette.sidebar.contrastText,
          borderColor: theme.palette.divider,
          backgroundColor: theme.palette.sidebar.main,
          backgroundImage:
            systemTheme.id === 'futuristicGradient'
              ? 'linear-gradient(180deg, rgba(139,92,246,0.16), rgba(236,72,153,0.07))'
              : 'none',
          '& .MuiListItemButton-root, & .MuiListItemIcon-root, & .MuiListItemText-primary': {
            color: 'inherit',
          },
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: translucent(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(12px)',
          boxShadow: 'none',
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: systemTheme.shape.inputRadius,
          backgroundColor: translucent(theme.palette.surface.main, 0.78),
          transition: 'box-shadow 160ms ease, background-color 160ms ease',
          '&:hover': {
            backgroundColor: theme.palette.surface.main,
          },
          '&.Mui-focused': {
            boxShadow: systemTheme.effects.glow,
          },
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: systemTheme.shape.inputRadius,
          textTransform: 'none',
        },
        sizeMedium: {
          minHeight: '40px',
        },
        contained: ({ theme }) => ({
          color: theme.palette.getContrastText(theme.palette.primary.main),
          background:
            systemTheme.effects.buttonGradient === 'none'
              ? theme.palette.primary.main
              : systemTheme.effects.buttonGradient,
          boxShadow: systemTheme.effects.glow,
          '&:hover': {
            filter: 'brightness(1.06)',
            boxShadow: systemTheme.effects.shadow,
          },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: systemTheme.shape.inputRadius,
          '&:hover': {
            color: theme.palette.primary.main,
            backgroundColor: translucent(theme.palette.primary.main, 0.12),
          },
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          margin: systemTheme.id === 'professionalDashboard' ? theme.spacing(0.5, 1) : 0,
          borderRadius:
            systemTheme.id === 'professionalDashboard' ? systemTheme.shape.inputRadius : 0,
          '&.Mui-selected': {
            color: theme.palette.primary.main,
            backgroundColor: translucent(theme.palette.primary.main, 0.16),
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main,
            },
          },
        }),
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: ({ theme }) => ({
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${systemTheme.shape.cardRadius}px !important`,
          boxShadow: 'none',
          '&::before': { display: 'none' },
          '& + &': { marginTop: theme.spacing(1.5) },
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.palette.divider,
          '@media print': {
            color: theme.palette.alwaysDark.main,
          },
        }),
        head: ({ theme }) => ({
          color: theme.palette.text.primary,
          fontWeight: 700,
          backgroundColor: theme.palette.surface.main,
        }),
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }),
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'center',
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        enterDelay: 500,
        enterNextDelay: 500,
      },
    },
  };
};
