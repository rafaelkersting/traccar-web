export const calculateOpaqueBounds = (data, width, height, alphaThreshold = 8) => {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > alphaThreshold) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }

  if (right < left || bottom < top) {
    return { x: 0, y: 0, width, height };
  }
  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
};

export const calculateContainedSize = (width, height, maxWidth, maxHeight, allowUpscale = true) => {
  const scale = Math.min(maxWidth / width, maxHeight / height, allowUpscale ? Infinity : 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

export const getImageContentBounds = (image) => {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return { x: 0, y: 0, width, height };
  }
  context.drawImage(image, 0, 0, width, height);
  try {
    return calculateOpaqueBounds(context.getImageData(0, 0, width, height).data, width, height);
  } catch {
    return { x: 0, y: 0, width, height };
  }
};
