import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';
import NavigationIcon from '@mui/icons-material/Navigation';
import { map } from '../core/MapView';
import { vehicleFollowModes } from '../core/vehicleFollow';

const useStyles = makeStyles()((theme) => ({
  button: {
    '&&': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#333',
    },
    '&&.active': {
      color: theme.palette.primary.main,
      backgroundColor: theme.palette.action.selected,
    },
    '&&.paused': {
      color: theme.palette.warning.main,
    },
  },
}));

const MapVehicleFollowControl = ({ selected, paused, mode, onToggleFollow, onToggleMode }) => {
  const theme = useTheme();
  const { classes } = useStyles();
  const followButtonRef = useRef();
  const modeButtonRef = useRef();
  const followRootRef = useRef();
  const modeRootRef = useRef();
  const onToggleFollowRef = useRef(onToggleFollow);
  const onToggleModeRef = useRef(onToggleMode);
  onToggleFollowRef.current = onToggleFollow;
  onToggleModeRef.current = onToggleMode;

  useEffect(() => {
    let container;
    const control = {
      onAdd: () => {
        container = document.createElement('div');
        container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

        const followButton = document.createElement('button');
        followButton.type = 'button';
        followButton.className = `maplibregl-ctrl-icon ${classes.button}`;
        followButton.onclick = () => onToggleFollowRef.current();
        container.appendChild(followButton);
        followButtonRef.current = followButton;
        followRootRef.current = createRoot(followButton);

        const modeButton = document.createElement('button');
        modeButton.type = 'button';
        modeButton.className = `maplibregl-ctrl-icon ${classes.button}`;
        modeButton.onclick = () => onToggleModeRef.current();
        container.appendChild(modeButton);
        modeButtonRef.current = modeButton;
        modeRootRef.current = createRoot(modeButton);

        return container;
      },
      onRemove: () => {
        queueMicrotask(() => {
          followRootRef.current?.unmount();
          modeRootRef.current?.unmount();
        });
        container.remove();
      },
    };
    map.addControl(control, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    return () => map.removeControl(control);
  }, [classes.button, theme.direction]);

  useEffect(() => {
    const button = followButtonRef.current;
    if (!button) return;
    button.disabled = !selected;
    button.title = !selected
      ? 'Selecione um veículo para acompanhar'
      : paused
        ? 'Voltar a seguir veículo'
        : 'Pausar acompanhamento';
    button.setAttribute('aria-label', button.title);
    button.classList.toggle('active', selected && !paused);
    button.classList.toggle('paused', selected && paused);
    followRootRef.current?.render(
      paused || !selected ? (
        <GpsNotFixedIcon fontSize="small" />
      ) : (
        <GpsFixedIcon fontSize="small" />
      ),
    );
  }, [paused, selected]);

  useEffect(() => {
    const button = modeButtonRef.current;
    if (!button) return;
    const heading = mode === vehicleFollowModes.heading;
    button.title = heading ? 'Direção para cima ativa' : 'Norte para cima ativo';
    button.setAttribute('aria-label', `${button.title}. Clique para alternar o modo.`);
    button.classList.toggle('active', heading);
    modeRootRef.current?.render(
      <NavigationIcon
        fontSize="small"
        sx={{ transform: heading ? 'none' : 'rotate(-45deg)', transition: 'transform 200ms' }}
      />,
    );
  }, [mode]);

  return null;
};

export default MapVehicleFollowControl;
