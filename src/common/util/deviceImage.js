import fetchOrThrow from './fetchOrThrow.js';

export const deviceImageAttribute = 'deviceImage';

export const versionDeviceImage = (fileName, version = Date.now()) => `${fileName}?v=${version}`;

export const removeDeviceImage = (attributes = {}) => {
  const remainingAttributes = { ...attributes };
  delete remainingAttributes[deviceImageAttribute];
  return remainingAttributes;
};

export const getDeviceImageUrl = (device) => {
  const image = device?.attributes?.[deviceImageAttribute];
  if (!image || !device.uniqueId) {
    return null;
  }
  const [fileName, query] = image.split('?');
  const suffix = query ? `?${query}` : '';
  return `/api/media/${encodeURIComponent(device.uniqueId)}/${encodeURIComponent(fileName)}${suffix}`;
};

export const uploadDeviceImage = async (
  device,
  file,
  request = fetchOrThrow,
  version = Date.now(),
) => {
  const uploadResponse = await request(`/api/devices/${device.id}/image`, {
    method: 'POST',
    body: file,
  });
  const image = versionDeviceImage(await uploadResponse.text(), version);
  const updateResponse = await request(`/api/devices/${device.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...device,
      attributes: { ...device.attributes, [deviceImageAttribute]: image },
    }),
  });
  return updateResponse.json();
};

export const deleteDeviceImage = async (device, request = fetchOrThrow) => {
  await request(`/api/devices/${device.id}/image`, { method: 'DELETE' });
  const updateResponse = await request(`/api/devices/${device.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...device,
      attributes: removeDeviceImage(device.attributes),
    }),
  });
  return updateResponse.json();
};
