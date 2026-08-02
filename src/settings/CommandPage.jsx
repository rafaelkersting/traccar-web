import { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditItemView from './components/EditItemView';
import { useTranslation } from '../common/components/LocalizationProvider';
import BaseCommandView from './components/BaseCommandView';
import SettingsMenu from './components/SettingsMenu';
import useSettingsStyles from './common/useSettingsStyles';
import { useAdministrator } from '../common/util/permissions';
import { systemCommandKeys } from './commandCatalog';

const CommandPage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();
  const administrator = useAdministrator();

  const [item, setItem] = useState();

  const validate = () => item && item.type;

  return (
    <EditItemView
      endpoint="commands"
      item={item}
      setItem={setItem}
      validate={validate}
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
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Catálogo padrão do sistema</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(item.attributes?.[systemCommandKeys.system])}
                      onChange={(event) =>
                        setItem({
                          ...item,
                          attributes: {
                            ...item.attributes,
                            systemDefault: event.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Disponibilizar no catálogo padrão"
                />
                {item.attributes?.[systemCommandKeys.system] && (
                  <>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.attributes.systemDefaultActive !== false}
                          onChange={(event) =>
                            setItem({
                              ...item,
                              attributes: {
                                ...item.attributes,
                                systemDefaultActive: event.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Ativo"
                    />
                    <TextField
                      select
                      label="Categoria"
                      value={item.attributes.systemDefaultCategory || 'other'}
                      onChange={(event) =>
                        setItem({
                          ...item,
                          attributes: {
                            ...item.attributes,
                            systemDefaultCategory: event.target.value,
                          },
                        })
                      }
                    >
                      <MenuItem value="location">Localização</MenuItem>
                      <MenuItem value="equipment">Equipamento</MenuItem>
                      <MenuItem value="security">Segurança</MenuItem>
                      <MenuItem value="other">Outros</MenuItem>
                    </TextField>
                    <TextField
                      label="Resumo para o usuário"
                      value={item.attributes.systemDefaultSummary || ''}
                      onChange={(event) =>
                        setItem({
                          ...item,
                          attributes: {
                            ...item.attributes,
                            systemDefaultSummary: event.target.value,
                          },
                        })
                      }
                    />
                    <TextField
                      label="Perfis (administrator, manager, client)"
                      value={item.attributes.systemDefaultProfiles || ''}
                      onChange={(event) =>
                        setItem({
                          ...item,
                          attributes: {
                            ...item.attributes,
                            systemDefaultProfiles: event.target.value,
                          },
                        })
                      }
                    />
                    <TextField
                      type="number"
                      label="Ordem"
                      value={item.attributes.systemDefaultOrder || 0}
                      onChange={(event) =>
                        setItem({
                          ...item,
                          attributes: {
                            ...item.attributes,
                            systemDefaultOrder: Number(event.target.value),
                          },
                        })
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(item.attributes.systemDefaultCritical)}
                          onChange={(event) =>
                            setItem({
                              ...item,
                              attributes: {
                                ...item.attributes,
                                systemDefaultCritical: event.target.checked,
                                systemDefaultConfirmation: event.target.checked,
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
                          checked={item.attributes.systemDefaultNewUsers !== false}
                          onChange={(event) =>
                            setItem({
                              ...item,
                              attributes: {
                                ...item.attributes,
                                systemDefaultNewUsers: event.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Aplicar a novos usuários"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.attributes.systemDefaultExistingUsers !== false}
                          onChange={(event) =>
                            setItem({
                              ...item,
                              attributes: {
                                ...item.attributes,
                                systemDefaultExistingUsers: event.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Aplicar a usuários existentes"
                    />
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          )}
        </>
      )}
    </EditItemView>
  );
};

export default CommandPage;
