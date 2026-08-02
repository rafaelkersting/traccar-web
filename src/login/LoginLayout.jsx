import { Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import LogoImage from './LogoImage';

const useStyles = makeStyles()((theme) => {
  const classic = theme.systemTheme.id === 'classic';

  return {
    root: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
      minHeight: '100%',
      height: '100%',
      overflow: 'auto',
      backgroundColor: theme.palette.background.default,
      backgroundImage: classic
        ? theme.systemTheme.effects.pageGradient
        : theme.systemTheme.login.backgroundImage,
      backgroundPosition: theme.systemTheme.login.backgroundPosition,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      '&::before': {
        position: 'fixed',
        zIndex: 0,
        inset: 0,
        background: theme.systemTheme.login.overlay,
        content: '""',
        pointerEvents: 'none',
      },
      [theme.breakpoints.down('md')]: {
        justifyContent: 'center',
        padding: classic ? 0 : theme.spacing(8, 3, 3),
        backgroundPosition: '42% center',
      },
      [theme.breakpoints.down('sm')]: {
        padding: classic ? 0 : theme.spacing(7, 2, 2),
        backgroundPosition: '35% center',
      },
    },
    sidebar: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: classic ? 'center' : 'flex-start',
      boxSizing: 'border-box',
      minHeight: '100%',
      width: classic ? theme.dimensions.sidebarWidth : '58%',
      padding: classic ? theme.spacing(0, 4, 5) : `clamp(32px, 7vw, 112px)`,
      background: classic ? theme.palette.primary.main : 'transparent',
      [theme.breakpoints.down('md')]: {
        display: classic ? 'flex' : 'none',
        width: classic ? theme.dimensions.sidebarWidthTablet : 0,
      },
      [theme.breakpoints.down('sm')]: {
        width: 0,
        padding: 0,
      },
    },
    heroContent: {
      display: classic ? 'none' : 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      maxWidth: 620,
      padding: theme.spacing(3),
      borderRadius: theme.systemTheme.shape.cardRadius,
      background:
        theme.systemTheme.id === 'lightClean'
          ? 'linear-gradient(100deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0))'
          : 'linear-gradient(100deg, rgba(2, 8, 23, 0.48), rgba(2, 8, 23, 0))',
      textShadow: theme.systemTheme.id === 'lightClean' ? 'none' : '0 3px 24px rgba(0, 0, 0, 0.75)',
    },
    classicLogo: {
      display: 'block',
      [theme.breakpoints.down('lg')]: {
        display: 'none',
      },
    },
    tagline: {
      maxWidth: 520,
      margin: theme.spacing(1, 2, 0),
      color: theme.systemTheme.login.brandColor,
      fontSize: 'clamp(1rem, 1.35vw, 1.35rem)',
      fontWeight: 500,
      letterSpacing: '0.08em',
    },
    paper: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      flex: classic ? 1 : '0 1 510px',
      boxSizing: 'border-box',
      minHeight: classic ? '100%' : 'min(690px, calc(100% - 64px))',
      margin: classic ? 0 : theme.spacing(4, 6, 4, 2),
      border: classic ? 'none' : `1px solid ${theme.systemTheme.login.cardBorder}`,
      borderRadius: classic ? 0 : theme.systemTheme.shape.cardRadius * 1.5,
      backgroundImage: classic ? theme.systemTheme.effects.pageGradient : 'none',
      backgroundColor: classic
        ? theme.palette.background.paper
        : theme.systemTheme.login.cardBackground,
      backdropFilter: theme.systemTheme.login.cardBackdrop,
      boxShadow: classic ? '-2px 0 16px rgba(0, 0, 0, 0.25)' : theme.systemTheme.effects.shadow,
      [theme.breakpoints.up('lg')]: {
        paddingRight: classic ? theme.spacing(25) : 0,
      },
      [theme.breakpoints.down('md')]: {
        flex: '0 1 510px',
        minHeight: 'auto',
        margin: 0,
      },
      [theme.breakpoints.down('sm')]: {
        width: '100%',
        borderRadius: classic ? 0 : theme.systemTheme.shape.cardRadius,
      },
    },
    form: {
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: theme.spacing(56),
      padding: theme.spacing(5),
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(3),
      },
    },
  };
});

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();
  const theme = useTheme();

  return (
    <main className={classes.root} data-login-theme={theme.systemTheme.id}>
      <div className={classes.sidebar}>
        {theme.systemTheme.id === 'classic' ? (
          <div className={classes.classicLogo}>
            <LogoImage color={theme.palette.secondary.contrastText} />
          </div>
        ) : (
          <div className={classes.heroContent}>
            <LogoImage />
            <Typography className={classes.tagline}>{theme.systemTheme.login.tagline}</Typography>
          </div>
        )}
      </div>
      <Paper className={classes.paper}>
        <form className={classes.form}>{children}</form>
      </Paper>
    </main>
  );
};

export default LoginLayout;
