import { useCallback, useReducer, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Typography,
  TextField,
} from '@mui/material';
import { useAsyncTask, useScrollToLoad, pageSize } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import { formatBoolean } from '../common/util/formatter';
import { prefixString } from '../common/util/stringUtils';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader from './components/SearchHeader';
import { useAdministrator, useRestriction } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { isCriticalCommand, isSystemCommand } from './commandCatalog';

const CommandsPage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const [reloadKey, reload] = useReducer((k) => k + 1, 0);
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const limitCommands = useRestriction('limitCommands');
  const administrator = useAdministrator();
  const [catalogPreview, setCatalogPreview] = useState(null);
  const [catalogResult, setCatalogResult] = useState(null);
  const [confirmApply, setConfirmApply] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [applyScope, setApplyScope] = useState('all');
  const [scopeIds, setScopeIds] = useState('');

  const catalogScope = () => {
    const ids = scopeIds
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);
    return {
      userIds: applyScope === 'users' ? ids : [],
      groupIds: applyScope === 'groups' ? ids : [],
    };
  };

  const loadCatalogPreview = async () => {
    setCatalogError('');
    try {
      await fetchOrThrow('/api/commands/defaults/bootstrap', { method: 'POST' });
      const response = await fetchOrThrow('/api/commands/defaults/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catalogScope()),
      });
      setCatalogPreview(await response.json());
      reload();
    } catch (error) {
      setCatalogError(error.message);
    }
  };

  const applyCatalog = async () => {
    setCatalogError('');
    try {
      const response = await fetchOrThrow('/api/commands/defaults/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catalogScope()),
      });
      setCatalogResult(await response.json());
      setConfirmApply(false);
      await loadCatalogPreview();
    } catch (error) {
      setCatalogError(error.message);
    }
  };

  const loadItems = useCallback(
    async (offset, signal) => {
      const query = new URLSearchParams({ limit: pageSize, offset });
      if (searchKeyword) {
        query.append('keyword', searchKeyword);
      }
      const response = await fetchOrThrow(`/api/commands?${query.toString()}`, { signal });
      const data = await response.json();
      setItems((previous) => (offset ? [...previous, ...data] : data));
      setHasMore(data.length >= pageSize);
    },
    [searchKeyword],
  );

  const sentinelRef = useScrollToLoad(() => loadItems(items.length));

  useAsyncTask(
    async ({ signal }) => {
      void reloadKey;
      setItems([]);
      await loadItems(0, signal);
    },
    [reloadKey, loadItems],
  );

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedSavedCommands']}>
      {administrator && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Catálogo padrão do sistema</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Prepare e distribua comandos aprovados sem enviá-los aos rastreadores.
          </Typography>
          <Button variant="outlined" onClick={loadCatalogPreview}>
            Preparar e visualizar aplicação
          </Button>
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Escopo"
              value={applyScope}
              onChange={(event) => {
                setApplyScope(event.target.value);
                setCatalogPreview(null);
              }}
            >
              <MenuItem value="all">Todos os usuários elegíveis</MenuItem>
              <MenuItem value="users">Usuários selecionados</MenuItem>
              <MenuItem value="groups">Usuários de grupos selecionados</MenuItem>
            </TextField>
            {applyScope !== 'all' && (
              <TextField
                size="small"
                label={applyScope === 'users' ? 'IDs dos usuários' : 'IDs dos grupos'}
                helperText="Separe múltiplos IDs por vírgula"
                value={scopeIds}
                onChange={(event) => {
                  setScopeIds(event.target.value);
                  setCatalogPreview(null);
                }}
              />
            )}
          </Box>
          {catalogPreview && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Prévia: {catalogPreview.users} usuários analisados; {catalogPreview.created} vínculos
              a criar; {catalogPreview.existing} já existentes; {catalogPreview.ignoredUsers}{' '}
              usuários ignorados.
              <Button sx={{ ml: 2 }} onClick={() => setConfirmApply(true)}>
                Aplicar aos usuários elegíveis
              </Button>
            </Alert>
          )}
          {catalogResult && (
            <Alert severity={catalogResult.failures.length ? 'warning' : 'success'} sx={{ mt: 2 }}>
              Aplicação concluída: {catalogResult.created} vínculos criados e{' '}
              {catalogResult.existing} preservados.
            </Alert>
          )}
          {catalogError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {catalogError}
            </Alert>
          )}
        </Box>
      )}
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>{t('sharedDescription')}</TableCell>
            <TableCell>{t('sharedType')}</TableCell>
            <TableCell>{t('commandSendSms')}</TableCell>
            {!limitCommands && <TableCell className={classes.columnAction} />}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.description}
                {isSystemCommand(item) && <Chip size="small" label="Padrão" sx={{ ml: 1 }} />}
                {isCriticalCommand(item) && (
                  <Chip size="small" color="error" label="Crítico" sx={{ ml: 1 }} />
                )}
              </TableCell>
              <TableCell>{t(prefixString('command', item.type))}</TableCell>
              <TableCell>{formatBoolean(item.textChannel, t)}</TableCell>
              {!limitCommands && (
                <TableCell className={classes.columnAction} padding="none">
                  <CollectionActions
                    itemId={item.id}
                    editPath="/settings/command"
                    endpoint="commands"
                    onReload={reload}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
          {hasMore && (
            <TableShimmer
              ref={items.length > 0 ? sentinelRef : null}
              columns={limitCommands ? 3 : 4}
              endAction
            />
          )}
        </TableBody>
      </Table>
      <CollectionFab editPath="/settings/command" disabled={limitCommands} />
      <Dialog open={confirmApply} onClose={() => setConfirmApply(false)}>
        <DialogTitle>Aplicar catálogo padrão?</DialogTitle>
        <DialogContent>
          Esta operação cria somente os vínculos ausentes para usuários elegíveis. Nenhum comando
          será enviado a um equipamento e vínculos existentes serão preservados.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmApply(false)}>Cancelar</Button>
          <Button variant="contained" onClick={applyCatalog}>
            Confirmar aplicação
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
};

export default CommandsPage;
