import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateContainedSize, calculateOpaqueBounds } from '../src/common/util/imageContent.js';

const createPixels = (width, height, opaqueArea) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = opaqueArea.y; y < opaqueArea.y + opaqueArea.height; y += 1) {
    for (let x = opaqueArea.x; x < opaqueArea.x + opaqueArea.width; x += 1) {
      data[(y * width + x) * 4 + 3] = 255;
    }
  }
  return data;
};

test('remove somente as bordas transparentes sem cortar o conteúdo', () => {
  const data = createPixels(80, 80, { x: 25, y: 10, width: 30, height: 60 });
  assert.deepEqual(calculateOpaqueBounds(data, 80, 80), {
    x: 25,
    y: 10,
    width: 30,
    height: 60,
  });
});

test('mantém a imagem completa quando não existe transparência', () => {
  const data = createPixels(40, 30, { x: 0, y: 0, width: 40, height: 30 });
  assert.deepEqual(calculateOpaqueBounds(data, 40, 30), {
    x: 0,
    y: 0,
    width: 40,
    height: 30,
  });
});

test('ajusta imagens quadrada, vertical e horizontal sem deformação', () => {
  assert.deepEqual(calculateContainedSize(100, 100, 36, 36), { width: 36, height: 36 });
  assert.deepEqual(calculateContainedSize(50, 100, 36, 36), { width: 18, height: 36 });
  assert.deepEqual(calculateContainedSize(100, 50, 36, 36), { width: 36, height: 18 });
});

test('não amplia excessivamente uma imagem pequena no card', () => {
  assert.deepEqual(calculateContainedSize(24, 16, 288, 120, false), {
    width: 24,
    height: 16,
  });
});
