import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMapMarkerUrl,
  mapMarkerImageLimits,
  optimizeMapMarkerImage,
  removeMapMarkerImage,
  versionMapMarkerImage,
} from '../src/common/util/mapMarkerImage.js';
import {
  createDeviceMarkerImageKey,
  mapMarkerVisualSizes,
  resolveDeviceMarkerImage,
} from '../src/map/core/deviceMarker.js';

const makeFile = ({ name = 'marker.jpg', type = 'image/jpeg', size }) =>
  new File([new Uint8Array(size)], name, { type, lastModified: 123 });

const makeDecoder =
  (width, height, source = {}) =>
  async () => ({ source, width, height, close: () => {} });

const makeBlob = (size) => new Blob([new Uint8Array(size)], { type: 'image/webp' });

test('aceita upload válido sem recodificar uma imagem pequena', async () => {
  const original = makeFile({ size: 20000 });
  const result = await optimizeMapMarkerImage(original, {
    decode: makeDecoder(60, 40),
    encode: async () => {
      throw new Error('Encoder não deveria ser chamado');
    },
  });

  assert.equal(result.file, original);
  assert.equal(result.optimized, false);
});

test('reduz uma imagem muito grande para no máximo 80 x 80 e abaixo do limite', async () => {
  const calls = [];
  const result = await optimizeMapMarkerImage(makeFile({ size: 2000000 }), {
    decode: makeDecoder(4000, 2000),
    encode: async (options) => {
      calls.push(options);
      return makeBlob(80000);
    },
  });

  assert.deepEqual({ width: calls[0].width, height: calls[0].height }, { width: 80, height: 40 });
  assert.ok(result.file.size <= mapMarkerImageLimits.maxBytes);
  assert.ok(result.file.size < 500000);
});

test('preserva a fonte com transparência ao converter PNG', async () => {
  const source = { hasAlpha: true };
  const result = await optimizeMapMarkerImage(
    makeFile({ name: 'marker.png', type: 'image/png', size: 180000 }),
    {
      decode: makeDecoder(300, 300, source),
      encode: async (options) => {
        assert.equal(options.source, source);
        assert.equal(options.source.hasAlpha, true);
        return makeBlob(60000);
      },
    },
  );

  assert.equal(result.file.type, 'image/webp');
  assert.deepEqual({ width: result.width, height: result.height }, { width: 80, height: 80 });
});

test('rejeita GIF e arquivos que não sejam JPG, PNG ou WebP', async () => {
  await assert.rejects(
    optimizeMapMarkerImage(makeFile({ name: 'marker.gif', type: 'image/gif', size: 1000 })),
    /Selecione uma imagem JPG, PNG ou WebP/,
  );
  await assert.rejects(
    optimizeMapMarkerImage(makeFile({ name: 'marker.txt', type: 'text/plain', size: 1000 })),
    /Selecione uma imagem JPG, PNG ou WebP/,
  );
});

test('remove somente o marcador personalizado e preserva outros atributos', () => {
  assert.deepEqual(removeMapMarkerImage({ mapMarker: 'marker.webp', speedLimit: 80 }), {
    speedLimit: 80,
  });
});

test('gera URL versionada para evitar cache após editar o marcador', () => {
  const marker = versionMapMarkerImage('marker.webp', 1234);
  assert.equal(marker, 'marker.webp?v=1234');
  assert.equal(
    getMapMarkerUrl({ uniqueId: 'vehicle 1', attributes: { mapMarker: marker } }),
    '/api/media/vehicle%201/marker.webp?v=1234',
  );
});

test('renderiza o marcador personalizado carregado e mantém fallback por categoria', () => {
  const loaded = {
    1: {
      regular: 'map-device-marker-1-123',
      selected: 'map-device-marker-1-123-selected',
    },
  };
  assert.equal(resolveDeviceMarkerImage(1, 'car-green', loaded), 'map-device-marker-1-123');
  assert.equal(
    resolveDeviceMarkerImage(1, 'car-green', loaded, true),
    'map-device-marker-1-123-selected',
  );
  assert.equal(resolveDeviceMarkerImage(2, 'truck-neutral', loaded), 'truck-neutral');
  assert.equal(resolveDeviceMarkerImage(1, 'car-green', {}), 'car-green');
});

test('usa 44 px normalmente e 52 px quando o dispositivo está selecionado', () => {
  assert.deepEqual(mapMarkerVisualSizes, {
    regular: 44,
    selected: 52,
    regularContent: 36,
    selectedContent: 42,
  });
});

test('gera chave estável e diferente para cada versão da imagem', () => {
  const first = createDeviceMarkerImageKey('map', 1, 'marker.webp?v=1');
  assert.equal(first, createDeviceMarkerImageKey('map', 1, 'marker.webp?v=1'));
  assert.notEqual(first, createDeviceMarkerImageKey('map', 1, 'marker.webp?v=2'));
});
