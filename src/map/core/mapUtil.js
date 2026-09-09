import { parse, stringify } from 'wellknown';
import turfCircle from '@turf/circle';
import gcoord from 'gcoord';
import { map } from './MapView';
import { calculateContainedSize, getImageContentBounds } from '../../common/util/imageContent';
import { mapMarkerVisualSizes } from './deviceMarker';

const coordinateSystem = (id) => {
  switch (id) {
    case 'gcj02':
      return gcoord.GCJ02;
    default:
      return gcoord.WGS84;
  }
};

export const toMapCoordinates = (longitude, latitude) =>
  map.coordinateSystem
    ? gcoord.transform([longitude, latitude], gcoord.WGS84, coordinateSystem(map.coordinateSystem))
    : [longitude, latitude];

export const fromMapCoordinates = (longitude, latitude) =>
  map.coordinateSystem
    ? gcoord.transform([longitude, latitude], coordinateSystem(map.coordinateSystem), gcoord.WGS84)
    : [longitude, latitude];

const transformGeometry = (geometry, from, to) =>
  gcoord.transform(structuredClone(geometry), from, to);

export const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${url}`));
    image.src = url;
  });

const canvasTintImage = (image, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width * devicePixelRatio;
  canvas.height = image.height * devicePixelRatio;
  canvas.style.width = `${image.width}px`;
  canvas.style.height = `${image.height}px`;

  const context = canvas.getContext('2d');

  context.save();
  context.fillStyle = color;
  context.globalAlpha = 1;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'destination-atop';
  context.globalAlpha = 1;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.restore();

  return canvas;
};

export const prepareIcon = (background, icon, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = background.width * devicePixelRatio;
  canvas.height = background.height * devicePixelRatio;
  canvas.style.width = `${background.width}px`;
  canvas.style.height = `${background.height}px`;

  const context = canvas.getContext('2d');
  context.drawImage(background, 0, 0, canvas.width, canvas.height);

  if (icon) {
    const iconRatio = 0.5;
    const imageWidth = canvas.width * iconRatio;
    const imageHeight = canvas.height * iconRatio;
    context.drawImage(
      canvasTintImage(icon, color),
      (canvas.width - imageWidth) / 2,
      (canvas.height - imageHeight) / 2,
      imageWidth,
      imageHeight,
    );
  }

  return context.getImageData(0, 0, canvas.width, canvas.height);
};

export const prepareDeviceMarkerImage = (image, selected = false, framed = true) => {
  const pixelRatio = window.devicePixelRatio;
  const size = selected ? mapMarkerVisualSizes.selected : mapMarkerVisualSizes.regular;
  const contentSize = selected
    ? mapMarkerVisualSizes.selectedContent
    : mapMarkerVisualSizes.regularContent;
  const canvas = document.createElement('canvas');
  canvas.width = size * pixelRatio;
  canvas.height = size * pixelRatio;
  const context = canvas.getContext('2d');
  const bounds = getImageContentBounds(image);
  const contained = calculateContainedSize(
    bounds.width,
    bounds.height,
    contentSize * pixelRatio,
    contentSize * pixelRatio,
  );

  if (framed) {
    context.save();
    context.shadowColor = 'rgba(0, 0, 0, 0.45)';
    context.shadowBlur = 3 * pixelRatio;
    context.fillStyle = selected ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.88)';
    context.beginPath();
    context.arc(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2 - 3 * pixelRatio,
      0,
      2 * Math.PI,
    );
    context.fill();
    context.restore();

    context.strokeStyle = selected ? '#1976d2' : 'rgba(70, 70, 70, 0.55)';
    context.lineWidth = (selected ? 2.5 : 1) * pixelRatio;
    context.beginPath();
    context.arc(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2 - 3 * pixelRatio,
      0,
      2 * Math.PI,
    );
    context.stroke();
  }

  context.drawImage(
    image,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    (canvas.width - contained.width) / 2,
    (canvas.height - contained.height) / 2,
    contained.width,
    contained.height,
  );

  return context.getImageData(0, 0, canvas.width, canvas.height);
};

export const reverseCoordinates = (it) => {
  if (!it) {
    return it;
  }
  if (Array.isArray(it)) {
    if (it.length === 2 && typeof it[0] === 'number' && typeof it[1] === 'number') {
      return [it[1], it[0]];
    }
    return it.map((it) => reverseCoordinates(it));
  }
  return {
    ...it,
    coordinates: reverseCoordinates(it.coordinates),
  };
};

export const geofenceToFeature = (theme, item) => {
  let geometry;
  if (item.area.indexOf('CIRCLE') > -1) {
    const coordinates = item.area
      .replace(/CIRCLE|\(|\)|,/g, ' ')
      .trim()
      .split(/ +/);
    const options = { steps: 32, units: 'meters' };
    const polygon = turfCircle(
      toMapCoordinates(Number(coordinates[1]), Number(coordinates[0])),
      Number(coordinates[2]),
      options,
    );
    geometry = polygon.geometry;
  } else {
    geometry = reverseCoordinates(parse(item.area));
    if (map.coordinateSystem) {
      geometry = transformGeometry(geometry, gcoord.WGS84, coordinateSystem(map.coordinateSystem));
    }
  }
  return {
    id: item.id,
    type: 'Feature',
    geometry,
    properties: {
      name: item.name,
      color: item.attributes.color || theme.palette.geometry.main,
      width: item.attributes.mapLineWidth || 2,
      opacity: item.attributes.mapLineOpacity || 1,
    },
  };
};

export const geometryToArea = (geometry) => {
  const normalized = map.coordinateSystem
    ? transformGeometry(geometry, coordinateSystem(map.coordinateSystem), gcoord.WGS84)
    : geometry;
  return stringify(reverseCoordinates(normalized));
};

export const findFonts = (map) => {
  const { glyphs } = map.getStyle();
  if (glyphs.startsWith('https://tiles.openfreemap.org')) {
    return ['Noto Sans Regular'];
  }
  if (glyphs.startsWith('https://api.os.uk')) {
    return ['Source Sans Pro Regular'];
  }
  return ['Open Sans Regular', 'Arial Unicode MS Regular'];
};
