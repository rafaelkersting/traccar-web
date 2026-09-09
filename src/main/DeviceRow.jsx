import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { Avatar, ListItemAvatar, ListItemText, ListItemButton, Typography } from '@mui/material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import { formatStatus, getStatusColor } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useAdministrator } from '../common/util/permissions';
import { useAttributePreference } from '../common/util/preferences';
import GeofencesValue from '../common/components/GeofencesValue';
import DriverValue from '../common/components/DriverValue';
import MotionBar from './components/MotionBar';
import { getDeviceImageUrl } from '../common/util/deviceImage';
import VehicleStatusActions from '../common/components/VehicleStatusActions';
import DeviceImage from '../common/components/DeviceImage';

dayjs.extend(relativeTime);

const useStyles = makeStyles()((theme) => ({
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  thumbnail: {
    display: 'block',
    width: 36,
    height: 36,
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
                {deviceImageUrl ? (
                  <DeviceImage
                    className={classes.thumbnail}
                    src={deviceImageUrl}
                    alt={`Imagem de ${item.name}`}
                  />
                ) : (
                  <img className={classes.icon} src={mapIcons[mapIconKey(item.category)]} alt="" />
                )}
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
            <VehicleStatusActions
              device={item}
              position={position}
              variant="list"
              expanded={expanded}
            />
          </div>
        </div>
      </ListItemButton>
    </div>
  );
};

export default DeviceRow;
