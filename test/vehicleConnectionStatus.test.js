import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GPS_FIX_MAX_AGE,
  getDeviceCommunicationState,
  getGpsFixState,
} from '../src/common/util/vehicleConnectionStatus.js';
import { devicesActions, devicesReducer } from '../src/store/devices.js';

const now = Date.parse('2026-09-16T12:00:00.000Z');

const position = ({ minutesAgo = 1, valid = true, serverTime } = {}) => ({
  id: 1,
  deviceId: 3,
  valid,
  fixTime: new Date(now - minutesAgo * 60 * 1000).toISOString(),
  serverTime: serverTime || new Date(now).toISOString(),
});

const websocketCommunicationStates = (statuses) => {
  let state = devicesReducer(undefined, { type: 'test/init' });
  return statuses.map((status) => {
    state = devicesReducer(state, devicesActions.update([{ id: 3, status }]));
    return getDeviceCommunicationState(state.items[3]);
  });
};

test('reflete transição WebSocket online → offline → online sem depender da posição', () => {
  const states = websocketCommunicationStates(['online', 'offline', 'online']);

  assert.deepEqual(states, ['online', 'offline', 'online']);
  assert.equal(getGpsFixState(position(), now), 'connected');
});

test('reflete transição WebSocket online → unknown → online como sem comunicação', () => {
  const states = websocketCommunicationStates(['online', 'unknown', 'online']);

  assert.deepEqual(states, ['online', 'unknown', 'online']);
});

test('não considera heartbeat recente como fix GPS recente', () => {
  const stalePosition = position({
    minutesAgo: 11,
    serverTime: new Date(now).toISOString(),
  });

  assert.equal(getGpsFixState(stalePosition, now), 'stale');
});

test('aceita somente posição recente e válida como GPS conectado', () => {
  assert.equal(getGpsFixState(position({ minutesAgo: 1, valid: true }), now), 'connected');
  assert.equal(getGpsFixState(position({ minutesAgo: 1, valid: false }), now), 'invalid');
  assert.equal(getGpsFixState(position({ minutesAgo: 11, valid: true }), now), 'stale');
});

test('trata ausência de posição ou fixTime como GPS sem dados', () => {
  assert.equal(getGpsFixState(null, now), 'noData');
  assert.equal(
    getGpsFixState({ valid: true, serverTime: new Date(now).toISOString() }, now),
    'noData',
  );
});

test('respeita exatamente a janela configurada de validade do fix', () => {
  const atLimit = {
    ...position(),
    fixTime: new Date(now - GPS_FIX_MAX_AGE).toISOString(),
  };
  const afterLimit = {
    ...position(),
    fixTime: new Date(now - GPS_FIX_MAX_AGE - 1).toISOString(),
  };

  assert.equal(getGpsFixState(atLimit, now), 'connected');
  assert.equal(getGpsFixState(afterLimit, now), 'stale');
});
