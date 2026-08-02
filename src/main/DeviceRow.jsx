import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  IconButton,
  Tooltip,
  Avatar,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Typography,
} from '@mui/material';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import Battery60Icon from '@mui/icons-material/Battery60';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import Battery20Icon from '@mui/icons-material/Battery20';
import BatteryCharging20Icon from '@mui/icons-material/BatteryCharging20';
import ErrorIcon from '@mui/icons-material/Error';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import PowerIcon from '@mui/icons-material/Power';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import {
  formatAlarm,
  formatPercentage,
  formatStatus,
  getStatusColor,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useAdministrator } from '../common/util/permissions';
import EngineIcon from '../resources/images/data/engine.svg?react';
import { useAttributePreference } from '../common/util/preferences';
import GeofencesValue from '../common/components/GeofencesValue';
import DriverValue from '../common/components/DriverValue';
import MotionBar from './components/MotionBar';
import { getDeviceImageUrl } from '../common/util/deviceImage';
import QuickDeviceActions from '../common/components/QuickDeviceActions';

dayjs.extend(relativeTime);

const useStyles = makeStyles()((theme) => ({
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  thumbnail: {
    width: 40,
    height: 40,
    objectFit: 'contain',
    objectPosition: 'center',
  },
  text: {
    minWidth: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  row: { display: 'flex', flexDirection: 'column', width: '100%' },
  item: {
    boxSizing: 'border-box',
    height: 'calc(100% - 6px)',
    margin: '3px 8px',
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
  },
  header: { display: 'flex', alignItems: 'center', minWidth: 0 },
  statusBar: { display: 'flex', alignItems: 'center', minHeight: 32, marginTop: 2 },
  indicators: { display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 },
  batteryText: {
    fontSize: '0.75rem',
    fontWeight: 'normal',
    lineHeight: '0.875rem',
  },
  success: {
    color: theme.palette.success.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  error: {
    color: theme.palette.error.main,
  },
  neutral: {
    color: theme.palette.neutral.main,
  },
  selected: {
    backgroundColor: theme.palette.action.selected,
  },
}));

const DeviceRow = ({ devices, index, style }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const admin = useAdministrator();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const [hovered, setHovered] = useState(false);

  const item = devices[index];
  const position = useSelector((state) => state.session.positions[item.id]);

  const devicePrimary = useAttributePreference('devicePrimary', 'name');
  const deviceSecondary = useAttributePreference('deviceSecondary', '');

  const resolveFieldValue = (field) => {
    if (field === 'geofenceIds') {
      const geofenceIds = position?.geofenceIds;
      return geofenceIds?.length ? <GeofencesValue geofenceIds={geofenceIds} /> : null;
    }
    if (field === 'driverUniqueId') {
      const driverUniqueId = position?.attributes?.driverUniqueId;
      return driverUniqueId ? <DriverValue driverUniqueId={driverUniqueId} /> : null;
    }
    if (field === 'motion') {
      return <MotionBar deviceId={item.id} />;
    }
    return item[field];
  };

  const primaryValue = resolveFieldValue(devicePrimary);
  const secondaryValue = resolveFieldValue(deviceSecondary);
  const deviceImageUrl = getDeviceImageUrl(item);
  const expanded = selectedDeviceId === item.id || hovered;
  const fuel = position?.attributes?.fuel;
  const rawBattery = position?.attributes?.batteryLevel ?? position?.attributes?.battery;
  const battery = Number.isFinite(Number(rawBattery))
    ? Number(rawBattery) <= 1
      ? Number(rawBattery) * 100
      : Number(rawBattery)
    : null;
  const externalPower = position?.attributes?.externalPower ?? position?.attributes?.power;
  const age =
    item.status === 'online' || !item.lastUpdate
      ? ''
      : ` — última informação ${dayjs(item.lastUpdate).fromNow()}`;

  const secondaryText = () => {
    let status;
    if (item.status === 'online' || !item.lastUpdate) {
      status = formatStatus(item.status, t);
    } else {
      status = dayjs(item.lastUpdate).fromNow();
    }
    return (
      <>
        {secondaryValue && (
          <>
            {secondaryValue}
            {' • '}
          </>
        )}
        <span className={classes[getStatusColor(item.status)]}>{status}</span>
      </>
    );
  };

  return (
    <div style={style}>
      <ListItemButton
        key={item.id}
        onClick={() => dispatch(devicesActions.selectId(item.id))}
        disabled={!admin && item.disabled}
        selected={selectedDeviceId === item.id}
        className={`${classes.item} ${selectedDeviceId === item.id ? classes.selected : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className={classes.row}>
          <div className={classes.header}>
            <ListItemAvatar>
              <Avatar>
                <img
                  className={deviceImageUrl ? classes.thumbnail : classes.icon}
                  src={deviceImageUrl || mapIcons[mapIconKey(item.category)]}
                  alt={deviceImageUrl ? `Imagem de ${item.name}` : ''}
                />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              className={classes.text}
              primary={primaryValue}
              secondary={secondaryText()}
              slots={{
                primary: Typography,
                secondary: Typography,
              }}
              slotProps={{
                primary: { noWrap: true },
                secondary: { noWrap: true },
              }}
            />
          </div>
          <div className={classes.statusBar}>
            <div className={classes.indicators}>
              {position && (
                <>
                  <Tooltip
                    title={
                      fuel === undefined
                        ? 'Combustível: não informado'
                        : `Combustível: ${formatPercentage(fuel)}${age}`
                    }
                  >
                    <IconButton size="small" aria-label="Nível de combustível">
                      <LocalGasStationIcon
                        fontSize="small"
                        className={
                          fuel === undefined
                            ? classes.neutral
                            : fuel <= 20
                              ? classes.error
                              : classes.warning
                        }
                      />
                    </IconButton>
                  </Tooltip>
                  {position.attributes.hasOwnProperty('alarm') && (
                    <Tooltip
                      title={`${t('eventAlarm')}: ${formatAlarm(position.attributes.alarm, t)}`}
                    >
                      <IconButton size="small" aria-label="Ignição">
                        <ErrorIcon fontSize="small" className={classes.error} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {position.attributes.hasOwnProperty('ignition') && (
                    <Tooltip
                      title={`Ignição: ${position.attributes.ignition ? 'ligada' : 'desligada'}${age}`}
                    >
                      <IconButton size="small" aria-label="Ignição">
                        {position.attributes.ignition ? (
                          <EngineIcon width={20} height={20} className={classes.success} />
                        ) : (
                          <PowerIcon fontSize="small" className={classes.error} />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip
                    title={
                      battery === null
                        ? 'Bateria do rastreador: não informada'
                        : `Bateria do rastreador: ${formatPercentage(battery)}${age}`
                    }
                  >
                    <IconButton size="small" aria-label="Bateria do rastreador">
                      {battery === null ? (
                        <Battery20Icon fontSize="small" className={classes.neutral} />
                      ) : battery > 50 ? (
                        <BatteryFullIcon fontSize="small" className={classes.success} />
                      ) : battery >= 20 ? (
                        <Battery60Icon fontSize="small" className={classes.warning} />
                      ) : (
                        <Battery20Icon fontSize="small" className={classes.error} />
                      )}
                      <Typography className={classes.batteryText}>
                        {battery === null ? '—' : `${Math.round(battery)}%`}
                      </Typography>
                    </IconButton>
                  </Tooltip>
                  {(externalPower !== undefined ||
                    position.attributes.hasOwnProperty('charge')) && (
                    <Tooltip
                      title={`Alimentação externa: ${externalPower || position.attributes.charge ? 'conectada' : 'desconectada'}${age}`}
                    >
                      <IconButton size="small" aria-label="Alimentação externa">
                        <PowerIcon
                          fontSize="small"
                          className={
                            externalPower || position.attributes.charge
                              ? classes.success
                              : classes.error
                          }
                        />
                      </IconButton>
                    </Tooltip>
                  )}
                  {false && (
                    <Tooltip
                      title={`${t('positionBatteryLevel')}: ${formatPercentage(position.attributes.batteryLevel)}`}
                    >
                      <IconButton size="small" disabled>
                        {(position.attributes.batteryLevel > 70 &&
                          (position.attributes.charge ? (
                            <BatteryChargingFullIcon fontSize="small" className={classes.success} />
                          ) : (
                            <BatteryFullIcon fontSize="small" className={classes.success} />
                          ))) ||
                          (position.attributes.batteryLevel > 30 &&
                            (position.attributes.charge ? (
                              <BatteryCharging60Icon fontSize="small" className={classes.warning} />
                            ) : (
                              <Battery60Icon fontSize="small" className={classes.warning} />
                            ))) ||
                          (position.attributes.charge ? (
                            <BatteryCharging20Icon fontSize="small" className={classes.error} />
                          ) : (
                            <Battery20Icon fontSize="small" className={classes.error} />
                          ))}
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}
            </div>
            <div className={classes.actions}>
              <QuickDeviceActions device={item} position={position} expanded={expanded} />
            </div>
          </div>
        </div>
      </ListItemButton>
    </div>
  );
};

export default DeviceRow;
