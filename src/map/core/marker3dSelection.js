export const marker3dAttribute = 'mapMarker3d';

export const marker3dPresetIds = Object.freeze([
  'car',
  'motorcycle',
  'truck',
  'van',
  'bus',
  'boat',
  'tractor',
  'pickup',
  'generic',
]);

const marker3dPresetIdSet = new Set(marker3dPresetIds);

export const normalizeMarker3dPresetId = (id) => (marker3dPresetIdSet.has(id) ? id : null);

export const selectMarker3dPreset = (attributes = {}, presetId) => {
  const nextAttributes = { ...attributes };
  const normalizedPresetId = normalizeMarker3dPresetId(presetId);
  if (normalizedPresetId) {
    nextAttributes[marker3dAttribute] = normalizedPresetId;
  } else {
    delete nextAttributes[marker3dAttribute];
  }
  return nextAttributes;
};
