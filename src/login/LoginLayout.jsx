import { useMediaQuery, Paper } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import LogoImage from './LogoImage';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    height: '100%',
    background: theme.systemTheme.effects.pageGradient,
    backgroundColor: theme.palette.background.default,
  },
  sidebar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background:
      theme.systemTheme.id === 'classic'
        ? theme.palette.primary.main
        : theme.systemTheme.effects.loginGradient,
    paddingBottom: theme.spacing(5),
    width: theme.dimensions.sidebarWidth,
    borderRight: theme.systemTheme.id === 'classic' ? 'none' : `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down('lg')]: {
      width: theme.dimensions.sidebarWidthTablet,
    },
    [theme.breakpoints.down('sm')]: {
      width: '0px',
    },
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    borderRadius: 0,
    background: theme.systemTheme.effects.pageGradient,
    backgroundColor: theme.palette.background.paper,
    boxShadow:
      theme.systemTheme.id === 'classic'
        ? '-2px 0px 16px rgba(0, 0, 0, 0.25)'
        : theme.systemTheme.effects.shadow,
    [theme.breakpoints.up('lg')]: {
      padding: theme.spacing(0, 25, 0, 0),
    },
  },
  form: {
    maxWidth: theme.spacing(52),
    padding: theme.spacing(5),
    width: '100%',
  },
}));

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();
  const theme = useTheme();

  return (
    <main className={classes.root}>
      <div className={classes.sidebar}>
        {!useMediaQuery(theme.breakpoints.down('lg')) && (
          <LogoImage
            color={
              theme.systemTheme.id === 'classic'
                ? theme.palette.secondary.contrastText
                : theme.systemTheme.id === 'lightClean'
                  ? theme.palette.primary.main
                  : theme.palette.sidebar.contrastText
            }
          />
        )}
      </div>
      <Paper className={classes.paper}>
        <form className={classes.form}>{children}</form>
      </Paper>
    </main>
  );
};

export default LoginLayout;
