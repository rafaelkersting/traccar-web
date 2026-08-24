import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Alert,
  Box,
  Divider,
  Snackbar,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileInput from '../common/components/FileInput';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import SelectField from '../common/components/SelectField';
import deviceCategories from '../common/util/deviceCategories';
import { useTranslation } from '../common/components/LocalizationProvider';
import useDeviceAttributes from '../common/attributes/useDeviceAttributes';
import { useManager, useRestriction } from '../common/util/permissions';
import useAccessPermissions from '../common/util/useAccessPermissions';
import SettingsMenu from './components/SettingsMenu';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';
import useSettingsStyles from './common/useSettingsStyles';
import QrCodeDialog from '../common/components/QrCodeDialog';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { optimizeDeviceImage } from '../common/util/imageOptimization';
import {
  deleteDeviceImage,
  getDeviceImageUrl,
  uploadDeviceImage,
} from '../common/util/deviceImage';
import { devicesActions } from '../store';
import {
  getMapMarkerUrl,
  mapMarkerAttribute,
  optimizeMapMarkerImage,
  removeMapMarkerImage,
  versionMapMarkerImage,
} from '../common/util/mapMarkerImage';
import DeviceMarker3dGallery from './components/DeviceMarker3dGallery';
import { getDeviceMarker3dPreset } from '../map/core/marker3dCatalog';
import {
  clearMarker3dSelection,
  marker3dAttribute,
  selectMarker3dConfiguration,
} from '../map/core/marker3dSelection';

