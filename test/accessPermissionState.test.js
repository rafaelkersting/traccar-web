import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completeAccessLoad,
  createEmptyAccessState,
  failAccessLoad,
} from '../src/common/util/accessPermissionState.js';

test('primeiro carregamento começa bloqueado até receber as permissões', () => {
  const state = createEmptyAccessState();

  assert.equal(state.loaded, false);
  assert.deepEqual(state.permissions, []);
  assert.equal(state.error, null);
});

test('refresh concluído troca as permissões de forma atômica', () => {
  const state = completeAccessLoad({
    profileId: 2,
    permissions: ['map.view'],
    profilePermissions: ['map.view'],
    allowedOverrides: [],
    denied: [],
  });

  assert.equal(state.loaded, true);
  assert.deepEqual(state.permissions, ['map.view']);
  assert.equal(state.error, null);
});

test('falha de refresh preserva a autorização já carregada sem piscar', () => {
  const current = completeAccessLoad({
    profileId: 2,
    permissions: ['map.view', 'map.follow'],
    profilePermissions: ['map.view', 'map.follow'],
    allowedOverrides: [],
    denied: [],
  });
  const state = failAccessLoad(current, new Error('temporariamente indisponível'), true);

  assert.equal(state.loaded, true);
  assert.deepEqual(state.permissions, current.permissions);
  assert.equal(state.error, null);
  assert.equal(state.refreshError, 'temporariamente indisponível');
});

test('falha inicial permanece bloqueada e é exibida como erro', () => {
  const state = failAccessLoad(createEmptyAccessState(), new Error('não autorizado'), false);

  assert.equal(state.loaded, true);
  assert.deepEqual(state.permissions, []);
  assert.equal(state.error, 'não autorizado');
});
