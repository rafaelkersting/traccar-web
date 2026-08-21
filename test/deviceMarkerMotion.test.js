import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMarkerTransition,
  interpolateCourse,
  isPositionMoving,
  isRotatableVehicleMarker,
  resolveAnimationDuration,
  resolveMarkerMotionState,
  resolveStableCourse,
  sampleMarkerTransition,
} from '../src/map/core/deviceMarkerMotion.js';

const position = (overrides = {}) => ({
  id: 1,
  latitude: -28.28,
  longitude: -53.5,
  speed: 0,
  course: 0,
  fixTime: '2026-08-21T12:00:00.000Z',
  ...overrides,
});

test('considera parado até 3 km/h e movimento acima do limite', () => {
  assert.equal(isPositionMoving(position({ speed: 3 / 1.852 })), false);
  assert.equal(isPositionMoving(position({ speed: 3.1 / 1.852 })), true);
});

test('mantém a última direção válida enquanto o veículo está parado', () => {
  assert.equal(resolveStableCourse(84, position({ speed: 0, course: 271 })), 84);
  assert.equal(resolveStableCourse(null, position({ speed: 0, course: 271 })), 271);
  assert.equal(resolveStableCourse(84, position({ speed: 12, course: 92 })), 92);
});

test('interpola a rotação pelo caminho angular mais curto', () => {
  assert.equal(interpolateCourse(350, 10, 0.5), 0);
  assert.equal(interpolateCourse(10, 350, 0.5), 0);
});

test('diferencia movimento, parada e dispositivo fora de comunicação', () => {
  assert.equal(resolveMarkerMotionState('online', position({ speed: 10 })), 'moving');
  assert.equal(resolveMarkerMotionState('online', position({ speed: 0 })), 'stopped');
  assert.equal(resolveMarkerMotionState('offline', position({ speed: 10 })), 'offline');
  assert.equal(resolveMarkerMotionState('unknown', position({ speed: 10 })), 'offline');
});

test('usa o intervalo das posições para uma animação suave e limitada', () => {
  const previous = position();
  const next = position({
    id: 2,
    longitude: -53.4999,
    fixTime: '2026-08-21T12:00:03.000Z',
  });
  assert.equal(resolveAnimationDuration(previous, next), 2400);
  assert.equal(
    resolveAnimationDuration(
      previous,
      position({ id: 3, longitude: -53.4999, fixTime: '2026-08-21T12:10:00.000Z' }),
    ),
    0,
  );
});

test('não anima saltos geográficos incompatíveis com movimento normal', () => {
  assert.equal(
    resolveAnimationDuration(
      position(),
      position({
        id: 2,
        latitude: -27,
        longitude: -52,
        fixTime: '2026-08-21T12:00:03.000Z',
      }),
    ),
    0,
  );
});

test('interpola posição e direção com aceleração e desaceleração suaves', () => {
  const transition = {
    source: { longitude: 0, latitude: 0 },
    target: { longitude: 10, latitude: 20 },
    sourceCourse: 350,
    targetCourse: 10,
    startedAt: 1000,
    duration: 1000,
  };
  assert.deepEqual(sampleMarkerTransition(transition, 1500), {
    longitude: 5,
    latitude: 10,
    course: 0,
    complete: false,
  });
  assert.equal(sampleMarkerTransition(transition, 2000).complete, true);
});

test('nova posição parte do ponto atualmente animado e preserva curso parado', () => {
  const previousPosition = position({ speed: 10, course: 90 });
  const previous = createMarkerTransition({
    previous: null,
    previousPosition: null,
    position: previousPosition,
    deviceStatus: 'online',
    timestamp: 0,
    animate: true,
  });
  const next = createMarkerTransition({
    previous,
    previousPosition,
    position: position({
      id: 2,
      longitude: -53.4999,
      speed: 0,
      course: 240,
      fixTime: '2026-08-21T12:00:03.000Z',
    }),
    deviceStatus: 'online',
    timestamp: 100,
    animate: true,
  });
  assert.equal(next.targetCourse, 90);
  assert.equal(next.markerState, 'stopped');
  assert.equal(next.duration, 2400);
});

test('gira categorias veiculares e qualquer marcador personalizado', () => {
  assert.equal(isRotatableVehicleMarker('car'), true);
  assert.equal(isRotatableVehicleMarker('truck'), true);
  assert.equal(isRotatableVehicleMarker('person'), false);
  assert.equal(isRotatableVehicleMarker('person', true), true);
});
