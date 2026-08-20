import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { mergeVehicleTelemetry } from './vehicleTelemetry';

const storagePrefix = 'kersting.vehicleTelemetry.v1';

const getStorageKey = (userId, deviceId) => `${storagePrefix}.${userId}.${deviceId}`;

const readStoredTelemetry = (key) => {
  try {
    return JSON.parse(window.sessionStorage.getItem(key)) || {};
  } catch {
    return {};
  }
};

const storeTelemetry = (key, telemetry) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(telemetry));
  } catch {
    // The live session still keeps the reading when browser storage is unavailable.
  }
};

const useVehicleTelemetry = (deviceId, position) => {
  const userId = useSelector((state) => state.session.user?.id);
  const storageKey = getStorageKey(userId || 'anonymous', deviceId);
  const [cache, setCache] = useState(() => ({
    storageKey,
    telemetry: readStoredTelemetry(storageKey),
  }));
  const telemetry =
    cache.storageKey === storageKey ? cache.telemetry : readStoredTelemetry(storageKey);

  const resolvedTelemetry = useMemo(
    () => mergeVehicleTelemetry(telemetry, position),
    [telemetry, position],
  );

  useEffect(() => {
    if (cache.storageKey !== storageKey || resolvedTelemetry !== cache.telemetry) {
      setCache({ storageKey, telemetry: resolvedTelemetry });
    }
    if (Object.keys(resolvedTelemetry).length) {
      storeTelemetry(storageKey, resolvedTelemetry);
    }
  }, [cache, resolvedTelemetry, storageKey]);

  return resolvedTelemetry;
};

export default useVehicleTelemetry;
