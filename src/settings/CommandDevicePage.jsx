import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  Button,
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Snackbar,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from '../common/components/LocalizationProvider';
import BaseCommandView from './components/BaseCommandView';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useAsyncTask, useCatch } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useRestriction } from '../common/util/permissions';
import {
  getCommandResultMessage,
  getCriticalCommandSafety,
  groupQuickCommands,
  isCriticalCommand,
} from './commandCatalog';

const CommandDevicePage = () => {
  const navigate = useNavigate();
  const { classes } = useSettingsStyles();
  const t = useTranslation();
  const limitCommands = useRestriction('limitCommands');

  const { id } = useParams();

  const [savedId, setSavedId] = useState(0);
  const [item, setItem] = useState({});
  const [quickCommands, setQuickCommands] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [criticalCommand, setCriticalCommand] = useState(null);
  const [message, setMessage] = useState(null);

  const device = useSelector((state) => state.devices.items[id]);
  const position = useSelector((state) => state.session.positions[id]);

  useAsyncTask(
    async ({ signal }) => {
      const response = await fetchOrThrow(`/api/commands/send?deviceId=${id}`, { signal });
      setQuickCommands(await response.json());
    },
    [id],
  );

  const sendCommand = useCatch(async (command, confirmed = false) => {
    const query = confirmed ? '?confirmed=true' : '';
    const response = await fetchOrThrow(`/api/commands/send${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...command, deviceId: Number(id) }),
    });
    setCriticalCommand(null);
    setMessage({ severity: 'success', text: getCommandResultMessage(response.status) });
  });

  const handleQuickCommand = (command) => {
    if (isCriticalCommand(command)) {
      setCriticalCommand(command);
    } else {
      sendCommand(command);
    }
  };

  const handleSend = useCatch(async () => {
    let command;
    if (savedId) {
      const response = await fetchOrThrow(`/api/commands/${savedId}`);
      command = await response.json();
      if (isCriticalCommand(command)) {
        setCriticalCommand(command);
        return;
      }
    } else {
      command = item;
    }

    command.deviceId = parseInt(id, 10);

    const response = await fetchOrThrow('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    setMessage({ severity: 'success', text: getCommandResultMessage(response.status) });
  });

  const validate = () => savedId || (item && item.type);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceCommand']}>
      <Container maxWidth="xs" className={classes.container}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Comandos rápidos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {quickCommands.length ? (
              groupQuickCommands(quickCommands).map((category) => (
                <Box key={category.id} sx={{ mb: 2 }}>
                  <Typography variant="overline" color="text.secondary">
                    {category.title}
                  </Typography>
                  <List disablePadding>
                    {category.commands.map((command) => {
                      const safety = getCriticalCommandSafety(command, position);
                      return (
                        <ListItem
                          key={command.id}
                          disableGutters
                          secondaryAction={
                            <Button
                              variant="outlined"
                              onClick={() => handleQuickCommand(command)}
                              disabled={safety.blocked}
                            >
                              Executar
                            </Button>
                          }
                        >
                          <ListItemText
                            primary={command.description}
                            secondary={
                              command.attributes?.systemDefaultSummary ||
                              'Comando salvo aprovado pelo administrador.'
                            }
                          />
                          {isCriticalCommand(command) && (
                            <Chip color="error" size="small" label="Crítico" sx={{ mr: 10 }} />
                          )}
                        </ListItem>
                      );
                    })}
                  </List>
                  <Divider />
                </Box>
              ))
            ) : (
              <Alert severity="info">
                Nenhum comando salvo compatível e autorizado está disponível para este dispositivo.
              </Alert>
            )}
            {device?.status !== 'online' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Dispositivo offline. O comando poderá ser enfileirado, conforme a configuração.
              </Alert>
            )}
            {!limitCommands && (
              <Button sx={{ mt: 2 }} onClick={() => setShowAdvanced((value) => !value)}>
                {showAdvanced ? 'Ocultar tela avançada' : 'Abrir tela avançada'}
              </Button>
            )}
          </AccordionDetails>
        </Accordion>
        {showAdvanced && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Envio avançado</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <BaseCommandView
                deviceId={id}
                item={item}
                setItem={setItem}
                includeSaved
                savedId={savedId}
                setSavedId={setSavedId}
              />
            </AccordionDetails>
          </Accordion>
        )}
        <div className={classes.buttons}>
          <Button type="button" color="primary" variant="outlined" onClick={() => navigate(-1)}>
            {t('sharedCancel')}
          </Button>
          {showAdvanced && (
            <Button
              type="button"
              color="primary"
              variant="contained"
              onClick={handleSend}
              disabled={!validate()}
            >
              {t('commandSend')}
            </Button>
          )}
        </div>
      </Container>
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
          {criticalCommand && getCriticalCommandSafety(criticalCommand, position).stale && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              A última posição é antiga ou não está disponível. Confirme a situação real do veículo.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCriticalCommand(null)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            disabled={
              criticalCommand && getCriticalCommandSafety(criticalCommand, position).blocked
            }
            onClick={() => sendCommand(criticalCommand, true)}
          >
            Confirmar solicitação
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(message)} autoHideDuration={6000} onClose={() => setMessage(null)}>
        {message && <Alert severity={message.severity}>{message.text}</Alert>}
      </Snackbar>
    </PageLayout>
  );
};

export default CommandDevicePage;
