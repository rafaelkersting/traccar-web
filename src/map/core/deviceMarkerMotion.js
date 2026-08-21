const KNOTS_PER_KILOMETER_PER_HOUR = 1 / 1.852;

export const markerMotionSettings = Object.freeze({
  stationarySpeed: 3 * KNOTS_PER_KILOMETER_PER_HOUR,
  minimumDuration: 450,
  maximumDuration: 2500,
  maximumGap: 120000,
  maximumAnimatedDistance: 5000,
});

// Central integration point for a future map-matching provider.
export const resolveMarkerTarget = (position) => ({
  longitude: position.longitude,
  latitude: position.latitude,
});

const finiteNumber = (value) => {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const normalizeCourse = (value) => {
  const course = finiteNumber(value);
  return course === null ? null : ((course % 360) + 360) % 360;
};

export const isPositionMoving = (position) => {
  const speed = finiteNumber(position?.speed);
  return speed !== null && speed > markerMotionSettings.stationarySpeed;
};

export const resolveMarkerMotionState = (deviceStatus, position) => {
  if (deviceStatus !== 'online') {
    return 'offline';
  }
  return isPositionMoving(position) ? 'moving' : 'stopped';
};

export const resolveStableCourse = (previousCourse, position) => {
  const currentCourse = normalizeCourse(position?.course);
  const stablePrevious = normalizeCourse(previousCourse);
  if (isPositionMoving(position)) {
    return currentCourse ?? stablePrevious ?? 0;
  }
  return stablePrevious ?? currentCourse ?? 0;
};

export const interpolateCourse = (from, to, progress) => {
  const start = normalizeCourse(from) ?? 0;
  const end = normalizeCourse(to) ?? start;
  const delta = ((end - start + 540) % 360) - 180;
  return normalizeCourse(start + delta * progress);
};

export const distanceBetweenPositions = (from, to) => {
  const latitude1 = (from.latitude * Math.PI) / 180;
  const latitude2 = (to.latitude * Math.PI) / 180;
  const latitudeDelta = latitude2 - latitude1;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const resolveAnimationDuration = (previousPosition, nextPosition) => {
  if (!previousPosition || !nextPosition) {
    return 0;
  }
  const previousTime = Date.parse(previousPosition.fixTime);
  const nextTime = Date.parse(nextPosition.fixTime);
  const gap = nextTime - previousTime;
  if (
    !Number.isFinite(gap) ||
    gap <= 0 ||
    gap > markerMotionSettings.maximumGap ||
    distanceBetweenPositions(previousPosition, nextPosition) >
      markerMotionSettings.maximumAnimatedDistance
  ) {
    return 0;
  }
  return Math.min(
    markerMotionSettings.maximumDuration,
    Math.max(markerMotionSettings.minimumDuration, gap * 0.8),
  );
};

const easeInOut = (progress) => progress * progress * (3 - 2 * progress);

export const sampleMarkerTransition = (transition, timestamp) => {
  if (!transition.duration) {
    return {
      longitude: transition.target.longitude,
      latitude: transition.target.latitude,
      course: transition.targetCourse,
      complete: true,
    };
  }
  const linearProgress = Math.min(
    1,
    Math.max(0, (timestamp - transition.startedAt) / transition.duration),
  );
  const progress = easeInOut(linearProgress);
  return {
    longitude:
      transition.source.longitude +
      (transition.target.longitude - transition.source.longitude) * progress,
    latitude:
      transition.source.latitude +
      (transition.target.latitude - transition.source.latitude) * progress,
    course: interpolateCourse(transition.sourceCourse, transition.targetCourse, progress),
    complete: linearProgress >= 1,
  };
};

export const createMarkerTransition = ({
  previous,
  previousPosition,
  position,
  deviceStatus,
  timestamp,
  animate,
}) => {
  const source = previous
    ? sampleMarkerTransition(previous, timestamp)
    : { longitude: position.longitude, latitude: position.latitude, course: position.course };
  const targetCourse = resolveStableCourse(previous?.lastValidCourse, position);
  const target = resolveMarkerTarget(position);
  return {
    key: `${position.id}:${position.longitude}:${position.latitude}:${position.course}:${position.speed}`,
    source,
    target,
    sourceCourse: source.course ?? targetCourse,
    targetCourse,
    lastValidCourse: targetCourse,
    startedAt: timestamp,
    duration: animate ? resolveAnimationDuration(previousPosition, position) : 0,
    markerState: resolveMarkerMotionState(deviceStatus, position),
  };
};

export const vehicleMarkerCategories = new Set([
  'bus',
  'camper',
  'car',
  'crane',
  'motorcycle',
  'offroad',
  'pickup',
  'scooter',
  'tractor',
  'trailer',
  'tram',
  'truck',
  'van',
]);

export const isRotatableVehicleMarker = (category, customMarker = false) =>
  customMarker || vehicleMarkerCategories.has(category);
