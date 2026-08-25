import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultVehicleFollowMode,
  isValidFollowPosition,
  normalizeVehicleFollowMode,
  resolveBearingTarget,
  resolveFollowBearing,
  resolveFollowHeading,
  resolveFollowOffset,
  shortestCourseDelta,
  vehicleFollowModes,
} from '../src/map/core/vehicleFollow.js';

const movingPosition = (course) => ({ speed: 20, course, latitude: -28.28, longitude: -53.5 });

test('heading usa o menor caminho angular nos dois sentidos', () => {
  assert.equal(shortestCourseDelta(358, 2), 4);
  assert.equal(shortestCourseDelta(2, 358), -4);
  assert.equal(resolveBearingTarget(358, 2), 362);
  assert.equal(resolveBearingTarget(2, 358), -2);
});

test('normaliza as quatro direções cardeais', () => {
  assert.equal(resolveFollowHeading(null, movingPosition(0)), 0);
  assert.equal(resolveFollowHeading(null, movingPosition(90)), 90);
  assert.equal(resolveFollowHeading(null, movingPosition(180)), 180);
  assert.equal(resolveFollowHeading(null, movingPosition(270)), 270);
});

test('course inválido mantém o último heading confiável', () => {
  for (const course of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY, 'inválido']) {
    assert.equal(resolveFollowHeading(84, movingPosition(course)), 84);
  }
  assert.equal(resolveFollowHeading(null, movingPosition(undefined)), null);
});

test('veículo parado não altera o heading por jitter de GPS', () => {
  let heading = resolveFollowHeading(null, movingPosition(90));
  for (const course of [92, 183, 270]) {
    heading = resolveFollowHeading(heading, { ...movingPosition(course), speed: 0 });
  }
  assert.equal(heading, 90);
});

test('Norte mantém bearing zero e Heading Up acompanha o veículo sem rotação longa', () => {
  assert.equal(resolveFollowBearing(vehicleFollowModes.north, 92, 220), 0);
  assert.equal(resolveFollowBearing(vehicleFollowModes.heading, 358, 2), 362);
  assert.equal(resolveFollowBearing(vehicleFollowModes.heading, 20, null), null);
});

test('Heading Up é o padrão e a preferência Norte explícita continua válida', () => {
  assert.equal(defaultVehicleFollowMode, vehicleFollowModes.heading);
  assert.equal(normalizeVehicleFollowMode(undefined), vehicleFollowModes.heading);
  assert.equal(normalizeVehicleFollowMode('desconhecido'), vehicleFollowModes.heading);
  assert.equal(normalizeVehicleFollowMode(vehicleFollowModes.north), vehicleFollowModes.north);
});

test('offset Heading Up favorece a via à frente', () => {
  assert.deepEqual(resolveFollowOffset(vehicleFollowModes.north, 800, false), [0, 0]);
  assert.deepEqual(resolveFollowOffset(vehicleFollowModes.heading, 800, false), [0, 112]);
  assert.deepEqual(resolveFollowOffset(vehicleFollowModes.heading, 800, true), [0, 64]);
});

test('aceita somente coordenadas geográficas válidas para Follow', () => {
  assert.equal(isValidFollowPosition({ latitude: -28.28, longitude: -53.5 }), true);
  assert.equal(isValidFollowPosition({ latitude: 91, longitude: -53.5 }), false);
  assert.equal(isValidFollowPosition({ latitude: -28.28, longitude: 181 }), false);
  assert.equal(isValidFollowPosition({ latitude: null, longitude: -53.5 }), false);
});
