import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatRemaining,
  progressState,
  remainingSeconds,
  scenarioProgressSteps,
} from './demoUtils.js';

test('formats and clamps the demonstration countdown', () => {
  assert.equal(remainingSeconds('2026-01-01T00:01:01Z', Date.parse('2026-01-01T00:00:00Z')), 61);
  assert.equal(remainingSeconds('2025-01-01T00:00:00Z', Date.parse('2026-01-01T00:00:00Z')), 0);
  assert.equal(formatRemaining(61), '1:01');
});

test('exposes guided steps for every scenario family', () => {
  for (const scenario of ['urban', 'highway', 'geofence', 'overspeed', 'offline', 'complete']) {
    assert.ok(scenarioProgressSteps(scenario).length >= 5);
  }
});

test('marks active and completed progress steps', () => {
  assert.equal(progressState(0, 5, 0, 'Online', 'Online'), 'active');
  assert.equal(progressState(0, 5, 25, 'Movimento', 'Online'), 'complete');
  assert.equal(progressState(4, 5, 25, 'Movimento', 'Fim'), 'pending');
});
