const parseHexColor = (color) => {
  const normalized = color?.replace('#', '');
  if (!normalized || !/^[0-9a-f]{6}$/i.test(normalized)) {
    return null;
  }
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

export const recolorMarkerPixels = (pixels, color) => {
  const target = parseHexColor(color);
  const output = new Uint8ClampedArray(pixels);
  if (!target || color?.toLowerCase() === '#b8bec6') {
    return output;
  }

  for (let index = 0; index < output.length; index += 4) {
    const red = output[index];
    const green = output[index + 1];
    const blue = output[index + 2];
    const alpha = output[index + 3];
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;

    // Generated assets use neutral silver bodywork. Saturated lamps, dark windows,
    // tyres and transparent pixels stay untouched so recolouring preserves detail.
    if (!alpha || maximum - minimum > 52 || luminance < 72) {
      continue;
    }

    const lightFactor = 0.42 + (luminance / 255) * 0.82;
    const highlight = Math.max(0, luminance - 205) * 0.55;
    output[index] = Math.min(255, target.red * lightFactor + highlight);
    output[index + 1] = Math.min(255, target.green * lightFactor + highlight);
    output[index + 2] = Math.min(255, target.blue * lightFactor + highlight);
  }
  return output;
};

export const tintMarker3dImage = (image, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
  if (!context) {
    return image;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const recolored = recolorMarkerPixels(imageData.data, color);
  if (recolored !== imageData.data) {
    imageData.data.set(recolored);
    context.putImageData(imageData, 0, 0);
  }
  return canvas;
};

export const createMarker3dPreview = (source, color) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const tinted = tintMarker3dImage(image, color);
      const preview = document.createElement('canvas');
      const previewSize = 384;
      preview.width = previewSize;
      preview.height = previewSize;
      const context = preview.getContext('2d', { alpha: true });
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(tinted, 0, 0, previewSize, previewSize);
      resolve(preview.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('Unable to load marker preview'));
    image.src = source;
  });
