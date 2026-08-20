import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBatteryReading,
  formatExternalPowerReading,
  getBatteryReading,
  getExternalPowerReading,
  isTelemetryReadingCurrent,
  mergeVehicleTelemetry,
  normalizePercentage,
} from '../src/common/util/vehicleTelemetry.js';

const position = (id, attributes, serverTime = `2026-08-15T19:0${id}:00.000Z`) => ({
  id,
  deviceId: 2,
  serverTime,
  attributes,
});

test('normaliza somente batteryLevel como porcentagem', () => {
  assert.equal(normalizePercentage(0.85), 85);
  assert.equal(normalizePercentage(85), 85);
  assert.equal(normalizePercentage(undefined), null);
  assert.equal(normalizePercentage(120), null);
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
