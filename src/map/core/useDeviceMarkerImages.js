import { useEffect, useState } from 'react';
import { getMapMarkerUrl, mapMarkerAttribute } from '../../common/util/mapMarkerImage';
import { loadImage, prepareDeviceMarkerImage } from './mapUtil';
import { map } from './MapView';
import { createDeviceMarkerImageKey } from './deviceMarker';
import { getDeviceMarker3dPreset } from './marker3dCatalog';
import { marker3dAttribute } from './marker3dSelection';

const useDeviceMarkerImages = (namespace, devices) => {
  const [markerImages, setMarkerImages] = useState({});
  const markerSignature = JSON.stringify(
    Object.values(devices)
      .filter(
        (device) =>
          device.attributes?.[mapMarkerAttribute] || device.attributes?.[marker3dAttribute],
      )
      .map((device) => [
        device.id,
        device.uniqueId,
        device.attributes[mapMarkerAttribute],
        device.attributes[marker3dAttribute],
      ]),
  );

  useEffect(() => {
    let active = true;
    const addedImages = [];
    const entries = JSON.parse(markerSignature);

    setMarkerImages({});
    Promise.all(
      entries.map(async ([deviceId, uniqueId, marker, marker3d]) => {
        const device = {
          id: deviceId,
          uniqueId,
          attributes: { [mapMarkerAttribute]: marker, [marker3dAttribute]: marker3d },
        };
        const preset = getDeviceMarker3dPreset(device);
        const source = preset?.image || getMapMarkerUrl(device);
        if (!source) {
          return null;
        }
        const signature = preset ? `3d:${preset.id}` : marker;
        const key = createDeviceMarkerImageKey(namespace, deviceId, signature);
        const selectedKey = `${key}-selected`;
        try {
          const image = await loadImage(source);
          if (active && !map.hasImage(key)) {
            map.addImage(key, prepareDeviceMarkerImage(image, false, !preset), {
              pixelRatio: window.devicePixelRatio,
            });
            map.addImage(selectedKey, prepareDeviceMarkerImage(image, true, !preset), {
              pixelRatio: window.devicePixelRatio,
            });
            addedImages.push(key, selectedKey);
          }
          return active ? [deviceId, { regular: key, selected: selectedKey }] : null;
        } catch {
          return null;
        }
      }),
    ).then((loadedEntries) => {
      if (active) {
        setMarkerImages(Object.fromEntries(loadedEntries.filter(Boolean)));
      }
    });

    return () => {
      active = false;
      addedImages.forEach((key) => {
        if (map.hasImage(key)) {
          map.removeImage(key);
        }
      });
    };
  }, [markerSignature, namespace]);

  return markerImages;
};

export default useDeviceMarkerImages;
