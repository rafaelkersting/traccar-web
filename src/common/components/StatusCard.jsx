import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Menu,
  MenuItem,
  TableFooter,
  Link,
  Tooltip,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PendingIcon from '@mui/icons-material/Pending';
import HistoryIcon from '@mui/icons-material/History';
import SendIcon from '@mui/icons-material/Send';
import PaletteIcon from '@mui/icons-material/Palette';

import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import { useDeviceReadonly, useRestriction } from '../util/permissions';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import fetchOrThrow from '../util/fetchOrThrow';
import DeviceImage from './DeviceImage';
import { getDeviceImageUrl } from '../util/deviceImage';
import VehicleStatusActions from './VehicleStatusActions';
import { statusCardModes } from '../../store/mapUi';
import useAccessPermissions from '../util/useAccessPermissions';
import { defaultVehicleFollowMode } from '../../map/core/vehicleFollow';

const useStyles = makeStyles()((theme, { desktopPadding }) => ({
  card: {
    pointerEvents: 'auto',
    width: theme.dimensions.popupMaxWidth,
    maxWidth: `calc(100vw - ${theme.spacing(3)})`,
    borderRadius:
      theme.systemTheme.id === 'classic' ? undefined : theme.systemTheme.shape.cardRadius,
    boxShadow: theme.systemTheme.id === 'classic' ? undefined : theme.systemTheme.effects.shadow,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 36,
    padding: theme.spacing(1, 1, 0.75, 2),
    color: theme.palette.text.secondary,
    backgroundColor:
      theme.systemTheme.id === 'classic' ? undefined : theme.palette.background.paper,
  },
  title: {
    flex: 1,
    minWidth: 0,
    paddingRight: theme.spacing(1),
    overflowWrap: 'anywhere',
  },
  headerActions: {
    display: 'flex',
    flexShrink: 0,
  },
  media: {
    height: 88,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    padding: theme.spacing(0.5, 2, 1),
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
  },
  mediaImage: {
    display: 'block',
    width: 'auto',
    height: 'auto',
    maxWidth: 'calc(100% - 16px)',
    maxHeight: 76,
    objectFit: 'contain',
    objectPosition: 'center',
  },
  content: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    maxHeight: theme.dimensions.cardContentMaxHeight,
    overflow: 'auto',
  },
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  table: {
    '& .MuiTableCell-sizeSmall': {
      paddingLeft: 0,
      paddingRight: 0,
    },
    '& .MuiTableCell-sizeSmall:first-of-type': {
      paddingRight: theme.spacing(1),
    },
  },
  cell: {
    borderBottom: 'none',
  },
  actions: {
    justifyContent: 'space-between',
    borderTop:
      theme.systemTheme.id === 'classic' ? undefined : `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.systemTheme.id === 'classic' ? undefined : theme.palette.surface.main,
  },
  compactCard: {
    overflow: 'hidden',
  },
  compactContent: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    minHeight: 58,
    padding: `${theme.spacing(0.75)} ${theme.spacing(0.5)} ${theme.spacing(0.75)} ${theme.spacing(1)}`,
    '&:last-child': {
      paddingBottom: theme.spacing(0.75),
    },
  },
  compactImage: {
    width: 40,
    height: 40,
    flexShrink: 0,
    objectFit: 'contain',
  },
  compactFallback: {
    width: 40,
    height: 40,
    padding: theme.spacing(0.75),
    flexShrink: 0,
    borderRadius: '50%',
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  compactText: {
    flex: 1,
    minWidth: 0,
  },
  compactTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  compactMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: theme.palette.text.secondary,
  },
  followActive: {
    color: theme.palette.success.main,
  },
  closedButton: {
    pointerEvents: 'auto',
    width: 48,
    height: 48,
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    boxShadow: theme.shadows[4],
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  root: {
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 5,
    left: '50%',
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${desktopPadding} / 2)`,
      bottom: theme.spacing(3),
    },
    [theme.breakpoints.down('md')]: {
      left: '50%',
      bottom: `calc(${theme.spacing(3)} + ${theme.dimensions.bottomBarHeight}px + env(safe-area-inset-bottom, 0px))`,
    },
    transform: 'translateX(-50%)',
  },
}));

