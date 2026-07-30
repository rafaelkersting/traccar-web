const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export const imageOptimizationLimits = {
  maxBytes: 450000,
  maxDimension: 800,
};

class ImageOptimizationError extends Error {}

const skipGifSubBlocks = (bytes, start) => {
  let offset = start;
  while (offset < bytes.length) {
    const blockSize = bytes[offset];
    offset += 1;
    if (!blockSize) {
      return offset;
    }
    offset += blockSize;
  }
  return offset;
};

export const isAnimatedGif = async (file) => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = String.fromCharCode(...bytes.slice(0, 6));
  if (header !== 'GIF87a' && header !== 'GIF89a') {
    return false;
  }

  if (bytes.length < 13) {
    return false;
  }

  let offset = 13;
  const globalColorTable = bytes[10] & 0x80;
  if (globalColorTable) {
    offset += 3 * 2 ** ((bytes[10] & 0x07) + 1);
  }

  let frames = 0;
  while (offset < bytes.length) {
    const marker = bytes[offset];
    offset += 1;

    if (marker === 0x3b) {
      break;
    }

    if (marker === 0x21) {
      offset += 1;
      offset = skipGifSubBlocks(bytes, offset);
    } else if (marker === 0x2c) {
      if (offset + 9 > bytes.length) {
        break;
      }
      frames += 1;
      if (frames > 1) {
        return true;
      }
      const localColorTable = bytes[offset + 8] & 0x80;
      const colorTableSize = bytes[offset + 8] & 0x07;
      offset += 9;
      if (localColorTable) {
        offset += 3 * 2 ** (colorTableSize + 1);
      }
      offset += 1;
      offset = skipGifSubBlocks(bytes, offset);
    } else {
      break;
    }
  }

  return false;
};

export const calculateImageDimensions = (width, height, maxDimension) => {
  const scale = Math.min(1, maxDimension / width, maxDimension / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

const loadHtmlImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(url),
      });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid image'));
    };
    image.src = url;
  });

const decodeBrowserImage = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Fall back to HTMLImageElement for browsers with partial createImageBitmap support.
    }
  }
  return loadHtmlImage(file);
};

const encodeWebp = ({ source, width, height, quality }) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) {
    throw new ImageOptimizationError('Não foi possível processar a imagem neste navegador.');
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.clearRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new ImageOptimizationError('Não foi possível comprimir a imagem selecionada.'));
        } else if (blob.type !== 'image/webp') {
          reject(
            new ImageOptimizationError(
              'Este navegador não oferece suporte à otimização em WebP. Tente outro navegador.',
            ),
          );
        } else {
          resolve(blob);
        }
      },
      'image/webp',
      quality,
    );
  });
};

const getOutputName = (name) => `${name.replace(/\.[^.]*$/, '') || 'imagem'}.webp`;

const createQualities = (initialQuality) => {
  const qualities = [];
  for (let quality = initialQuality; quality >= 0.35; quality -= 0.08) {
    qualities.push(Math.round(quality * 100) / 100);
  }
  return qualities;
};

export const optimizeDeviceImage = async (
  file,
  {
    maxBytes = imageOptimizationLimits.maxBytes,
    maxDimension = imageOptimizationLimits.maxDimension,
    initialQuality = 0.85,
    decode = decodeBrowserImage,
    encode = encodeWebp,
    detectAnimatedGif = isAnimatedGif,
  } = {},
) => {
  if (!file || !acceptedImageTypes.has(file.type)) {
    throw new ImageOptimizationError('Selecione uma imagem JPEG, PNG, GIF ou WebP.');
  }

  let decoded;
  try {
    decoded = await decode(file);
    if (!decoded.width || !decoded.height) {
      throw new Error('Invalid dimensions');
    }

    const initialDimensions = calculateImageDimensions(decoded.width, decoded.height, maxDimension);
    const requiresResize =
      initialDimensions.width !== decoded.width || initialDimensions.height !== decoded.height;
    const requiresCompression = file.size > maxBytes;

    if (!requiresResize && !requiresCompression) {
      return {
        file,
        originalSize: file.size,
        finalSize: file.size,
        width: decoded.width,
        height: decoded.height,
        optimized: false,
      };
    }

    if (file.type === 'image/gif' && (await detectAnimatedGif(file))) {
      throw new ImageOptimizationError(
        'GIF animado não pode ser otimizado sem perder a animação. Envie um GIF com até 450 KB e no máximo 800 x 800 pixels ou converta-o manualmente.',
      );
    }

    const qualities = createQualities(initialQuality);
    let dimensions = initialDimensions;

    for (let dimensionAttempt = 0; dimensionAttempt < 7; dimensionAttempt += 1) {
      let smallestBlob;
      for (const quality of qualities) {
        const blob = await encode({ ...decoded, ...dimensions, quality });
        if (!smallestBlob || blob.size < smallestBlob.size) {
          smallestBlob = blob;
        }
        if (blob.size <= maxBytes) {
          const optimizedFile = new File([blob], getOutputName(file.name), {
            type: 'image/webp',
            lastModified: file.lastModified,
          });
          return {
            file: optimizedFile,
            originalSize: file.size,
            finalSize: optimizedFile.size,
            ...dimensions,
            optimized: true,
          };
        }
      }

      const estimatedScale = Math.sqrt(maxBytes / smallestBlob.size) * 0.95;
      const scale = Math.min(0.85, estimatedScale);
      dimensions = {
        width: Math.max(1, Math.floor(dimensions.width * scale)),
        height: Math.max(1, Math.floor(dimensions.height * scale)),
      };
    }

    throw new ImageOptimizationError(
      'Não foi possível reduzir a imagem para o tamanho permitido. Escolha outra imagem.',
    );
  } catch (error) {
    if (error instanceof ImageOptimizationError) {
      throw error;
    }
    throw new ImageOptimizationError(
      'Não foi possível otimizar a imagem. Verifique se o arquivo é uma imagem válida e tente novamente.',
    );
  } finally {
    decoded?.close?.();
  }
};

export const formatImageSize = (bytes) => {
  if (bytes >= 1000000) {
    return `${(bytes / 1000000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1000)).toLocaleString('pt-BR')} KB`;
};
