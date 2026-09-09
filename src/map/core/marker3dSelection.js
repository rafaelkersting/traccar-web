export const marker3dAttribute = 'mapMarker3d';
export const marker3dCategoryAttribute = 'mapMarker3dCategory';
export const marker3dModelAttribute = 'mapMarker3dModel';
export const marker3dColorAttribute = 'mapMarker3dColor';

export const legacyMarker3dPresetIds = Object.freeze([
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

// Kept as a public alias for extensions that still import the original catalog identifiers.
export const marker3dPresetIds = legacyMarker3dPresetIds;

const legacyMarker3dPresetIdSet = new Set(legacyMarker3dPresetIds);

export const normalizeMarker3dPresetId = (id) =>
  typeof id === 'string' && (legacyMarker3dPresetIdSet.has(id) || id.includes(':')) ? id : null;

export const clearMarker3dSelection = (attributes = {}) => {
  const nextAttributes = { ...attributes };
  delete nextAttributes[marker3dAttribute];
  delete nextAttributes[marker3dCategoryAttribute];
  delete nextAttributes[marker3dModelAttribute];
  delete nextAttributes[marker3dColorAttribute];
  return nextAttributes;
};

export const selectMarker3dConfiguration = (
  attributes = {},
  { id, categoryId, modelId, colorId } = {},
) => {
  const nextAttributes = clearMarker3dSelection(attributes);
  if (!id || !categoryId || !modelId || !colorId) {
    return nextAttributes;
  }
  return {
    ...nextAttributes,
    [marker3dAttribute]: id,
    [marker3dCategoryAttribute]: categoryId,
    [marker3dModelAttribute]: modelId,
    [marker3dColorAttribute]: colorId,
  };
};

// Backward-compatible helper used by older extensions and tests.
export const selectMarker3dPreset = (attributes = {}, presetId) => {
  const nextAttributes = clearMarker3dSelection(attributes);
  const normalizedPresetId = normalizeMarker3dPresetId(presetId);
  if (normalizedPresetId) {
    nextAttributes[marker3dAttribute] = normalizedPresetId;
  } else {
    return nextAttributes;
  }
  return nextAttributes;
};
