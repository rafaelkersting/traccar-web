import carImage from '../../resources/images/marker3d/car.png';
import motorcycleImage from '../../resources/images/marker3d/motorcycle.png';
import truckImage from '../../resources/images/marker3d/truck.png';
import vanImage from '../../resources/images/marker3d/van.png';
import busImage from '../../resources/images/marker3d/bus.png';
import boatImage from '../../resources/images/marker3d/boat.png';
import tractorImage from '../../resources/images/marker3d/tractor.png';
import pickupImage from '../../resources/images/marker3d/pickup.png';
import genericImage from '../../resources/images/marker3d/generic.png';
import { marker3dAttribute } from './marker3dSelection';

export const marker3dCatalog = Object.freeze([
  { id: 'car', name: 'Carro', image: carImage },
  { id: 'motorcycle', name: 'Moto', image: motorcycleImage },
  { id: 'truck', name: 'Caminhão', image: truckImage },
  { id: 'van', name: 'Van', image: vanImage },
  { id: 'bus', name: 'Ônibus', image: busImage },
  { id: 'boat', name: 'Barco / lancha', image: boatImage },
  { id: 'tractor', name: 'Trator / máquina', image: tractorImage },
  { id: 'pickup', name: 'SUV / pickup', image: pickupImage },
  { id: 'generic', name: 'Genérico', image: genericImage },
]);

const marker3dById = new Map(marker3dCatalog.map((marker) => [marker.id, marker]));

export const getMarker3dPreset = (id) => marker3dById.get(id) || null;

export const getDeviceMarker3dPreset = (device) =>
  getMarker3dPreset(device?.attributes?.[marker3dAttribute]);
