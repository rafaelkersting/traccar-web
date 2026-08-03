import { Box, Tooltip, Typography } from '@mui/material';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import PowerIcon from '@mui/icons-material/Power';
import CellTowerIcon from '@mui/icons-material/CellTower';
import dayjs from 'dayjs';
import QuickDeviceActions from './QuickDeviceActions';

const normalizePercentage = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return null;
  }
  const normalized = number <= 1 ? number * 100 : number;
  return normalized <= 100 ? Math.round(normalized) : null;
};

const hasValue = (value) => value !== undefined && value !== null && value !== '';

const getBooleanAttribute = (...values) => {
  const value = values.find((candidate) => hasValue(candidate));
  if (value === undefined) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value > 0;
  }
  const normalized = String(value).toLowerCase();
  if (['true', '1', 'on', 'yes', 'connected', 'ligada', 'conectada'].includes(normalized)) {
    return true;
  }
  if (
    ['false', '0', 'off', 'no', 'disconnected', 'desligada', 'desconectada'].includes(normalized)
  ) {
    return false;
  }
  return null;
};

const getBatteryColor = (value) => {
  if (value === null) {
    return 'disabled';
  }
  if (value < 20) {
    return 'error';
  }
  if (value <= 50) {
    return 'warning';
  }
  return 'success';
};

const getFuelColor = (value) => {
  if (value === null) {
    return 'disabled';
  }
  return value <= 20 ? 'error' : 'warning';
};

const getAgeText = (device) => {
  if (device?.status === 'online' || !device?.lastUpdate) {
    return '';
  }
  return ` — última informação recebida ${dayjs(device.lastUpdate).fromNow()}`;
};

const VehicleStatusActions = ({ device, position, variant = 'list', expanded = false }) => {
  const attributes = position?.attributes || {};
  const ageText = getAgeText(device);
  const battery = normalizePercentage(
    attributes.batteryLevel ?? attributes.battery ?? attributes.charge,
  );
  const fuel = normalizePercentage(attributes.fuel ?? attributes.fuelLevel);
  const ignition = getBooleanAttribute(attributes.ignition);
  const externalPower = getBooleanAttribute(attributes.externalPower, attributes.power);
  const gpsConnected = Boolean(position);
  const compact = variant === 'list';

  const indicator = (title, icon, value = null) => (
    <Tooltip title={title}>
      <Box
        component="span"
        tabIndex={0}
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.25,
          minWidth: 0,
          color: 'text.secondary',
          outline: 'none',
        }}
      >
        {icon}
        {value !== null && (
          <Typography variant="caption" sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
            {value}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0.5 : 0.75,
        minWidth: 0,
        width: '100%',
      }}
    >
      {indicator(
        fuel === null ? 'Combustível: não informado' : `Combustível: ${fuel}%${ageText}`,
        <LocalGasStationIcon fontSize="small" color={getFuelColor(fuel)} />,
      )}
      {indicator(
        battery === null
          ? 'Bateria do rastreador: não informada'
          : `Bateria do rastreador: ${battery}%${ageText}`,
        <BatteryFullIcon fontSize="small" color={getBatteryColor(battery)} />,
        battery === null ? '—' : `${battery}%`,
      )}
      {indicator(
        ignition === null
          ? 'Ignição: não informada'
          : `Ignição: ${ignition ? 'ligada' : 'desligada'}${ageText}`,
        <PowerIcon
          fontSize="small"
          color={ignition === null ? 'disabled' : ignition ? 'success' : 'error'}
        />,
      )}
      {externalPower !== null &&
        indicator(
          `Alimentação externa: ${externalPower ? 'conectada' : 'desconectada'}${ageText}`,
          <PowerIcon fontSize="small" color={externalPower ? 'success' : 'error'} />,
        )}
      {indicator(
        `Sinal GPS: ${gpsConnected ? 'conectado' : 'desconectado'}${ageText}`,
        <CellTowerIcon fontSize="small" color={gpsConnected ? 'primary' : 'error'} />,
      )}
      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <QuickDeviceActions
          device={device}
          position={position}
          expanded={expanded}
          card={variant === 'card'}
          showMore={variant !== 'card'}
        />
      </Box>
    </Box>
  );
};

export default VehicleStatusActions;
