import carHatchImage from '../../resources/images/marker3d/car-hatch-hd.png';
import carPickupImage from '../../resources/images/marker3d/car-pickup-hd.png';
import carSedanImage from '../../resources/images/marker3d/car-sedan-hd.png';
import carSuvImage from '../../resources/images/marker3d/car-suv-hd.png';
import motorcycleStreetImage from '../../resources/images/marker3d/motorcycle-street-hd.png';
import motorcycleScooterImage from '../../resources/images/marker3d/motorcycle-scooter-hd.png';
import motorcycleTrailImage from '../../resources/images/marker3d/motorcycle-trail-hd.png';
import truckLightImage from '../../resources/images/marker3d/truck-light-hd.png';
import truckMediumImage from '../../resources/images/marker3d/truck-medium-hd.png';
import truckHeavyImage from '../../resources/images/marker3d/truck-heavy-hd.png';
import vanCargoImage from '../../resources/images/marker3d/van-cargo-hd.png';
import vanPassengerImage from '../../resources/images/marker3d/van-passenger-hd.png';
import busUrbanImage from '../../resources/images/marker3d/bus-urban-hd.png';
import busCoachImage from '../../resources/images/marker3d/bus-coach-hd.png';
import boatStandardImage from '../../resources/images/marker3d/boat-standard-hd.png';
import boatSpeedboatImage from '../../resources/images/marker3d/boat-speedboat-hd.png';
import tractorStandardImage from '../../resources/images/marker3d/tractor-standard-hd.png';
import machineLoaderImage from '../../resources/images/marker3d/machine-loader-hd.png';
import genericStandardImage from '../../resources/images/marker3d/generic-standard-hd.png';
import {
  marker3dAttribute,
  marker3dCategoryAttribute,
  marker3dColorAttribute,
  marker3dModelAttribute,
} from './marker3dSelection';

export const defaultMarker3dColorId = 'silver';

export const marker3dColors = Object.freeze([
  { id: 'silver', name: 'Prata', value: '#b8bec6', border: '#747b84' },
  { id: 'white', name: 'Branco', value: '#f5f5f2', border: '#9ca3af' },
  { id: 'black', name: 'Preto', value: '#24272d', border: '#737985' },
  { id: 'gray', name: 'Cinza', value: '#727983', border: '#4b5159' },
  { id: 'blue', name: 'Azul', value: '#1976d2', border: '#0d47a1' },
  { id: 'red', name: 'Vermelho', value: '#d32f2f', border: '#8e1c1c' },
  { id: 'green', name: 'Verde', value: '#2e7d32', border: '#145a1c' },
  { id: 'yellow', name: 'Amarelo', value: '#fbc02d', border: '#a66b00' },
]);

const category = (id, name, image, models) =>
  Object.freeze({
    id,
    name,
    image,
    models: Object.freeze(
      models.map((model) =>
        Object.freeze({
          ...model,
          id: `${id}:${model.id}`,
          categoryId: id,
          categoryName: name,
          image: model.image || image,
        }),
      ),
    ),
  });

