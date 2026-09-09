export const mapMarkerVisualSizes = {
  regular: 44,
  selected: 52,
  regularContent: 36,
  selectedContent: 42,
};

// Custom markers keep their original colour and contrast even when the device is
// offline. The surrounding state ring still communicates the offline condition.
export const deviceMarkerOpacityExpression = [
  'case',
  ['get', 'customMarker'],
  1,
  ['==', ['get', 'markerState'], 'offline'],
  0.55,
  1,
];

export const resolveDeviceMarkerImage = (
  deviceId,
  fallbackImage,
  markerImages,
  selected = false,
) => {
  const marker = markerImages[deviceId];
  if (!marker) {
    return fallbackImage;
  }
  if (typeof marker === 'string') {
    return marker;
  }
  return marker[selected ? 'selected' : 'regular'] || fallbackImage;
};

export const createDeviceMarkerImageKey = (namespace, deviceId, marker) => {
  let hash = 0;
  for (let index = 0; index < marker.length; index += 1) {
    hash = (hash * 31 + marker.charCodeAt(index)) >>> 0;
  }
  return `${namespace}-device-marker-${deviceId}-${hash}`;
};
