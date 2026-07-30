import test from 'node:test';
import assert from 'node:assert/strict';
import {
  imageOptimizationLimits,
  optimizeDeviceImage,
} from '../src/common/util/imageOptimization.js';

const makeFile = ({ name = 'vehicle.jpg', type = 'image/jpeg', size }) =>
  new File([new Uint8Array(size)], name, { type, lastModified: 123 });

const makeDecoder =
  (width, height, source = {}) =>
  async () => ({
    source,
    width,
    height,
    close: () => {},
  });

const makeBlob = (size) => new Blob([new Uint8Array(size)], { type: 'image/webp' });

test('otimiza JPG maior que 500 KB começando com qualidade 0,85', async () => {
  const calls = [];
  const result = await optimizeDeviceImage(makeFile({ size: 600000 }), {
    decode: makeDecoder(1600, 1200),
    encode: async (options) => {
      calls.push(options);
      return makeBlob(options.quality === 0.85 ? 480000 : 420000);
    },
  });

  assert.equal(calls[0].quality, 0.85);
  assert.deepEqual({ width: calls[0].width, height: calls[0].height }, { width: 800, height: 600 });
  assert.ok(result.file.size <= imageOptimizationLimits.maxBytes);
  assert.equal(result.file.type, 'image/webp');
  assert.equal(result.file.name, 'vehicle.webp');
});

test('converte PNG transparente para WebP preservando a fonte com canal alfa', async () => {
  const source = { hasAlpha: true };
  const result = await optimizeDeviceImage(
    makeFile({ name: 'vehicle.png', type: 'image/png', size: 520000 }),
    {
      decode: makeDecoder(700, 500, source),
      encode: async (options) => {
        assert.equal(options.source, source);
        assert.equal(options.source.hasAlpha, true);
        return makeBlob(210000);
      },
    },
  );

  assert.equal(result.file.type, 'image/webp');
  assert.equal(result.file.name, 'vehicle.webp');
});

test('aceita e otimiza uma imagem WebP', async () => {
  const result = await optimizeDeviceImage(
    makeFile({ name: 'vehicle.webp', type: 'image/webp', size: 510000 }),
    {
      decode: makeDecoder(900, 900),
      encode: async () => makeBlob(190000),
    },
  );

  assert.equal(result.file.type, 'image/webp');
  assert.equal(result.width, 800);
  assert.equal(result.height, 800);
});

test('mantém sem recodificação uma imagem válida menor que 450 KB', async () => {
  const original = makeFile({ size: 120000 });
  const result = await optimizeDeviceImage(original, {
    decode: makeDecoder(640, 480),
    encode: async () => {
      throw new Error('Encoder não deveria ser chamado');
    },
  });

  assert.equal(result.file, original);
  assert.equal(result.optimized, false);
  assert.equal(result.finalSize, original.size);
});

test('rejeita arquivo que não seja imagem compatível', async () => {
  const file = makeFile({ name: 'document.pdf', type: 'application/pdf', size: 1000 });

  await assert.rejects(
    optimizeDeviceImage(file, { decode: makeDecoder(100, 100) }),
    /Selecione uma imagem JPEG, PNG, GIF ou WebP/,
  );
});

test('reduz resolução muito alta e preserva a proporção', async () => {
  const dimensions = [];
  const result = await optimizeDeviceImage(makeFile({ size: 700000 }), {
    decode: makeDecoder(12000, 3000),
    encode: async (options) => {
      dimensions.push({ width: options.width, height: options.height });
      return makeBlob(options.width === 800 ? 520000 : 300000);
    },
  });

  assert.deepEqual(dimensions[0], { width: 800, height: 200 });
  assert.ok(dimensions.some(({ width }) => width < 800));
  assert.equal(result.width / result.height, 4);
  assert.ok(result.file.size <= imageOptimizationLimits.maxBytes);
});

test('mostra erro claro quando a compressão falha', async () => {
  await assert.rejects(
    optimizeDeviceImage(makeFile({ size: 700000 }), {
      decode: makeDecoder(800, 600),
      encode: async () => {
        throw new Error('Falha simulada');
      },
    }),
    /Não foi possível otimizar a imagem/,
  );
});

test('arquivo otimizado conclui upload sem exceder o limite do backend', async () => {
  const result = await optimizeDeviceImage(makeFile({ size: 900000 }), {
    decode: makeDecoder(2400, 1600),
    encode: async () => makeBlob(430000),
  });
  const upload = async (file) => {
    if (file.size > 500000) {
      throw new Error('Image size limit exceeded');
    }
    return 'vehicle.webp';
  };

  await assert.doesNotReject(() => upload(result.file));
  assert.equal(await upload(result.file), 'vehicle.webp');
});

test('impede conversão silenciosa de GIF animado que precisa ser otimizado', async () => {
  await assert.rejects(
    optimizeDeviceImage(makeFile({ name: 'vehicle.gif', type: 'image/gif', size: 600000 }), {
      decode: makeDecoder(640, 480),
      detectAnimatedGif: async () => true,
      encode: async () => {
        throw new Error('Encoder não deveria ser chamado');
      },
    }),
    /GIF animado não pode ser otimizado sem perder a animação/,
  );
});
