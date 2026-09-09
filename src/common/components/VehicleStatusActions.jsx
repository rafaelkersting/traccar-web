import { Box, Tooltip, Typography } from '@mui/material';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import PowerIcon from '@mui/icons-material/Power';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import CellTowerIcon from '@mui/icons-material/CellTower';
import dayjs from 'dayjs';
import QuickDeviceActions from './QuickDeviceActions';
import useVehicleTelemetry from '../util/useVehicleTelemetry';
import {
  formatBatteryReading,
  formatExternalPowerReading,
  isTelemetryReadingCurrent,
  normalizePercentage,
} from '../util/vehicleTelemetry';

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
  const telemetry = useVehicleTelemetry(device.id, position);
  const battery = telemetry.battery;
  const batteryValue = formatBatteryReading(battery);
  const batteryAge =
    battery && !isTelemetryReadingCurrent(battery, position) && battery.timestamp
      ? ` — última leitura ${dayjs(battery.timestamp).fromNow()}`
      : '';
  const fuel = normalizePercentage(attributes.fuel ?? attributes.fuelLevel);
  const ignition = getBooleanAttribute(attributes.ignition);
  const externalPower = telemetry.externalPower;
  const externalPowerValue = formatExternalPowerReading(externalPower);
  const externalPowerAge =
    externalPower && !isTelemetryReadingCurrent(externalPower, position) && externalPower.timestamp
      ? ` — última leitura ${dayjs(externalPower.timestamp).fromNow()}`
      : '';
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
        batteryValue === null
          ? 'Bateria do rastreador: não informada'
          : `Bateria do rastreador: ${batteryValue}${batteryAge}`,
        <BatteryFullIcon
          fontSize="small"
          color={battery?.kind === 'percentage' ? getBatteryColor(battery.value) : 'primary'}
        />,
        batteryValue || '—',
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
      {indicator(
        externalPowerValue === null
          ? 'Alimentação externa: não informada'
          : `Alimentação externa: ${externalPowerValue}${externalPowerAge}`,
        <ElectricalServicesIcon
          fontSize="small"
          color={
            externalPower?.kind === 'state'
              ? externalPower.value
                ? 'success'
                : 'error'
              : externalPower
                ? 'primary'
                : 'disabled'
          }
        />,
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
