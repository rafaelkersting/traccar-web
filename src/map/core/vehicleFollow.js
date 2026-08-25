import {
  isPositionMoving,
  markerMotionSettings,
  normalizeCourse,
  resolveAnimationDuration,
} from './deviceMarkerMotion.js';

export const vehicleFollowModes = Object.freeze({
  north: 'north',
  heading: 'heading',
});

export const defaultVehicleFollowMode = vehicleFollowModes.heading;

export const normalizeVehicleFollowMode = (value) =>
  Object.values(vehicleFollowModes).includes(value) ? value : defaultVehicleFollowMode;

export const shortestCourseDelta = (from, to) => {
  const start = normalizeCourse(from);
  const end = normalizeCourse(to);
  if (start === null || end === null) {
    return null;
  }
  return ((end - start + 540) % 360) - 180;
};

export const resolveBearingTarget = (currentBearing, desiredBearing) => {
  const delta = shortestCourseDelta(currentBearing, desiredBearing);
  return delta === null ? null : Number(currentBearing) + delta;
};

export const resolveFollowHeading = (previousHeading, position) => {
  const previous = normalizeCourse(previousHeading);
  const current = normalizeCourse(position?.course);
  if (isPositionMoving(position) && current !== null) {
    return current;
  }
  return previous ?? current;
};

export const resolveFollowBearing = (mode, currentBearing, heading) => {
  const desired =
    normalizeVehicleFollowMode(mode) === vehicleFollowModes.heading ? normalizeCourse(heading) : 0;
  return desired === null ? null : resolveBearingTarget(currentBearing, desired);
};

const validCoordinate = (value, limit) =>
  value !== null &&
  value !== undefined &&
  !(typeof value === 'string' && !value.trim()) &&
  Number.isFinite(Number(value)) &&
  Math.abs(Number(value)) <= limit;

export const isValidFollowPosition = (position) =>
  validCoordinate(position?.latitude, 90) && validCoordinate(position?.longitude, 180);

export const resolveFollowDuration = (previousPosition, position) => {
  const duration = resolveAnimationDuration(previousPosition, position);
  return duration > 0 ? duration : markerMotionSettings.minimumDuration;
};

export const resolveFollowOffset = (mode, viewportHeight, desktop) => {
  if (normalizeVehicleFollowMode(mode) !== vehicleFollowModes.heading) {
    return [0, 0];
  }
  const height = Math.max(0, Number(viewportHeight) || 0);
  return [0, Math.round(height * (desktop ? 0.08 : 0.14))];
};
