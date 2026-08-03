import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Snackbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HistoryIcon from '@mui/icons-material/History';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import { useTheme } from '@mui/material/styles';
import { devicesActions } from '../../store';
import fetchOrThrow from '../util/fetchOrThrow';
import { getCommandResultMessage, getCriticalCommandSafety } from '../../settings/commandCatalog';

const commandUnavailable =
  'Comando não configurado, não autorizado ou não suportado por este rastreador';

const ActionButton = ({ title, disabled, onClick, children }) => (
  <Tooltip title={disabled ? `${title}: ${commandUnavailable}` : title}>
    <span>
      <IconButton
        size="small"
        aria-label={title}
        disabled={disabled}
        onClick={onClick}
        onMouseDown={(event) => event.stopPropagation()}
        color={
          title === 'Localizar veículo no mapa'
            ? 'primary'
            : title === 'Bloquear motor'
              ? 'error'
              : title === 'Desbloquear motor'
                ? 'success'
                : 'inherit'
        }
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

const QuickDeviceActions = ({
  device,
  position,
  expanded = false,
  card = false,
  showMore = true,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [commands, setCommands] = useState([]);
  const [criticalCommand, setCriticalCommand] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [message, setMessage] = useState(null);
  const active = card || expanded || Boolean(anchorEl);

  useEffect(() => {
    if (!active || !device?.id) {
      return undefined;
    }
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetchOrThrow(`/api/commands/send?deviceId=${device.id}`, {
          signal: controller.signal,
        });
        setCommands(await response.json());
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCommands([]);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [active, device?.id]);

  const engineStop = useMemo(
    () => commands.find((command) => command.type === 'engineStop'),
    [commands],
  );
  const engineResume = useMemo(
    () => commands.find((command) => command.type === 'engineResume'),
    [commands],
  );

  const locate = (event) => {
    event?.stopPropagation();
    if (!position) {
      setMessage({
        severity: 'warning',
        text: 'Este veículo ainda não possui uma localização disponível.',
      });
      return;
    }
    dispatch(devicesActions.selectId(device.id));
  };

  const requestCommand = (event, command) => {
    event?.stopPropagation();
    if (command) {
      setCriticalCommand(command);
    }
  };

  const sendCommand = async () => {
    try {
      const response = await fetchOrThrow('/api/commands/send?confirmed=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...criticalCommand, deviceId: device.id }),
      });
      setMessage({ severity: 'success', text: getCommandResultMessage(response.status) });
    } catch {
      setMessage({
        severity: 'error',
        text: 'Não foi possível solicitar o comando ao equipamento.',
      });
    } finally {
      setCriticalCommand(null);
    }
  };

  const safety = criticalCommand && getCriticalCommandSafety(criticalCommand, position);
  const openMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const closeMenu = () => setAnchorEl(null);
  const openPage = (path) => {
    closeMenu();
    navigate(path);
  };

  const showQuickButtons = card || (expanded && !mobile);

  return (
    <>
      <ActionButton title="Localizar veículo no mapa" onClick={locate}>
        <MyLocationIcon fontSize="small" />
      </ActionButton>
      {showQuickButtons && (
        <>
          <ActionButton
            title="Bloquear motor"
            disabled={!engineStop}
            onClick={(event) => requestCommand(event, engineStop)}
          >
            <LockIcon fontSize="small" />
          </ActionButton>
          <ActionButton
            title="Desbloquear motor"
            disabled={!engineResume}
            onClick={(event) => requestCommand(event, engineResume)}
          >
            <LockOpenIcon fontSize="small" />
          </ActionButton>
        </>
      )}
      {showMore && (card || expanded) && (
        <ActionButton title="Mais ações" onClick={openMenu}>
          <MoreVertIcon fontSize="small" />
        </ActionButton>
      )}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        {mobile && (
          <>
            <MenuItem disabled={!engineStop} onClick={(event) => requestCommand(event, engineStop)}>
              <ListItemIcon>
                <LockIcon fontSize="small" />
              </ListItemIcon>
              Bloquear motor
            </MenuItem>
            <MenuItem
              disabled={!engineResume}
              onClick={(event) => requestCommand(event, engineResume)}
            >
              <ListItemIcon>
                <LockOpenIcon fontSize="small" />
              </ListItemIcon>
              Desbloquear motor
            </MenuItem>
          </>
        )}
        <MenuItem onClick={() => openPage(`/replay?deviceId=${device.id}`)}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          Histórico
        </MenuItem>
        <MenuItem onClick={() => openPage(`/settings/device/${device.id}/command`)}>
          <ListItemIcon>
            <SendIcon fontSize="small" />
          </ListItemIcon>
          Comandos adicionais
        </MenuItem>
        <MenuItem onClick={() => openPage(`/settings/device/${device.id}`)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Editar veículo
        </MenuItem>
      </Menu>
      <Dialog open={Boolean(criticalCommand)} onClose={() => setCriticalCommand(null)}>
        <DialogTitle>Confirmar comando crítico</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            {criticalCommand?.type === 'engineStop'
              ? 'Tem certeza de que deseja solicitar o bloqueio deste veículo?'
              : 'Deseja solicitar a liberação do bloqueio deste veículo?'}
          </Typography>
          {criticalCommand?.type === 'engineStop' && (
            <Alert severity="warning">
              Realize o bloqueio somente com o veículo parado e em local seguro. A velocidade é
              baseada na última posição recebida e pode estar desatualizada.
            </Alert>
          )}
          {safety?.stale && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              A última posição é antiga ou não está disponível. Confirme a situação real do veículo.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCriticalCommand(null)}>Cancelar</Button>
          <Tooltip
            title={
              safety?.blocked
                ? 'A última posição indica que o veículo está em movimento.'
                : 'Confirmar solicitação'
            }
          >
            <span>
              <Button
                color="error"
                variant="contained"
                disabled={safety?.blocked}
                onClick={sendCommand}
              >
                Confirmar solicitação
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(message)} autoHideDuration={6000} onClose={() => setMessage(null)}>
        {message && <Alert severity={message.severity}>{message.text}</Alert>}
      </Snackbar>
    </>
  );
};

export default QuickDeviceActions;
