export const GPS_FIX_MAX_AGE = 10 * 60 * 1000;

export const getDeviceCommunicationState = (device) => {
  if (device?.status === 'online') {
    return 'online';
  }
  if (device?.status === 'offline') {
    return 'offline';
  }
  if (device?.status === 'unknown') {
    return 'unknown';
  }
  return 'noData';
};

export const getGpsFixState = (position, now = Date.now(), maxAge = GPS_FIX_MAX_AGE) => {
  if (!position) {
    return 'noData';
  }
  if (position.valid !== true) {
    return 'invalid';
  }
  const fixTime = Date.parse(position.fixTime || '');
  if (!Number.isFinite(fixTime)) {
    return 'noData';
  }
  const age = now - fixTime;
  if (age < -60 * 1000) {
    return 'invalid';
  }
  return age <= maxAge ? 'connected' : 'stale';
};
