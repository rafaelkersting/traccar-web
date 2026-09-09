import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBatteryReading,
  formatExternalPowerReading,
  getBatteryReading,
  getExternalPowerReading,
  isTelemetryReadingExpired,
  isTelemetryReadingCurrent,
  mergeVehicleTelemetry,
  normalizePercentage,
} from '../src/common/util/vehicleTelemetry.js';

const position = (
  id,
  attributes,
  serverTime = `2026-08-20T12:${String(id % 60).padStart(2, '0')}:00.000Z`,
) => ({
  id,
  deviceId: 2,
  serverTime,
  attributes,
});

test('normaliza somente batteryLevel como porcentagem', () => {
  assert.equal(normalizePercentage(0.85), 85);
  assert.equal(normalizePercentage(85), 85);
  assert.equal(normalizePercentage(undefined), null);
  assert.equal(normalizePercentage(null), null);
  assert.equal(normalizePercentage(''), null);
  assert.equal(normalizePercentage('   '), null);
  assert.equal(normalizePercentage(Number.NaN), null);
  assert.equal(normalizePercentage(120), null);
});

test('mantém zero explícito quando a leitura não é contraditória', () => {
  const reading = getBatteryReading(position(1, { batteryLevel: 0, charge: false }));

  assert.deepEqual({ kind: reading.kind, value: reading.value }, { kind: 'percentage', value: 0 });
});

test('ignora zero ambíguo do HJ169 quando a alimentação externa está conectada', () => {
  assert.equal(getBatteryReading(position(1, { batteryLevel: 0, charge: true })), null);
});

test('prefere tensão interna válida quando percentual zero é ambíguo', () => {
  const reading = getBatteryReading(position(1, { batteryLevel: 0, battery: 3.92, charge: true }));

  assert.deepEqual({ kind: reading.kind, value: reading.value }, { kind: 'voltage', value: 3.92 });
});

test('prioriza batteryLevel e preserva battery como tensão', () => {
  const percentage = getBatteryReading(position(1, { batteryLevel: 95, battery: 3.96 }));
  const voltage = getBatteryReading(position(2, { battery: 3.96 }));

  assert.deepEqual(
    { kind: percentage.kind, value: percentage.value },
    { kind: 'percentage', value: 95 },
  );
  assert.deepEqual({ kind: voltage.kind, value: voltage.value }, { kind: 'voltage', value: 3.96 });
  assert.equal(formatBatteryReading(percentage), '95%');
  assert.equal(formatBatteryReading(voltage), '3,96 V');
});

test('não interpreta charge como porcentagem de bateria', () => {
  assert.equal(getBatteryReading(position(1, { charge: true })), null);
  assert.equal(getBatteryReading(position(1, { charge: false })), null);
});

test('usa charge como estado confiável de alimentação externa do J16', () => {
  const connected = getExternalPowerReading(position(1, { charge: true }));
  const disconnected = getExternalPowerReading(position(2, { charge: false }));

  assert.equal(formatExternalPowerReading(connected), 'conectada');
  assert.equal(formatExternalPowerReading(disconnected), 'desconectada');
});

test('exibe tensão externa sem convertê-la em estado arbitrário', () => {
  const reading = getExternalPowerReading(position(1, { power: 12.74 }));
  assert.deepEqual({ kind: reading.kind, value: reading.value }, { kind: 'voltage', value: 12.74 });
  assert.equal(formatExternalPowerReading(reading), '12,74 V');
});

test('não apresenta valor bruto implausível como tensão externa', () => {
  assert.equal(getExternalPowerReading(position(1, { power: 0.28 })), null);
  assert.equal(
    formatExternalPowerReading(getExternalPowerReading(position(2, { power: 0.28, charge: true }))),
    'conectada',
  );
});

test('mantém a última telemetria válida quando o pacote GPS seguinte omite os campos', () => {
  const statusPosition = position(19, { batteryLevel: 100, charge: false });
  const gpsPosition = position(20, { type: 18 });
  const stored = mergeVehicleTelemetry({}, statusPosition);
  const preserved = mergeVehicleTelemetry(stored, gpsPosition);

  assert.equal(preserved, stored);
  assert.equal(formatBatteryReading(preserved.battery), '100%');
  assert.equal(formatExternalPowerReading(preserved.externalPower), 'desconectada');
  assert.equal(isTelemetryReadingCurrent(preserved.battery, statusPosition), true);
  assert.equal(isTelemetryReadingCurrent(preserved.battery, gpsPosition), false);
});

