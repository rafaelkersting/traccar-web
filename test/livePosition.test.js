import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAcceptLivePosition } from '../src/common/util/livePosition.js';

const position = (id, fixTime) => ({ id, deviceId: 1, fixTime });

test('aceita a primeira posição e atualizações cronologicamente novas', () => {
  assert.equal(shouldAcceptLivePosition(null, position(1, '2026-08-23T10:00:10Z')), true);
  assert.equal(
    shouldAcceptLivePosition(
      position(1, '2026-08-23T10:00:10Z'),
      position(2, '2026-08-23T10:00:20Z'),
    ),
    true,
  );
});

test('ignora posição fora de ordem para não mover o veículo para trás', () => {
  assert.equal(
    shouldAcceptLivePosition(
      position(3, '2026-08-23T10:00:20Z'),
      position(2, '2026-08-23T10:00:15Z'),
    ),
    false,
  );
});

test('no mesmo timestamp mantém a posição de maior id', () => {
  const timestamp = '2026-08-23T10:00:20Z';
  assert.equal(shouldAcceptLivePosition(position(3, timestamp), position(2, timestamp)), false);
  assert.equal(shouldAcceptLivePosition(position(3, timestamp), position(4, timestamp)), true);
});
