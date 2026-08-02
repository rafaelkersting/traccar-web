import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditItemView from './components/EditItemView';
import { useTranslation } from '../common/components/LocalizationProvider';
import BaseCommandView from './components/BaseCommandView';
import SettingsMenu from './components/SettingsMenu';
import useSettingsStyles from './common/useSettingsStyles';
import { useAdministrator } from '../common/util/permissions';
import { useAsyncTask } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import {
  catalogProfiles,
  getEligibleCatalogUsers,
  parseCatalogIds,
  serializeCatalogIds,
  systemCommandKeys,
} from './commandCatalog';

const profileTitle = (profile) =>
  catalogProfiles.find((option) => option.id === profile)?.title || profile;

const CommandPage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();
  const administrator = useAdministrator();

  const [item, setItem] = useState();
  const [options, setOptions] = useState({
    users: [],
    groups: [],
    devices: [],
  });
  const normalizedRef = useRef(false);

  useAsyncTask(
    async ({ signal }) => {
      if (administrator) {
        const response = await fetchOrThrow('/api/commands/defaults/options', {
          signal,
        });
        setOptions(await response.json());
      }
    },
    [administrator],
  );

  useEffect(() => {
    if (!item || normalizedRef.current) {
      return;
    }
    normalizedRef.current = true;
    if (
      item.type === 'engineStop' &&
      item.attributes?.[systemCommandKeys.system] &&
      (item.description?.toLocaleLowerCase() === 'desligar motor' ||
        !item.attributes?.[systemCommandKeys.profiles])
    ) {
      setItem({
        ...item,
        description:
          item.description?.toLocaleLowerCase() === 'desligar motor'
            ? 'Bloquear Motor'
            : item.description,
        attributes: {
          ...item.attributes,
          [systemCommandKeys.profiles]: 'administrator,manager',
          [systemCommandKeys.category]: 'security',
          [systemCommandKeys.critical]: true,
          [systemCommandKeys.confirmation]: true,
        },
      });
    }
  }, [item]);

  const attributes = useMemo(() => item?.attributes || {}, [item?.attributes]);
  const profiles = String(attributes[systemCommandKeys.profiles] || '')
    .split(',')
    .map((profile) => profile.trim())
    .filter(Boolean);
  const userScope = attributes[systemCommandKeys.userScope] || 'all';
  const deviceScope = attributes[systemCommandKeys.deviceScope] || 'all';
  const selectedUserIds = parseCatalogIds(attributes[systemCommandKeys.userIds]);
  const selectedUserGroupIds = parseCatalogIds(attributes[systemCommandKeys.userGroupIds]);
  const selectedDeviceIds = parseCatalogIds(attributes[systemCommandKeys.deviceIds]);
  const selectedDeviceGroupIds = parseCatalogIds(attributes[systemCommandKeys.deviceGroupIds]);

  const updateAttribute = (key, value) =>
    setItem({ ...item, attributes: { ...attributes, [key]: value } });

  const eligibleUsers = useMemo(
    () => getEligibleCatalogUsers(options.users, attributes),
    [options.users, attributes],
  );

  const userLabel = (user) => {
    const groups = user.groupNames?.length ? user.groupNames.join(', ') : 'Sem grupo/cliente';
    const status = user.disabled ? 'Desativado' : 'Ativo';
    return `${user.name} — ${user.email} — ${profileTitle(user.profile)} — ${groups} — ${status}`;
  };

  const selectedValues = (values, ids) => values.filter((value) => ids.includes(value.id));

  const missingProfiles =
    attributes[systemCommandKeys.system] &&
    attributes[systemCommandKeys.active] !== false &&
    profiles.length === 0;
  const missingUserScope =
    (userScope === 'users' && !selectedUserIds.length) ||
    (userScope === 'groups' && !selectedUserGroupIds.length);
  const missingDeviceScope =
    (deviceScope === 'devices' && !selectedDeviceIds.length) ||
    (deviceScope === 'groups' && !selectedDeviceGroupIds.length);

  const validate = () => item?.type && !missingProfiles && !missingUserScope && !missingDeviceScope;

  const handleItemSaved = async (savedItem) => {
    if (
      savedItem.attributes?.[systemCommandKeys.system] &&
      savedItem.attributes?.[systemCommandKeys.existingUsers] !== false
    ) {
      const body = JSON.stringify({
        userIds: [],
        groupIds: [],
        commandIds: [savedItem.id],
      });
      const previewResponse = await fetchOrThrow('/api/commands/defaults/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const preview = await previewResponse.json();
      if (
        window.confirm(
          `Este comando será disponibilizado para ${preview.users} usuários existentes. Deseja continuar?`,
        )
      ) {
        const response = await fetchOrThrow('/api/commands/defaults/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        const result = await response.json();
        window.alert(
          `Comando aplicado a ${result.users} usuários. ${result.existing} vínculos já existiam. ${result.ignoredUsers} usuários foram ignorados.`,
        );
      }
    }
  };

  const deviceScopeSummary = () => {
    if (deviceScope === 'groups') {
      return selectedValues(options.groups, selectedDeviceGroupIds)
        .map((group) => group.name)
        .join(', ');
    }
    if (deviceScope === 'devices') {
      return selectedValues(options.devices, selectedDeviceIds)
        .map((device) => device.name)
        .join(', ');
    }
    return 'Todos os dispositivos compatíveis';
  };

  return (
    <EditItemView
      endpoint="commands"
      item={item}
      setItem={setItem}
      validate={validate}
      onItemSaved={handleItemSaved}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedSavedCommand']}
    >
      {item && (
        <>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedRequired')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                value={item.description || ''}
                onChange={(event) => setItem({ ...item, description: event.target.value })}
                label={t('sharedDescription')}
              />
              <BaseCommandView item={item} setItem={setItem} />
            </AccordionDetails>
          </Accordion>
          {administrator && (
            <>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Catálogo padrão do sistema</Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.details}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(attributes[systemCommandKeys.system])}
                        onChange={(event) =>
                          updateAttribute(systemCommandKeys.system, event.target.checked)
                        }
                      />
                    }
                    label="Disponibilizar no catálogo padrão"
                  />
                  {attributes[systemCommandKeys.system] && (
                    <>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={attributes[systemCommandKeys.active] !== false}
                            onChange={(event) =>
                              updateAttribute(systemCommandKeys.active, event.target.checked)
                            }
                          />
                        }
                        label="Ativo"
                      />
                      <TextField
                        select
                        label="Categoria"
                        value={attributes[systemCommandKeys.category] || 'other'}
                        onChange={(event) =>
                          updateAttribute(systemCommandKeys.category, event.target.value)
                        }
                      >
                        <MenuItem value="location">Localização</MenuItem>
                        <MenuItem value="equipment">Equipamento</MenuItem>
                        <MenuItem value="security">Segurança</MenuItem>
                        <MenuItem value="other">Outros</MenuItem>
                      </TextField>
                      <TextField
                        label="Resumo para o usuário"
                        value={attributes[systemCommandKeys.summary] || ''}
                        onChange={(event) =>
                          updateAttribute(systemCommandKeys.summary, event.target.value)
                        }
                      />
                      <Autocomplete
                        multiple
                        options={catalogProfiles}
                        value={catalogProfiles.filter((profile) => profiles.includes(profile.id))}
                        getOptionLabel={(option) => option.title}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onChange={(_, values) =>
                          updateAttribute(
                            systemCommandKeys.profiles,
                            values.map((value) => value.id).join(','),
                          )
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Perfis autorizados"
                            error={missingProfiles}
                            helperText={
                              missingProfiles ? 'Selecione pelo menos um perfil autorizado.' : ''
                            }
                          />
                        )}
                      />
                      <FormControl>
                        <FormLabel>Aplicar comando para</FormLabel>
                        <RadioGroup
                          value={userScope}
                          onChange={(event) =>
                            updateAttribute(systemCommandKeys.userScope, event.target.value)
                          }
                        >
                          <FormControlLabel
                            value="all"
                            control={<Radio />}
                            label="Todos os usuários dos perfis selecionados"
                          />
                          <FormControlLabel
                            value="users"
                            control={<Radio />}
                            label="Usuários específicos"
                          />
                          <FormControlLabel
                            value="groups"
                            control={<Radio />}
                            label="Grupos/clientes específicos"
                          />
                        </RadioGroup>
                      </FormControl>
                      {userScope === 'users' && (
                        <>
                          <Autocomplete
                            multiple
                            options={options.users}
                            value={selectedValues(options.users, selectedUserIds)}
                            getOptionLabel={userLabel}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            getOptionDisabled={(option) =>
                              option.disabled ||
                              option.readonly ||
                              option.temporary ||
                              !profiles.includes(option.profile)
                            }
                            onChange={(_, values) =>
                              updateAttribute(
                                systemCommandKeys.userIds,
                                serializeCatalogIds(values.map((value) => value.id)),
                              )
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Usuários específicos"
                                error={missingUserScope}
                                helperText={`${selectedUserIds.length} usuário(s) selecionado(s)`}
                              />
                            )}
                          />
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              onClick={() =>
                                updateAttribute(
                                  systemCommandKeys.userIds,
                                  serializeCatalogIds(
                                    options.users
                                      .filter(
                                        (user) =>
                                          !user.disabled &&
                                          !user.readonly &&
                                          !user.temporary &&
                                          profiles.includes(user.profile),
                                      )
                                      .map((user) => user.id),
                                  ),
                                )
                              }
                            >
                              Selecionar todos elegíveis
                            </Button>
                            <Button
                              size="small"
                              onClick={() => updateAttribute(systemCommandKeys.userIds, '')}
                            >
                              Limpar seleção
                            </Button>
                          </Box>
                        </>
                      )}
                      {userScope === 'groups' && (
                        <Autocomplete
                          multiple
                          options={options.groups}
                          value={selectedValues(options.groups, selectedUserGroupIds)}
                          getOptionLabel={(option) => option.name}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          onChange={(_, values) =>
                            updateAttribute(
                              systemCommandKeys.userGroupIds,
                              serializeCatalogIds(values.map((value) => value.id)),
                            )
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Grupos/clientes específicos"
                              error={missingUserScope}
                            />
                          )}
                        />
                      )}
                      <TextField
                        type="number"
                        label="Ordem"
                        value={attributes[systemCommandKeys.order] || 0}
                        onChange={(event) =>
                          updateAttribute(systemCommandKeys.order, Number(event.target.value))
                        }
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(attributes[systemCommandKeys.critical])}
                            onChange={(event) =>
                              setItem({
                                ...item,
                                attributes: {
                                  ...attributes,
                                  [systemCommandKeys.critical]: event.target.checked,
                                  [systemCommandKeys.confirmation]: event.target.checked,
                                },
                              })
                            }
                          />
                        }
                        label="Comando crítico com confirmação adicional"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={attributes[systemCommandKeys.newUsers] !== false}
                            onChange={(event) =>
                              updateAttribute(systemCommandKeys.newUsers, event.target.checked)
                            }
                          />
                        }
                        label="Aplicar a novos usuários"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={attributes[systemCommandKeys.existingUsers] !== false}
                            onChange={(event) =>
                              updateAttribute(systemCommandKeys.existingUsers, event.target.checked)
                            }
                          />
                        }
                        label="Aplicar a usuários existentes"
                      />
                    </>
                  )}
                </AccordionDetails>
              </Accordion>
              {attributes[systemCommandKeys.system] && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      Disponível para dispositivos e grupos
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails className={classes.details}>
                    <RadioGroup
                      value={deviceScope}
                      onChange={(event) =>
                        updateAttribute(systemCommandKeys.deviceScope, event.target.value)
                      }
                    >
                      <FormControlLabel
                        value="all"
                        control={<Radio />}
                        label="Todos os dispositivos compatíveis"
                      />
                      <FormControlLabel
                        value="groups"
                        control={<Radio />}
                        label="Grupos específicos"
                      />
                      <FormControlLabel
                        value="devices"
                        control={<Radio />}
                        label="Dispositivos específicos"
                      />
                    </RadioGroup>
                    {deviceScope === 'groups' && (
                      <Autocomplete
                        multiple
                        options={options.groups}
                        value={selectedValues(options.groups, selectedDeviceGroupIds)}
                        getOptionLabel={(option) => option.name}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onChange={(_, values) =>
                          updateAttribute(
                            systemCommandKeys.deviceGroupIds,
                            serializeCatalogIds(values.map((value) => value.id)),
                          )
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Grupos específicos"
                            error={missingDeviceScope}
                          />
                        )}
                      />
                    )}
                    {deviceScope === 'devices' && (
                      <Autocomplete
                        multiple
                        options={options.devices}
                        value={selectedValues(options.devices, selectedDeviceIds)}
                        getOptionLabel={(option) => option.name}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onChange={(_, values) =>
                          updateAttribute(
                            systemCommandKeys.deviceIds,
                            serializeCatalogIds(values.map((value) => value.id)),
                          )
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Dispositivos específicos"
                            error={missingDeviceScope}
                          />
                        )}
                      />
                    )}
                  </AccordionDetails>
                </Accordion>
              )}
              {attributes[systemCommandKeys.system] && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Prévia antes de salvar</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {missingProfiles && (
                      <Alert severity="error">Selecione pelo menos um perfil autorizado.</Alert>
                    )}
                    <Typography>
                      Perfis autorizados:{' '}
                      {profiles.map((profile) => profileTitle(profile)).join(', ') || 'Nenhum'}
                    </Typography>
                    <Typography>
                      Escopo:{' '}
                      {userScope === 'all'
                        ? 'Todos os usuários desses perfis'
                        : userScope === 'users'
                          ? 'Usuários específicos'
                          : 'Grupos/clientes específicos'}
                    </Typography>
                    <Typography>Usuários existentes elegíveis: {eligibleUsers.length}</Typography>
                    <Typography>
                      Novos usuários:{' '}
                      {attributes[systemCommandKeys.newUsers] !== false
                        ? 'aplicação automática ativada'
                        : 'desativada'}
                    </Typography>
                    <Typography>Grupos/dispositivos: {deviceScopeSummary() || 'Nenhum'}</Typography>
                    <Typography>Tipo: {item.type}</Typography>
                    <Typography>
                      Comando crítico: {attributes[systemCommandKeys.critical] ? 'Sim' : 'Não'}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </>
          )}
        </>
      )}
    </EditItemView>
  );
};

export default CommandPage;
