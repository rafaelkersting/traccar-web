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
    maxWidth: '240px',
    margin: theme.spacing(2),
    fontWeight: 700,
    lineHeight: 1.1,
    textAlign: 'center',
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
      return <img className={classes.image} src={logoInverted} alt="" />;
    }
    return <img className={classes.image} src={logo} alt="" />;
  }
  return (
    <Typography className={classes.wordmark} variant="h3" style={{ color }}>
      {title || branding.name}
    </Typography>
  );
};

export default LogoImage;
