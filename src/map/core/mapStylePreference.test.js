import assert from 'node:assert/strict';
import test from 'node:test';
import { initialMapStyle, mapStyleStorageKey } from './mapStylePreference.js';

test('uses Google Hybrid in an isolated Demo preference slot', () => {
  const user = { id: 42, attributes: { demo: true } };

  assert.equal(initialMapStyle(user, 'osm'), 'googleHybrid');
  assert.equal(mapStyleStorageKey(user), 'selectedMapStyle.demo.42');
});

test('preserves the existing preference behavior for real users', () => {
  const user = { id: 7, attributes: {} };

  assert.equal(initialMapStyle(user, 'locationIqStreets'), 'locationIqStreets');
  assert.equal(mapStyleStorageKey(user), 'selectedMapStyle');
});
