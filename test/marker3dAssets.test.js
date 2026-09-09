import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const assets = [
  'car-hatch',
  'car-sedan',
  'car-suv',
  'car-pickup',
  'motorcycle-street',
  'motorcycle-scooter',
  'motorcycle-trail',
  'truck-light',
  'truck-medium',
  'truck-heavy',
  'van-cargo',
  'van-passenger',
  'bus-urban',
  'bus-coach',
  'boat-standard',
  'boat-speedboat',
  'tractor-standard',
  'machine-loader',
  'generic-standard',
];

test('cada modelo do catálogo possui uma arte HD própria', async () => {
  const hashes = await Promise.all(
    assets.map(async (model) => {
      const content = await readFile(
        new URL(`../src/resources/images/marker3d/${model}-hd.png`, import.meta.url),
      );
      assert.ok(content.length > 100_000, `${model} deve usar uma arte em alta definição`);
      return createHash('sha256').update(content).digest('hex');
    }),
  );

  assert.equal(new Set(hashes).size, assets.length);
});