export const marker3dCategories = Object.freeze([
  category('car', 'Carro', carHatchImage, [
    { modelId: 'hatch', id: 'hatch', name: 'Hatch', image: carHatchImage },
    { modelId: 'sedan', id: 'sedan', name: 'Sedan', image: carSedanImage },
    { modelId: 'suv', id: 'suv', name: 'SUV', image: carSuvImage },
    { modelId: 'pickup', id: 'pickup', name: 'Pickup', image: carPickupImage },
  ]),
  category('motorcycle', 'Moto', motorcycleStreetImage, [
    { modelId: 'street', id: 'street', name: 'Street', image: motorcycleStreetImage },
    { modelId: 'scooter', id: 'scooter', name: 'Scooter', image: motorcycleScooterImage },
    { modelId: 'trail', id: 'trail', name: 'Trail', image: motorcycleTrailImage },
  ]),
  category('truck', 'Caminhão', truckLightImage, [
    { modelId: 'light', id: 'light', name: 'Leve', image: truckLightImage },
    { modelId: 'medium', id: 'medium', name: 'Médio', image: truckMediumImage },
    { modelId: 'heavy', id: 'heavy', name: 'Pesado', image: truckHeavyImage },
  ]),
  category('van', 'Van', vanCargoImage, [
    { modelId: 'cargo', id: 'cargo', name: 'Carga', image: vanCargoImage },
    { modelId: 'passenger', id: 'passenger', name: 'Passageiros', image: vanPassengerImage },
  ]),
  category('bus', 'Ônibus', busUrbanImage, [
    { modelId: 'urban', id: 'urban', name: 'Urbano', image: busUrbanImage },
    { modelId: 'coach', id: 'coach', name: 'Rodoviário', image: busCoachImage },
  ]),
  category('boat', 'Barco / lancha', boatStandardImage, [
    { modelId: 'boat', id: 'boat', name: 'Barco', image: boatStandardImage },
    { modelId: 'speedboat', id: 'speedboat', name: 'Lancha', image: boatSpeedboatImage },
  ]),
  category('tractor', 'Trator / máquina', tractorStandardImage, [
    { modelId: 'tractor', id: 'tractor', name: 'Trator', image: tractorStandardImage },
    { modelId: 'machine', id: 'machine', name: 'Máquina', image: machineLoaderImage },
  ]),
  category('pickup', 'SUV / pickup', carSuvImage, [
    { modelId: 'suv', id: 'suv', name: 'SUV', image: carSuvImage },
    { modelId: 'pickup', id: 'pickup', name: 'Pickup', image: carPickupImage },
  ]),
  category('generic', 'Genérico', genericStandardImage, [
    { modelId: 'standard', id: 'standard', name: 'Padrão', image: genericStandardImage },
  ]),
]);

// Backward-compatible alias: the public gallery now exposes categories instead of every model.
export const marker3dCatalog = marker3dCategories;

const categoryById = new Map(marker3dCategories.map((item) => [item.id, item]));
const markerById = new Map(
  marker3dCategories.flatMap((item) => item.models.map((model) => [model.id, model])),
);
const colorById = new Map(marker3dColors.map((color) => [color.id, color]));

export const getMarker3dCategory = (id) => categoryById.get(id) || null;

export const getMarker3dModels = (categoryId) => getMarker3dCategory(categoryId)?.models || [];

export const getMarker3dColor = (id) => colorById.get(id) || colorById.get(defaultMarker3dColorId);

export const getMarker3dPreset = (id) => {
  if (!id) {
    return null;
  }
  if (markerById.has(id)) {
    return markerById.get(id);
  }
  // Legacy identifiers such as "car" resolve to the first model in the new category.
  return getMarker3dCategory(id)?.models[0] || null;
};

export const getMarker3dModel = (categoryId, modelId) =>
  getMarker3dModels(categoryId).find((model) => model.modelId === modelId) || null;

export const createMarker3dSelection = (categoryId, modelId, colorId = defaultMarker3dColorId) => {
  const preset = getMarker3dModel(categoryId, modelId);
  if (!preset) {
    return null;
  }
  const color = getMarker3dColor(colorId);
  return {
    ...preset,
    colorId: color.id,
    colorName: color.name,
    colorValue: color.value,
    colorBorder: color.border,
  };
};

export const getDeviceMarker3dPreset = (device) => {
  const attributes = device?.attributes || {};
  const storedPreset = getMarker3dPreset(attributes[marker3dAttribute]);
  const categoryId = attributes[marker3dCategoryAttribute] || storedPreset?.categoryId;
  const modelId = attributes[marker3dModelAttribute] || storedPreset?.modelId;
  if (!categoryId || !modelId) {
    return null;
  }
  return createMarker3dSelection(categoryId, modelId, attributes[marker3dColorAttribute]);
};
