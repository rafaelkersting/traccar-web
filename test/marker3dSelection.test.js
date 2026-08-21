import test from 'node:test';
import assert from 'node:assert/strict';
import {
  marker3dAttribute,
  marker3dPresetIds,
  normalizeMarker3dPresetId,
  selectMarker3dPreset,
} from '../src/map/core/marker3dSelection.js';

test('catálogo possui os nove tipos esperados sem identificadores duplicados', () => {
  assert.equal(marker3dPresetIds.length, 9);
  assert.equal(new Set(marker3dPresetIds).size, marker3dPresetIds.length);
  assert.deepEqual(marker3dPresetIds, [
    'car',
    'motorcycle',
    'truck',
    'van',
    'bus',
    'boat',
    'tractor',
    'pickup',
    'generic',
  ]);
});

test('aceita apenas identificadores existentes na galeria', () => {
  assert.equal(normalizeMarker3dPresetId('car'), 'car');
  assert.equal(normalizeMarker3dPresetId('boat'), 'boat');
  assert.equal(normalizeMarker3dPresetId('invalid'), null);
  assert.equal(normalizeMarker3dPresetId(undefined), null);
});

test('salva o preset sem perder outros atributos do dispositivo', () => {
  assert.deepEqual(selectMarker3dPreset({ ignition: true }, 'truck'), {
    ignition: true,
    [marker3dAttribute]: 'truck',
  });
});

test('remove uma seleção inválida e restaura o fallback', () => {
  assert.deepEqual(selectMarker3dPreset({ ignition: true, [marker3dAttribute]: 'car' }, null), {
    ignition: true,
  });
  assert.deepEqual(selectMarker3dPreset({ [marker3dAttribute]: 'car' }, 'invalid'), {});
});
