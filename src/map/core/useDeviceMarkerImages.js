import { useEffect, useState } from 'react';
import { getMapMarkerUrl, mapMarkerAttribute } from '../../common/util/mapMarkerImage';
import { loadImage, prepareDeviceMarkerImage } from './mapUtil';
import { map } from './MapView';
import { createDeviceMarkerImageKey } from './deviceMarker';

const useDeviceMarkerImages = (namespace, devices) => {
  const [markerImages, setMarkerImages] = useState({});
  const markerSignature = JSON.stringify(
    Object.values(devices)
      .filter((device) => device.attributes?.[mapMarkerAttribute])
      .map((device) => [device.id, device.uniqueId, device.attributes[mapMarkerAttribute]]),
  );

  useEffect(() => {
    let active = true;
    const addedImages = [];
    const entries = JSON.parse(markerSignature);

    setMarkerImages({});
    Promise.all(
      entries.map(async ([deviceId, uniqueId, marker]) => {
        const device = { id: deviceId, uniqueId, attributes: { [mapMarkerAttribute]: marker } };
        const key = createDeviceMarkerImageKey(namespace, deviceId, marker);
        const selectedKey = `${key}-selected`;
        try {
          const image = await loadImage(getMapMarkerUrl(device));
          if (active && !map.hasImage(key)) {
            map.addImage(key, prepareDeviceMarkerImage(image), {
              pixelRatio: window.devicePixelRatio,
            });
            map.addImage(selectedKey, prepareDeviceMarkerImage(image, true), {
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
