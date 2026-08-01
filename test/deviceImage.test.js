import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deleteDeviceImage,
  getDeviceImageUrl,
  removeDeviceImage,
  uploadDeviceImage,
  versionDeviceImage,
} from '../src/common/util/deviceImage.js';

test('gera URL da imagem do card com codificação e controle de versão', () => {
  const image = versionDeviceImage('device.webp', 1234);
  assert.equal(image, 'device.webp?v=1234');
  assert.equal(
    getDeviceImageUrl({ uniqueId: 'vehicle 1', attributes: { deviceImage: image } }),
    '/api/media/vehicle%201/device.webp?v=1234',
  );
});

test('imagem do card e marcador permanecem independentes ao remover o card', () => {
  assert.deepEqual(
    removeDeviceImage({ deviceImage: 'device.webp?v=1', mapMarker: 'marker.webp?v=2' }),
    { mapMarker: 'marker.webp?v=2' },
  );
});

test('retorna ausência de imagem quando o dispositivo não possui imagem do card', () => {
  assert.equal(getDeviceImageUrl({ uniqueId: 'vehicle-1', attributes: {} }), null);
});

test('upload substitui a imagem, mantém o marcador e persiste a versão nova', async () => {
  const calls = [];
  const device = {
    id: 7,
    uniqueId: 'vehicle-7',
    attributes: { deviceImage: 'device.png?v=1', mapMarker: 'marker.webp?v=2' },
  };
  const request = async (url, options) => {
    calls.push({ url, options });
    if (options.method === 'POST') {
      return { text: async () => 'device.webp' };
    }
    return { json: async () => JSON.parse(options.body) };
  };

  const updated = await uploadDeviceImage(device, new Blob(['image']), request, 3000);

  assert.deepEqual(
    calls.map(({ url, options }) => [url, options.method]),
    [
      ['/api/devices/7/image', 'POST'],
      ['/api/devices/7', 'PUT'],
    ],
  );
  assert.equal(updated.attributes.deviceImage, 'device.webp?v=3000');
  assert.equal(updated.attributes.mapMarker, 'marker.webp?v=2');
});

test('remoção exclui o arquivo, limpa somente a imagem do card e persiste o dispositivo', async () => {
  const calls = [];
  const device = {
    id: 8,
    uniqueId: 'vehicle-8',
    attributes: { deviceImage: 'device.webp?v=3', mapMarker: 'marker.webp?v=4' },
  };
  const request = async (url, options) => {
    calls.push({ url, options });
    return options.method === 'PUT'
      ? { json: async () => JSON.parse(options.body) }
      : { json: async () => null };
  };

  const updated = await deleteDeviceImage(device, request);

  assert.deepEqual(
    calls.map(({ url, options }) => [url, options.method]),
    [
      ['/api/devices/8/image', 'DELETE'],
      ['/api/devices/8', 'PUT'],
    ],
  );
  assert.equal(updated.attributes.deviceImage, undefined);
  assert.equal(updated.attributes.mapMarker, 'marker.webp?v=4');
});