const DevicePage = ({ appearanceOnly = false }) => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();
  const dispatch = useDispatch();

  const manager = useManager();
  const deviceReadonly = useRestriction('deviceReadonly');
  const access = useAccessPermissions();

  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const deviceAttributes = useDeviceAttributes(t);

  const [searchParams] = useSearchParams();
  const uniqueId = searchParams.get('uniqueId');

  const [item, setItem] = useState(uniqueId ? { uniqueId } : null);
  const [showQr, setShowQr] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageStatus, setImageStatus] = useState(null);
  const [optimizingImage, setOptimizingImage] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [markerFile, setMarkerFile] = useState(null);
  const [markerPreview, setMarkerPreview] = useState(null);
  const [markerStatus, setMarkerStatus] = useState(null);
  const [optimizingMarker, setOptimizingMarker] = useState(false);

  const deviceImageUrl = getDeviceImageUrl(item);
  const marker3dPreset = getDeviceMarker3dPreset(item);
  const activeCustomMarkerUrl = marker3dPreset ? null : markerPreview || getMapMarkerUrl(item);
  const technicalEditBlocked = !appearanceOnly && !access.legacy && deviceReadonly;
  const canViewAppearance = access.can('device.appearance.view');
  const canManageCustomMarker =
    access.can('device.appearance.map-marker') && access.can('device.appearance.custom-upload');
  const canManageMarker3d =
    access.can('device.appearance.marker3d') &&
    (!item?.attributes?.[mapMarkerAttribute] || access.can('device.appearance.map-marker'));
  const canRestoreMarker =
    (!item?.attributes?.[mapMarkerAttribute] || access.can('device.appearance.map-marker')) &&
    (!item?.attributes?.[marker3dAttribute] || access.can('device.appearance.marker3d')) &&
    (!item?.attributes?.mapMarker3dModel || access.can('device.appearance.marker-model')) &&
    (!item?.attributes?.mapMarker3dColor || access.can('device.appearance.marker-color'));

  useEffect(
    () => () => {
      if (markerPreview) {
        URL.revokeObjectURL(markerPreview);
      }
    },
    [markerPreview],
  );

  const handleFileInput = async (newFile) => {
    if (!newFile) {
      setImageFile(null);
      return;
    }

    setOptimizingImage(true);
    setImageStatus({ severity: 'info', message: 'Otimizando imagem...' });
    try {
      const result = await optimizeDeviceImage(newFile);
      if (item?.id) {
        const updatedItem = await uploadDeviceImage(item, result.file);
        setItem(updatedItem);
        dispatch(devicesActions.update([updatedItem]));
      }
      setImageFile(null);
      setImageStatus({
        severity: 'success',
        message: 'Imagem do card atualizada com sucesso.',
      });
    } catch {
      setImageFile(null);
      setImageStatus({
        severity: 'error',
        message: 'Não foi possível atualizar a imagem do card.',
      });
    } finally {
      setOptimizingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    setRemovingImage(false);
    setOptimizingImage(true);
    try {
      const updatedItem = await deleteDeviceImage(item);
      setItem(updatedItem);
      dispatch(devicesActions.update([updatedItem]));
      setImageFile(null);
      setImageStatus({
        severity: 'success',
        message: 'Imagem do card removida com sucesso.',
      });
    } catch {
      setImageStatus({
        severity: 'error',
        message: 'Não foi possível remover a imagem do card.',
      });
    } finally {
      setOptimizingImage(false);
    }
  };

  const uploadMapMarker = async (deviceId, file) => {
    const response = await fetchOrThrow(`/api/devices/${deviceId}/marker`, {
      method: 'POST',
      body: file,
    });
    return versionMapMarkerImage(await response.text());
  };

  const handleMarkerInput = async (newFile) => {
    if (!newFile) {
      setMarkerFile(null);
      setMarkerPreview(null);
      setItem({
        ...item,
        attributes: clearMarker3dSelection(removeMapMarkerImage(item.attributes)),
      });
      setMarkerStatus({
        severity: 'success',
        message: 'Imagem removida. O sistema voltou a usar o ícone padrão da categoria.',
      });
      return;
    }

    setOptimizingMarker(true);
    setMarkerStatus({ severity: 'info', message: 'Otimizando imagem...' });
    try {
      const result = await optimizeMapMarkerImage(newFile);
      setMarkerFile(result.file);
      setMarkerPreview(URL.createObjectURL(result.file));
      const attributes = clearMarker3dSelection(item.attributes);

      if (item?.id) {
        const marker = await uploadMapMarker(item.id, result.file);
        setItem({
          ...item,
          attributes: { ...attributes, [mapMarkerAttribute]: marker },
        });
        setMarkerStatus({
          severity: 'success',
          message: 'Imagem do marcador salva com sucesso.',
        });
      } else {
        setItem({ ...item, attributes });
        setMarkerStatus({
          severity: 'success',
          message: 'Imagem do marcador pronta para ser salva.',
        });
      }
    } catch {
      setMarkerFile(null);
      setMarkerPreview(null);
      setMarkerStatus({ severity: 'error', message: 'Erro ao processar imagem.' });
    } finally {
      setOptimizingMarker(false);
    }
  };

  const handleMarker3dSelection = (selection) => {
    setMarkerFile(null);
    if (markerPreview) {
      URL.revokeObjectURL(markerPreview);
    }
    setMarkerPreview(null);
    setItem({
      ...item,
      attributes: selectMarker3dConfiguration(removeMapMarkerImage(item.attributes), selection),
    });
    setMarkerStatus({
      severity: 'success',
      message: 'Ícone 3D selecionado. Clique em Salvar para aplicar ao dispositivo.',
    });
  };

  const saveAppearance = async (currentItem) => {
    const attributes = currentItem.attributes || {};
    const response = await fetchOrThrow(`/api/devices/${currentItem.id}/appearance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardImage: attributes.deviceImage || null,
        marker3d: attributes.mapMarker3d || null,
        mapMarker: attributes.mapMarker || null,
        markerCategory: attributes.mapMarker3dCategory || null,
        markerModel: attributes.mapMarker3dModel || null,
        markerColor: attributes.mapMarker3dColor || null,
      }),
    });
    await response.json();
    dispatch(devicesActions.update([currentItem]));
    return currentItem;
  };

  const handleRemoveMarker = () => {
    setMarkerFile(null);
    setMarkerPreview(null);
    setItem({
      ...item,
      attributes: clearMarker3dSelection(removeMapMarkerImage(item.attributes)),
    });
    setMarkerStatus({
      severity: 'success',
      message: 'Imagem removida. O sistema voltou a usar o ícone padrão da categoria.',
    });
  };

  const handleItemSaved = async (savedItem) => {
    let updatedItem = savedItem;
    if (markerFile && !item.id) {
      const marker = await uploadMapMarker(savedItem.id, markerFile);
      const response = await fetchOrThrow(`/api/devices/${savedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...savedItem,
          attributes: {
            ...clearMarker3dSelection(savedItem.attributes),
            [mapMarkerAttribute]: marker,
          },
        }),
      });
      updatedItem = await response.json();
    }
    dispatch(devicesActions.update([updatedItem]));
  };

  const validate = () =>
    item &&
    !technicalEditBlocked &&
    (appearanceOnly || (item.name && item.uniqueId)) &&
    !optimizingImage &&
    !optimizingMarker;

  return (
    <EditItemView
      endpoint="devices"
      item={item}
      setItem={setItem}
      validate={validate}
      onItemSaved={handleItemSaved}
      onSave={appearanceOnly ? saveAppearance : undefined}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedDevice']}
    >
      {item && (
        <>
          {technicalEditBlocked && (
            <Alert severity="info">
              A edição técnica deste dispositivo está bloqueada. Use a ação Personalizar veículo
              para alterar somente a aparência autorizada pelo seu Perfil de Acesso.
            </Alert>
          )}
          {!appearanceOnly && !technicalEditBlocked && (
            <>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">{t('sharedRequired')}</Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.details}>
                  <TextField
                    value={item.name || ''}
                    onChange={(event) => setItem({ ...item, name: event.target.value })}
                    label={t('sharedName')}
                  />
                  <TextField
                    value={item.uniqueId || ''}
                    onChange={(event) => setItem({ ...item, uniqueId: event.target.value })}
                    label={t('deviceIdentifier')}
                    helperText={t('deviceIdentifierHelp')}
                    disabled={Boolean(uniqueId)}
                  />
                </AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">{t('sharedExtra')}</Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.details}>
                  <SelectField
                    value={item.groupId}
                    onChange={(event) => setItem({ ...item, groupId: Number(event.target.value) })}
                    endpoint="/api/groups"
                    label={t('groupParent')}
                    disabled={!access.can('device.change-group')}
                  />
                  <TextField
                    value={item.phone || ''}
                    onChange={(event) => setItem({ ...item, phone: event.target.value })}
                    label={t('sharedPhone')}
                  />
                  <TextField
                    value={item.model || ''}
                    onChange={(event) => setItem({ ...item, model: event.target.value })}
                    label={t('deviceModel')}
                  />
                  <TextField
                    value={item.contact || ''}
                    onChange={(event) => setItem({ ...item, contact: event.target.value })}
                    label={t('deviceContact')}
                  />
                  <SelectField
                    value={item.category || 'default'}
                    onChange={(event) => setItem({ ...item, category: event.target.value })}
                    data={deviceCategories
                      .map((category) => ({
                        id: category,
                        name: t(`category${category.replace(/^\w/, (c) => c.toUpperCase())}`),
                      }))
                      .sort((a, b) => a.name.localeCompare(b.name))}
                    label={t('deviceCategory')}
                  />
                  <SelectField
                    value={item.calendarId}
                    onChange={(event) =>
                      setItem({ ...item, calendarId: Number(event.target.value) })
                    }
                    endpoint="/api/calendars"
                    label={t('sharedCalendar')}
                  />
                  <TextField
                    label={t('userExpirationTime')}
                    type="date"
                    value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'}
                    onChange={(e) => {
                      if (e.target.value) {
                        setItem({
                          ...item,
                          expirationTime: new Date(e.target.value).toISOString(),
                        });
                      }
                    }}
                    disabled={!manager}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.disabled}
                        onChange={(event) => setItem({ ...item, disabled: event.target.checked })}
                      />
                    }
                    label={t('sharedDisabled')}
                    disabled={!manager}
                  />
                  <Button variant="outlined" color="primary" onClick={() => setShowQr(true)}>
                    {t('sharedQrCode')}
                  </Button>
                </AccordionDetails>
              </Accordion>
            </>
          )}
          {canViewAppearance && item.id && access.can('device.appearance.card-image') && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Imagem do Card do Dispositivo</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <Typography variant="body2" color="textSecondary">
                  Esta imagem será exibida no card de informações do veículo no mapa.
                </Typography>
                <FileInput
                  placeholder={
                    deviceImageUrl ? 'Trocar imagem do card' : 'Selecionar imagem do card'
                  }
                  value={imageFile}
                  onChange={handleFileInput}
                  slotProps={{
                    htmlInput: {
                      accept: 'image/jpeg,image/png,image/gif,image/webp',
                      disabled: optimizingImage,
                    },
                  }}
                />
                {deviceImageUrl && (
                  <>
                    <Typography variant="caption" color="textSecondary" align="center">
                      Imagem cadastrada no card
                    </Typography>
                    <Box
                      component="img"
                      src={deviceImageUrl}
                      alt="Pré-visualização da imagem do card do dispositivo"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 120,
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        alignSelf: 'center',
                      }}
                    />
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setRemovingImage(true)}
                      disabled={optimizingImage}
                    >
                      Remover imagem do card
                    </Button>
                  </>
                )}
                {imageStatus && (
                  <Alert severity={imageStatus.severity} aria-live="polite">
                    {imageStatus.message}
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          )}
          {canViewAppearance &&
            (access.can('device.appearance.map-marker') ||
              access.can('device.appearance.marker3d') ||
              access.can('device.appearance.custom-upload')) && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Marcador do Mapa</Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.details}>
                  <Typography variant="body2" color="textSecondary">
                    Escolha categoria, modelo e cor, ou envie uma imagem personalizada. O marcador
                    acompanha a posição e gira conforme a direção do veículo.
                  </Typography>
                  {access.can('device.appearance.marker3d') && (
                    <DeviceMarker3dGallery
                      value={marker3dPreset}
                      onChange={handleMarker3dSelection}
                      disabled={optimizingMarker || !canManageMarker3d}
                      canChangeModel={access.can('device.appearance.marker-model')}
                      canChangeColor={access.can('device.appearance.marker-color')}
                    />
                  )}
                  {canManageCustomMarker && (
                    <>
                      <Divider>usar imagem personalizada</Divider>
                      <FileInput
                        placeholder="Enviar ícone personalizado"
                        value={markerFile}
                        onChange={handleMarkerInput}
                        slotProps={{
                          htmlInput: {
                            accept: 'image/jpeg,image/png,image/webp,image/svg+xml',
                            disabled: optimizingMarker,
                          },
                        }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        Formatos aceitos: PNG, WebP, SVG ou JPEG. A imagem será otimizada para o
                        mapa.
                      </Typography>
                    </>
                  )}
                  {activeCustomMarkerUrl && (
                    <>
                      <Typography variant="caption" color="textSecondary" align="center">
                        Pré-visualização do marcador personalizado
                      </Typography>
                      <Box
                        component="img"
                        src={activeCustomMarkerUrl}
                        alt="Pré-visualização do marcador do veículo"
                        sx={{
                          width: 80,
                          height: 80,
                          objectFit: 'contain',
                          alignSelf: 'center',
                        }}
                      />
                    </>
                  )}
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleRemoveMarker}
                    disabled={
                      !canRestoreMarker ||
                      (!markerFile &&
                        !item.attributes?.[mapMarkerAttribute] &&
                        !item.attributes?.[marker3dAttribute])
                    }
                  >
                    Restaurar ícone padrão da categoria
                  </Button>
                  {markerStatus && (
                    <Alert severity={markerStatus.severity} aria-live="polite">
                      {markerStatus.message}
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            )}
          {!appearanceOnly && !technicalEditBlocked && (
            <EditAttributesAccordion
              attributes={item.attributes}
              setAttributes={(attributes) => setItem({ ...item, attributes })}
              definitions={{ ...commonDeviceAttributes, ...deviceAttributes }}
            />
          )}
        </>
      )}
      <Snackbar
        open={removingImage}
        onClose={() => setRemovingImage(false)}
        message="Deseja remover a imagem do card deste dispositivo?"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" color="inherit" onClick={() => setRemovingImage(false)}>
              Cancelar
            </Button>
            <Button size="small" color="error" onClick={handleRemoveImage}>
              Remover
            </Button>
          </Box>
        }
      />
      <QrCodeDialog open={showQr} onClose={() => setShowQr(false)} />
    </EditItemView>
  );
};

export default DevicePage;
