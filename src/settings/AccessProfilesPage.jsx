import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  FormGroup,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PageLayout from '../common/components/PageLayout';
import fetchOrThrow from '../common/util/fetchOrThrow';
import SettingsMenu from './components/SettingsMenu';
import useSettingsStyles from './common/useSettingsStyles';
import { useCatchCallback } from '../reactHelper';
import { ACCESS_MODULES } from '../common/util/accessPermissions';
import useAccessPermissions, {
  refreshAccessPermissions,
} from '../common/util/useAccessPermissions';

const normalizeDetail = (detail) =>
  JSON.stringify({
    profile: {
      id: detail.profile.id,
      name: detail.profile.name.trim(),
      description: detail.profile.description || '',
      disabled: Boolean(detail.profile.disabled),
    },
    permissions: [...detail.permissions].sort(),
  });

const AccessProfilesPage = () => {
  const { classes } = useSettingsStyles();
  const access = useAccessPermissions();
  const [profiles, setProfiles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [details, setDetails] = useState({});
  const [originals, setOriginals] = useState({});
  const [newProfileName, setNewProfileName] = useState('');
  const [saving, setSaving] = useState([]);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null);
  const canCreate = access.can('access-profile.create');
  const canEdit = access.can('access-profile.edit');
  const canDisable = access.can('access-profile.disable');

  const modules = useMemo(
    () =>
      ACCESS_MODULES.map((module) => ({
        ...module,
        permissions: module.permissions.filter(([permission]) => catalog.includes(permission)),
      })).filter((module) => module.permissions.length),
    [catalog],
  );

  const load = useCatchCallback(async () => {
    const [profilesResponse, catalogResponse] = await Promise.all([
      fetchOrThrow('/api/access/profiles'),
      fetchOrThrow('/api/access/catalog'),
    ]);
    const profileItems = await profilesResponse.json();
    setProfiles(profileItems);
    setCatalog(await catalogResponse.json());
    const entries = await Promise.all(
      profileItems.map(async (profile) => {
        const response = await fetchOrThrow(`/api/access/profiles/${profile.id}`);
        return [profile.id, await response.json()];
      }),
    );
    const loadedDetails = Object.fromEntries(entries);
    setDetails(loadedDetails);
    setOriginals(Object.fromEntries(entries.map(([id, detail]) => [id, normalizeDetail(detail)])));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateDetail = (id, update) => {
    setDetails((current) => ({ ...current, [id]: { ...current[id], ...update } }));
  };

  const setProfilePermissions = (id, permissionKeys, checked) => {
    const current = details[id].permissions;
    updateDetail(id, {
      permissions: checked
        ? [...new Set([...current, ...permissionKeys])]
        : current.filter((permission) => !permissionKeys.includes(permission)),
    });
  };

  const save = async (id) => {
    setSaving((current) => [...current, id]);
    try {
      const response = await fetchOrThrow(`/api/access/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details[id]),
      });
      const saved = await response.json();
      updateDetail(id, saved);
      setOriginals((current) => ({ ...current, [id]: normalizeDetail(saved) }));
      setProfiles((current) =>
        current.map((profile) => (profile.id === id ? saved.profile : profile)),
      );
      refreshAccessPermissions();
      setMessage({ severity: 'success', text: 'Perfil salvo com sucesso' });
    } catch {
      setMessage({ severity: 'error', text: 'Não foi possível salvar o perfil' });
    } finally {
      setSaving((current) => current.filter((item) => item !== id));
    }
  };

  const create = async (source) => {
    setCreating(true);
    try {
      await fetchOrThrow('/api/access/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          source || {
            profile: { name: newProfileName.trim(), description: '', disabled: false },
            permissions: [],
          },
        ),
      });
      setNewProfileName('');
      await load();
      refreshAccessPermissions();
      setMessage({ severity: 'success', text: 'Perfil salvo com sucesso' });
    } catch {
      setMessage({ severity: 'error', text: 'Não foi possível salvar o perfil' });
    } finally {
      setCreating(false);
    }
  };

  const duplicate = (detail) =>
    create({
      profile: {
        name: `${detail.profile.name} - Cópia`,
        description: detail.profile.description || '',
        disabled: detail.profile.disabled,
      },
      permissions: detail.permissions,
    });

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['Configurações', 'Perfis de Acesso']}>
      <Container maxWidth="sm" className={classes.container}>
        <Alert severity="info" sx={{ mb: 2 }}>
          O perfil define as ações permitidas. Os vínculos nativos continuam definindo quais grupos
          e dispositivos o usuário pode acessar.
        </Alert>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Criar perfil</Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.details}>
            <TextField
              label="Nome do perfil"
              value={newProfileName}
              onChange={(event) => setNewProfileName(event.target.value)}
              disabled={!canCreate}
            />
            <Button
              variant="contained"
              disabled={!canCreate || !newProfileName.trim() || creating}
              onClick={() => create()}
              startIcon={creating ? <CircularProgress size={16} /> : null}
            >
              Criar perfil
            </Button>
          </AccordionDetails>
        </Accordion>
        {profiles.map((profile) => {
          const detail = details[profile.id];
          const dirty = detail && originals[profile.id] !== normalizeDetail(detail);
          return (
            <Accordion key={profile.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography>{detail?.profile.name || profile.name}</Typography>
                  {detail && (
                    <Typography variant="caption" color="textSecondary">
                      {detail.permissions.length} permissões concedidas
                    </Typography>
                  )}
                </Stack>
              </AccordionSummary>
              {detail && (
                <AccordionDetails className={classes.details}>
                  <TextField
                    label="Nome"
                    value={detail.profile.name}
                    onChange={(event) =>
                      updateDetail(profile.id, {
                        profile: { ...detail.profile, name: event.target.value },
                      })
                    }
                    disabled={!canEdit}
                  />
                  <FormControlLabel
                    label="Perfil desativado"
                    control={
                      <Checkbox
                        checked={detail.profile.disabled}
                        onChange={(event) =>
                          updateDetail(profile.id, {
                            profile: { ...detail.profile, disabled: event.target.checked },
                          })
                        }
                        disabled={!canDisable}
                      />
                    }
                  />
                  <TextField
                    label="Descrição"
                    value={detail.profile.description || ''}
                    onChange={(event) =>
                      updateDetail(profile.id, {
                        profile: { ...detail.profile, description: event.target.value },
                      })
                    }
                    disabled={!canEdit}
                  />
                  {modules.map((module) => {
                    const keys = module.permissions.map(([permission]) => permission);
                    const selected = keys.filter((permission) =>
                      detail.permissions.includes(permission),
                    ).length;
                    return (
                      <Accordion key={module.key} variant="outlined" disableGutters>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>
                            {module.label} — {selected}/{keys.length}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Button
                              size="small"
                              disabled={!canEdit}
                              onClick={() => setProfilePermissions(profile.id, keys, true)}
                            >
                              Selecionar tudo
                            </Button>
                            <Button
                              size="small"
                              disabled={!canEdit}
                              onClick={() => setProfilePermissions(profile.id, keys, false)}
                            >
                              Limpar
                            </Button>
                          </Stack>
                          <FormGroup>
                            {module.permissions.map(([permission, label]) => (
                              <FormControlLabel
                                key={permission}
                                label={label}
                                control={
                                  <Checkbox
                                    checked={detail.permissions.includes(permission)}
                                    disabled={!canEdit}
                                    onChange={(event) =>
                                      setProfilePermissions(
                                        profile.id,
                                        [permission],
                                        event.target.checked,
                                      )
                                    }
                                  />
                                }
                              />
                            ))}
                          </FormGroup>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      disabled={!canCreate || creating}
                      onClick={() => duplicate(detail)}
                    >
                      Duplicar perfil
                    </Button>
                    <Button
                      variant="contained"
                      disabled={
                        !canEdit ||
                        !dirty ||
                        !detail.profile.name.trim() ||
                        saving.includes(profile.id)
                      }
                      onClick={() => save(profile.id)}
                      startIcon={
                        saving.includes(profile.id) ? <CircularProgress size={16} /> : null
                      }
                    >
                      Salvar perfil
                    </Button>
                  </Stack>
                </AccordionDetails>
              )}
            </Accordion>
          );
        })}
      </Container>
      <Snackbar open={Boolean(message)} autoHideDuration={5000} onClose={() => setMessage(null)}>
        <Alert severity={message?.severity} onClose={() => setMessage(null)}>
          {message?.text}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default AccessProfilesPage;