test('mantém ausência explícita quando nunca houve leitura válida', () => {
  const telemetry = mergeVehicleTelemetry({}, position(1, { type: 18 }));
  assert.deepEqual(telemetry, {});
  assert.equal(formatBatteryReading(telemetry.battery), null);
  assert.equal(formatExternalPowerReading(telemetry.externalPower), null);
});

test('expira a última leitura após a janela de confiança', () => {
  const timestamp = '2026-08-20T12:00:00.000Z';
  const stored = mergeVehicleTelemetry(
    {},
    position(1, { batteryLevel: 80, charge: true }, timestamp),
    Date.parse(timestamp),
  );
  const withinWindow = mergeVehicleTelemetry(
    stored,
    position(2, { type: 18 }, '2026-08-20T12:10:00.000Z'),
    Date.parse('2026-08-20T12:10:00.000Z'),
  );
  const expired = mergeVehicleTelemetry(
    withinWindow,
    position(3, { type: 18 }, '2026-08-20T12:31:00.000Z'),
    Date.parse('2026-08-20T12:31:00.000Z'),
  );

  assert.equal(formatBatteryReading(withinWindow.battery), '80%');
  assert.equal(formatBatteryReading(expired.battery), null);
  assert.equal(
    isTelemetryReadingExpired(stored.battery, Date.parse('2026-08-20T12:31:00.000Z')),
    true,
  );
});

test('fixture HJ169 preserva alimentação e não cria bateria falsa', () => {
  const heartbeat = position(19, {
    type: 19,
    status: 4,
    ignition: false,
    charge: true,
    batteryLevel: 0,
    motion: false,
  });
  const gps = position(20, { type: 18, motion: true });
  const heartbeatTelemetry = mergeVehicleTelemetry({}, heartbeat);
  const gpsTelemetry = mergeVehicleTelemetry(heartbeatTelemetry, gps);

  assert.equal(heartbeatTelemetry.battery, undefined);
  assert.equal(formatExternalPowerReading(heartbeatTelemetry.externalPower), 'conectada');
  assert.equal(gpsTelemetry, heartbeatTelemetry);
});

test('fixture J16 mantém percentual, carga e pacote GPS intermitente', () => {
  const heartbeat = position(19, {
    type: 19,
    ignition: false,
    charge: true,
    batteryLevel: 100,
    motion: false,
  });
  const gps = position(20, { type: 18, motion: false });
  const heartbeatTelemetry = mergeVehicleTelemetry({}, heartbeat);
  const gpsTelemetry = mergeVehicleTelemetry(heartbeatTelemetry, gps);

  assert.equal(formatBatteryReading(heartbeatTelemetry.battery), '100%');
  assert.equal(formatExternalPowerReading(heartbeatTelemetry.externalPower), 'conectada');
  assert.equal(gpsTelemetry, heartbeatTelemetry);
});

test('sequência intermitente preserva e depois atualiza a bateria válida', () => {
  const first = position(1, { batteryLevel: 80, charge: false });
  const omittedOnce = position(2, { type: 18 });
  const omittedTwice = position(3, { type: 18 });
  const updated = position(4, { batteryLevel: 79, charge: false });

  const telemetry80 = mergeVehicleTelemetry({}, first);
  const preservedOnce = mergeVehicleTelemetry(telemetry80, omittedOnce);
  const preservedTwice = mergeVehicleTelemetry(preservedOnce, omittedTwice);
  const telemetry79 = mergeVehicleTelemetry(preservedTwice, updated);

  assert.equal(formatBatteryReading(telemetry80.battery), '80%');
  assert.equal(formatBatteryReading(preservedOnce.battery), '80%');
  assert.equal(formatBatteryReading(preservedTwice.battery), '80%');
  assert.equal(formatBatteryReading(telemetry79.battery), '79%');
});
