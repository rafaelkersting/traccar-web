import test from 'node:test';
import assert from 'node:assert/strict';
import { recolorMarkerPixels } from '../src/map/core/marker3dImage.js';

test('recolore somente a carroceria neutra e preserva transparência, vidro e lanternas', () => {
  const body = [210, 210, 210, 255];
  const window = [20, 32, 45, 255];
  const tailLight = [220, 20, 20, 255];
  const transparent = [0, 0, 0, 0];
  const pixels = new Uint8ClampedArray([...body, ...window, ...tailLight, ...transparent]);

  const recolored = recolorMarkerPixels(pixels, '#1976d2');

  assert.notDeepEqual([...recolored.slice(0, 4)], [...pixels.slice(0, 4)]);
  assert.deepEqual([...recolored.slice(4, 8)], [...pixels.slice(4, 8)]);
  assert.deepEqual([...recolored.slice(8, 12)], [...pixels.slice(8, 12)]);
  assert.deepEqual([...recolored.slice(12, 16)], [...pixels.slice(12, 16)]);
});

test('mantém a arte original quando a cor selecionada é prata', () => {
  const pixels = new Uint8ClampedArray([210, 210, 210, 255]);
  assert.deepEqual([...recolorMarkerPixels(pixels, '#b8bec6')], [...pixels]);
});

test('cores diferentes produzem carrocerias visualmente diferentes', () => {
  const pixels = new Uint8ClampedArray([210, 210, 210, 255]);
  const blue = recolorMarkerPixels(pixels, '#1976d2');
  const red = recolorMarkerPixels(pixels, '#d32f2f');
  const green = recolorMarkerPixels(pixels, '#2e7d32');
  const yellow = recolorMarkerPixels(pixels, '#fbc02d');
  assert.notDeepEqual([...blue], [...red]);
  assert.notDeepEqual([...green], [...yellow]);
  assert.notDeepEqual([...blue], [...green]);
  assert.notDeepEqual([...red], [...yellow]);
});
