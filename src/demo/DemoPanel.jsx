import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HighwayIcon from '@mui/icons-material/AddRoad';
import GeofenceIcon from '@mui/icons-material/MyLocation';
import SpeedIcon from '@mui/icons-material/Speed';
import OfflineIcon from '@mui/icons-material/SignalWifiOff';
import CompleteIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useDispatch, useSelector } from 'react-redux';
import { devicesActions, mapUiActions } from '../store';
import { statusCardModes } from '../store/mapUi';
import {
  formatRemaining,
  progressState,
  remainingSeconds,
  scenarioProgressSteps,
} from './demoUtils';

const icons = {
  urban: DirectionsCarIcon,
  highway: HighwayIcon,
  geofence: GeofenceIcon,
  overspeed: SpeedIcon,
  offline: OfflineIcon,
  complete: CompleteIcon,
};

const useStyles = makeStyles()((theme) => ({
  panel: {
    position: 'fixed',
    zIndex: 8,
    top: theme.spacing(2),
    right: theme.spacing(2),
    width: 'min(430px, calc(100vw - 32px))',
    maxHeight: 'calc(100vh - 32px)',
    overflow: 'auto',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.systemTheme.shape.cardRadius,
    [theme.breakpoints.down('md')]: {
      top: 'auto',
      right: theme.spacing(1),
      bottom: theme.spacing(10),
      width: 'calc(100vw - 16px)',
      maxHeight: '56vh',
    },
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: theme.spacing(1),
  },
  card: {
    height: '100%',
  },
  activeStep: {
    color: theme.palette.primary.main,
  },
}));

const DemoPanel = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);
  const isDemo = Boolean(user?.attributes?.demo);
  const selectedOnceRef = useRef(false);
  const [session, setSession] = useState(null);
  const [configuration, setConfiguration] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('urban');
  const [remaining, setRemaining] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [browserNotifications, setBrowserNotifications] = useState(
    () => window.localStorage.getItem('demoBrowserNotifications') === 'true',
  );

  const refresh = useCallback(async () => {
    if (!isDemo) return;
    const [sessionResponse, configResponse] = await Promise.all([
      fetch('/api/demo/session'),
      configuration ? Promise.resolve(null) : fetch('/api/demo/config'),
    ]);
    if (!sessionResponse.ok) {
      throw new Error('A sessão de demonstração expirou.');
    }
    const nextSession = await sessionResponse.json();
    setSession(nextSession);
    setRemaining(remainingSeconds(nextSession.expiresAt));
    if (configResponse?.ok) {
      const nextConfiguration = await configResponse.json();
      setConfiguration(nextConfiguration);
      setSelectedScenario(nextSession.scenarioId || nextConfiguration.defaultScenario);
    }
  }, [isDemo, configuration]);

  useEffect(() => {
    if (!isDemo) return undefined;
    refresh().catch((refreshError) => setError(refreshError.message));
    const timer = window.setInterval(() => {
      refresh().catch((refreshError) => setError(refreshError.message));
    }, 2000);
    return () => window.clearInterval(timer);
  }, [isDemo, refresh]);

  useEffect(() => {
    if (!session?.expiresAt) return undefined;
    const timer = window.setInterval(() => setRemaining(remainingSeconds(session.expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [session?.expiresAt]);

  useEffect(() => {
    if (session?.deviceId && !selectedOnceRef.current) {
      selectedOnceRef.current = true;
      dispatch(devicesActions.selectId(session.deviceId));
      dispatch(mapUiActions.setDetailsMode(statusCardModes.expanded));
    }
  }, [dispatch, session?.deviceId]);

  const request = async (path) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(path, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar a demonstração.');
      setSession(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const enableBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      setError('Este navegador não oferece notificações do sistema.');
      return;
    }
    const permission = await window.Notification.requestPermission();
    const enabled = permission === 'granted';
    window.localStorage.setItem('demoBrowserNotifications', String(enabled));
    setBrowserNotifications(enabled);
  };

  const steps = useMemo(
    () => scenarioProgressSteps(session?.scenarioId || selectedScenario),
    [session?.scenarioId, selectedScenario],
  );
  const running = session?.status === 'RUNNING';
  const paused = session?.status === 'PAUSED';

  if (!isDemo) return null;

  return (
    <Paper className={classes.panel} elevation={10}>
      <Stack spacing={1.5} sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Central de Demonstração</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" color="primary" label="Modo Demonstração" />
              <Typography variant="body2">Tempo restante: {formatRemaining(remaining)}</Typography>
            </Stack>
          </Box>
          <Tooltip title={minimized ? 'Expandir' : 'Minimizar'}>
            <IconButton onClick={() => setMinimized((value) => !value)}>
              {minimized ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
        <LinearProgress variant="determinate" value={session?.progress || 0} />
        <Collapse in={!minimized}>
          <Stack spacing={1.5}>
            {error && <Alert severity="error">{error}</Alert>}
            {!running && !paused && (
              <>
                <Typography variant="subtitle2">Escolha uma demonstração</Typography>
                <div className={classes.cards}>
                  {configuration?.scenarios?.map((scenario) => {
                    const Icon = icons[scenario.id] || DirectionsCarIcon;
                    const selected = selectedScenario === scenario.id;
                    return (
                      <Card key={scenario.id} variant="outlined" className={classes.card}>
                        <CardActionArea
                          sx={{ height: '100%' }}
                          onClick={() => setSelectedScenario(scenario.id)}
                          selected={selected}
                        >
                          <CardContent sx={{ p: 1.25 }}>
                            <Icon color={selected ? 'primary' : 'inherit'} fontSize="small" />
                            <Typography variant="subtitle2">{scenario.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {scenario.description}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    );
                  })}
                </div>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  disabled={busy || !selectedScenario || remaining === 0}
                  onClick={() => request(`/api/demo/scenarios/${selectedScenario}`)}
                >
                  Iniciar demonstração
                </Button>
              </>
            )}
            {(running || paused) && (
              <>
                <Typography variant="subtitle2">Demonstração em andamento</Typography>
                <Stack spacing={0.5}>
                  {steps.map((label, index) => {
                    const state = progressState(
                      index,
                      steps.length,
                      session.progress,
                      session.currentStep,
                      label,
                    );
                    return (
                      <Stack
                        key={label}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        className={state === 'active' ? classes.activeStep : undefined}
                      >
                        {state === 'complete' ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <RadioButtonUncheckedIcon
                            color={state === 'active' ? 'primary' : 'disabled'}
                            fontSize="small"
                          />
                        )}
                        <Typography variant="body2">{label}</Typography>
                      </Stack>
                    );
                  })}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Etapa atual: {session.currentStep}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {running ? (
                    <Button
                      fullWidth
                      startIcon={<PauseIcon />}
                      disabled={busy}
                      onClick={() => request('/api/demo/controls/pause')}
                    >
                      Pausar
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      startIcon={<PlayArrowIcon />}
                      disabled={busy}
                      onClick={() => request('/api/demo/controls/resume')}
                    >
                      Retomar
                    </Button>
                  )}
                  <Button
                    fullWidth
                    color="error"
                    startIcon={<StopIcon />}
                    disabled={busy}
                    onClick={() => request('/api/demo/controls/stop')}
                  >
                    Parar
                  </Button>
                </Stack>
              </>
            )}
            <Button
              size="small"
              variant={browserNotifications ? 'contained' : 'outlined'}
              startIcon={<NotificationsActiveIcon />}
              onClick={enableBrowserNotifications}
            >
              {browserNotifications ? 'Alertas do navegador ativos' : 'Ativar alertas do navegador'}
            </Button>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
};

export default DemoPanel;
