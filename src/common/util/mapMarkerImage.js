import { optimizeDeviceImage } from './imageOptimization.js';

export const mapMarkerAttribute = 'mapMarker';

export const mapMarkerImageLimits = {
  maxBytes: 100000,
  maxDimension: 80,
};

const acceptedMapMarkerTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

export const optimizeMapMarkerImage = (file, options = {}) =>
  optimizeDeviceImage(file, {
    ...mapMarkerImageLimits,
    acceptedTypes: acceptedMapMarkerTypes,
    invalidTypeMessage: 'Selecione uma imagem JPG, PNG, WebP ou SVG.',
    ...options,
  });

export const versionMapMarkerImage = (fileName, version = Date.now()) => `${fileName}?v=${version}`;

export const removeMapMarkerImage = (attributes = {}) => {
  const remainingAttributes = { ...attributes };
  delete remainingAttributes[mapMarkerAttribute];
  return remainingAttributes;
};

export const getMapMarkerUrl = (device) => {
  const marker = device?.attributes?.[mapMarkerAttribute];
  if (!marker || !device.uniqueId) {
    return null;
  }
  const [fileName, query] = marker.split('?');
  const suffix = query ? `?${query}` : '';
  return `/api/media/${encodeURIComponent(device.uniqueId)}/${encodeURIComponent(fileName)}${suffix}`;
};
