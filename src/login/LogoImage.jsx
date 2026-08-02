import { useTheme, useMediaQuery, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import branding from '../../branding';

const useStyles = makeStyles()((theme) => ({
  image: {
    alignSelf: 'center',
    maxWidth: '240px',
    maxHeight: '120px',
    width: 'auto',
    height: 'auto',
    margin: theme.spacing(2),
  },
  wordmark: {
    maxWidth: theme.systemTheme.id === 'classic' ? '240px' : '560px',
    margin: theme.spacing(2),
    color: theme.systemTheme.login.brandColor,
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    fontSize: theme.systemTheme.id === 'classic' ? '3rem' : 'clamp(2.4rem, 5vw, 5.4rem)',
    fontWeight: theme.systemTheme.id === 'classic' ? 700 : 850,
    lineHeight: theme.systemTheme.id === 'classic' ? 1.1 : 0.95,
    letterSpacing: theme.systemTheme.id === 'classic' ? 'normal' : '-0.045em',
    textAlign: 'center',
    textTransform: theme.systemTheme.id === 'futuristicGradient' ? 'uppercase' : 'none',
    [theme.breakpoints.down('md')]: {
      fontSize: '2.35rem',
      lineHeight: 1,
    },
  },
  accent: {
    color: theme.systemTheme.login.brandAccent,
    fontWeight: 900,
    letterSpacing: '0.02em',
  },
}));

const LogoImage = ({ color }) => {
  const theme = useTheme();
  const { classes } = useStyles();

  const expanded = !useMediaQuery(theme.breakpoints.down('lg'));

  const logo = useSelector((state) => state.session.server.attributes?.logo);
  const logoInverted = useSelector((state) => state.session.server.attributes?.logoInverted);
  const title = useSelector((state) => state.session.server.attributes?.title);

  if (logo) {
    if (expanded && logoInverted) {
      return <img className={classes.image} src={logoInverted} alt={title || branding.name} />;
    }
    return <img className={classes.image} src={logo} alt={title || branding.name} />;
  }
  const displayTitle = title || branding.name;
  const brandedTitle = !title && displayTitle === 'Kersting GPS';
  return (
    <Typography className={classes.wordmark} variant="h3" style={{ color }}>
      {brandedTitle ? (
        <>
          Kersting <span className={classes.accent}>GPS</span>
        </>
      ) : (
        displayTitle
      )}
    </Typography>
  );
};

export default LogoImage;