const StatusRow = ({ name, content }) => {
  const { classes } = useStyles({ desktopPadding: 0 });

  return (
    <TableRow>
      <TableCell className={classes.cell}>
        <Typography variant="body2">{name}</Typography>
      </TableCell>
      <TableCell className={classes.cell}>
        <Typography variant="body2" color="textSecondary">
          {content}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

const StatusCard = ({
  deviceId,
  position,
  onClose,
  onCollapse,
  onExpand,
  mode = statusCardModes.expanded,
  followActive = false,
  followMode = defaultVehicleFollowMode,
  disableActions,
  desktopPadding = 0,
}) => {
  const { classes } = useStyles({ desktopPadding });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const readonly = useRestriction('readonly');
  const deviceReadonly = useDeviceReadonly();
  const access = useAccessPermissions();

  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const user = useSelector((state) => state.session.user);
  const device = useSelector((state) => state.devices.items[deviceId]);

  const deviceImage = device?.attributes?.deviceImage;
  const deviceImageUrl = getDeviceImageUrl(device);

  const positionAttributes = usePositionAttributes(t);
  const positionItems = useAttributePreference(
    'positionItems',
    'fixTime,address,speed,totalDistance',
  );

  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');

  const [anchorEl, setAnchorEl] = useState(null);

  const [removing, setRemoving] = useState(false);

  const collapsed = mode === statusCardModes.collapsed;
  const closed = mode === statusCardModes.closed;
  const followLabel = followActive
    ? `Seguindo · ${followMode === 'heading' ? 'Direção para cima' : 'Norte para cima'}`
    : 'Acompanhamento pausado';

  const handleRemove = useCatch(async (removed) => {
    if (removed) {
      const response = await fetchOrThrow('/api/devices');
      dispatch(devicesActions.refresh(await response.json()));
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    const newItem = {
      name: t('sharedGeofence'),
      area: `CIRCLE (${position.latitude} ${position.longitude}, 50)`,
    };
    const response = await fetchOrThrow('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    const item = await response.json();
    await fetchOrThrow('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }),
    });
    navigate(`/settings/geofence/${item.id}`);
  }, [navigate, position, t]);

  return (
    <>
      <div className={classes.root}>
        {device && closed && onExpand && (
          <Tooltip title="Abrir detalhes do veículo">
            <IconButton
              className={classes.closedButton}
              aria-label="Abrir detalhes do veículo"
              onClick={onExpand}
            >
              <DirectionsCarIcon />
            </IconButton>
          </Tooltip>
        )}
        {device && !closed && (
          <Rnd
            default={{ x: 0, y: 0, width: 'auto', height: 'auto' }}
            enableResizing={false}
            dragHandleClassName="draggable-header"
            cancel=".status-card-no-drag"
            style={{ position: 'relative' }}
          >
            {collapsed ? (
              <Card elevation={3} className={`${classes.card} ${classes.compactCard}`}>
                <CardContent className={`${classes.compactContent} draggable-header`}>
                  {deviceImage ? (
                    <DeviceImage
                      src={deviceImageUrl}
                      className={classes.compactImage}
                      alt={`Imagem do veículo ${device.name}`}
                    />
                  ) : (
                    <DirectionsCarIcon className={classes.compactFallback} />
                  )}
                  <div className={classes.compactText}>
                    <Typography variant="body2" className={classes.compactTitle}>
                      {device.name}
                      {position && (
                        <>
                          {' · '}
                          <PositionValue position={position} property="speed" />
                        </>
                      )}
                    </Typography>
                    <Typography
                      variant="caption"
                      className={`${classes.compactMeta} ${followActive ? classes.followActive : ''}`}
                    >
                      <GpsFixedIcon fontSize="inherit" />
                      {followLabel}
                    </Typography>
                  </div>
                  <div className={classes.headerActions}>
                    <Tooltip title="Expandir detalhes do veículo">
                      <IconButton
                        className="status-card-no-drag"
                        size="small"
                        aria-label="Expandir detalhes do veículo"
                        onClick={onExpand}
                      >
                        <KeyboardArrowUpIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Fechar detalhes do veículo">
                      <IconButton
                        className="status-card-no-drag"
                        size="small"
                        aria-label="Fechar detalhes do veículo"
                        onClick={onClose}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card elevation={3} className={classes.card}>
                <div className="draggable-header">
                  <div className={classes.header}>
                    <Typography variant="body2" color="inherit" className={classes.title}>
                      {device.name}
                    </Typography>
                    <div className={classes.headerActions}>
                      {onCollapse && (
                        <Tooltip title="Minimizar detalhes do veículo">
                          <IconButton
                            className="status-card-no-drag"
                            size="small"
                            color="inherit"
                            aria-label="Minimizar detalhes do veículo"
                            onClick={onCollapse}
                          >
                            <KeyboardArrowDownIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Fechar detalhes do veículo">
                        <IconButton
                          className="status-card-no-drag"
                          size="small"
                          color="inherit"
                          aria-label="Fechar detalhes do veículo"
                          onClick={onClose}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                  {deviceImage && (
                    <div className={classes.media}>
                      <DeviceImage
                        src={deviceImageUrl}
                        className={classes.mediaImage}
                        alt={`Imagem do veículo ${device.name}`}
                      />
                    </div>
                  )}
                </div>
                {position && (
                  <CardContent className={classes.content}>
                    <Table size="small" className={classes.table}>
                      <TableBody>
                        {positionItems
                          .split(',')
                          .filter(
                            (key) =>
                              position.hasOwnProperty(key) ||
                              position.attributes.hasOwnProperty(key),
                          )
                          .map((key) => (
                            <StatusRow
                              key={key}
                              name={positionAttributes[key]?.name || key}
                              content={
                                <PositionValue
                                  position={position}
                                  property={position.hasOwnProperty(key) ? key : null}
                                  attribute={position.hasOwnProperty(key) ? null : key}
                                />
                              }
                            />
                          ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={2} className={classes.cell}>
                            <Typography variant="body2">
                              <Link component={RouterLink} to={`/position/${position.id}`}>
                                {t('sharedShowDetails')}
                              </Link>
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </CardContent>
                )}
                <CardActions className={classes.actions} disableSpacing>
                  <Tooltip title="Mais ações">
                    <IconButton
                      aria-label="Mais ações"
                      color="secondary"
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                      disabled={!position}
                    >
                      <PendingIcon />
                    </IconButton>
                  </Tooltip>
                  {!disableActions && (
                    <VehicleStatusActions device={device} position={position} variant="card" />
                  )}
                </CardActions>
              </Card>
            )}
          </Rnd>
        )}
      </div>
      {position && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          {access.can('map.history') && (
            <MenuItem onClick={() => navigate(`/replay?deviceId=${deviceId}`)}>
              <HistoryIcon fontSize="small" style={{ marginRight: 16 }} />
              Histórico
            </MenuItem>
          )}
          {access.can('command.send') && (
            <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/command`)}>
              <SendIcon fontSize="small" style={{ marginRight: 16 }} />
              Comandos adicionais
            </MenuItem>
          )}
          <MenuItem
            onClick={() => navigate(`/stream?deviceId=${deviceId}`)}
            disabled={position.protocol !== 'jt808'}
          >
            {t('linkLiveVideo')}
          </MenuItem>
          {!readonly && access.can('geofence.create') && (
            <MenuItem onClick={handleGeofence}>{t('sharedCreateGeofence')}</MenuItem>
          )}
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}`}
          >
            {t('linkGoogleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://maps.apple.com/?ll=${position.latitude},${position.longitude}`}
          >
            {t('linkAppleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}
          >
            {t('linkStreetView')}
          </MenuItem>
          {navigationAppTitle && navigationAppLink && (
            <MenuItem
              component="a"
              target="_blank"
              href={navigationAppLink
                .replace('{latitude}', position.latitude)
                .replace('{longitude}', position.longitude)}
            >
              {navigationAppTitle}
            </MenuItem>
          )}
          {!shareDisabled && !user.temporary && access.can('device.edit') && (
            <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/share`)}>
              <Typography color="secondary">{t('sharedShare')}</Typography>
            </MenuItem>
          )}
          {access.can('device.appearance.view') && (!access.legacy || !deviceReadonly) && (
            <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/appearance`)}>
              <PaletteIcon fontSize="small" style={{ marginRight: 16 }} />
              Personalizar veículo
            </MenuItem>
          )}
          {access.can('device.edit') && (
            <MenuItem
              onClick={() => navigate(`/settings/device/${deviceId}`)}
              disabled={disableActions || deviceReadonly}
            >
              <EditIcon fontSize="small" style={{ marginRight: 16 }} />
              {t('sharedEdit')}
            </MenuItem>
          )}
          {access.can('device.delete') && (
            <MenuItem onClick={() => setRemoving(true)} disabled={disableActions || deviceReadonly}>
              <DeleteIcon fontSize="small" style={{ marginRight: 16 }} />
              {t('sharedRemove')}
            </MenuItem>
          )}
        </Menu>
      )}
      <RemoveDialog
        open={removing}
        endpoint="devices"
        itemId={deviceId}
        onResult={(removed) => handleRemove(removed)}
      />
    </>
  );
};

export default StatusCard;
