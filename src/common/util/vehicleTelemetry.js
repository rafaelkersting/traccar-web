const hasValue = (value) => value !== undefined && value !== null && value !== '';

const normalizeBoolean = (value) => {
  if (!hasValue(value)) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value > 0;
  }
  const normalized = String(value).trim().toLowerCase();
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

export const normalizePercentage = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return null;
  }
  const normalized = number <= 1 ? number * 100 : number;
  return normalized <= 100 ? Math.round(normalized) : null;
};

const normalizeVoltage = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const readingMetadata = (position) => ({
  positionId: position.id,
  timestamp: position.serverTime || position.deviceTime || position.fixTime || null,
});

export const getBatteryReading = (position) => {
  const attributes = position?.attributes || {};
  const batteryLevel = normalizePercentage(attributes.batteryLevel);
  if (batteryLevel !== null) {
    return { kind: 'percentage', value: batteryLevel, ...readingMetadata(position) };
  }
  const batteryVoltage = normalizeVoltage(attributes.battery);
  if (batteryVoltage !== null) {
    return { kind: 'voltage', value: batteryVoltage, ...readingMetadata(position) };
  }
  return null;
};

export const getExternalPowerReading = (position) => {
  const attributes = position?.attributes || {};
  const state = normalizeBoolean(attributes.externalPower ?? attributes.charge);
  if (state !== null) {
    return { kind: 'state', value: state, ...readingMetadata(position) };
  }
  const voltage = normalizeVoltage(attributes.power);
  if (voltage !== null) {
    return { kind: 'voltage', value: voltage, ...readingMetadata(position) };
  }
  return null;
};

const sameReading = (first, second) =>
  first?.kind === second?.kind &&
  first?.value === second?.value &&
  first?.positionId === second?.positionId &&
  first?.timestamp === second?.timestamp;

export const mergeVehicleTelemetry = (previous = {}, position) => {
  const battery = getBatteryReading(position);
  const externalPower = getExternalPowerReading(position);
  if (
    (!battery || sameReading(previous.battery, battery)) &&
    (!externalPower || sameReading(previous.externalPower, externalPower))
  ) {
    return previous;
  }
  return {
    ...previous,
    ...(battery && { battery }),
    ...(externalPower && { externalPower }),
  };
};

export const isTelemetryReadingCurrent = (reading, position) =>
  Boolean(
    reading &&
    position &&
    ((reading.positionId && reading.positionId === position.id) ||
      (!reading.positionId &&
        reading.timestamp &&
        reading.timestamp ===
          (position.serverTime || position.deviceTime || position.fixTime || null))),
  );

const voltageFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatBatteryReading = (reading) => {
  if (!reading) {
    return null;
  }
  return reading.kind === 'percentage'
    ? `${reading.value}%`
    : `${voltageFormatter.format(reading.value)} V`;
};

export const formatExternalPowerReading = (reading) => {
  if (!reading) {
    return null;
  }
  if (reading.kind === 'state') {
    return reading.value ? 'conectada' : 'desconectada';
  }
  return `${voltageFormatter.format(reading.value)} V`;
};
