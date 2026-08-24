import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import fetchOrThrow from './fetchOrThrow';
import { hasAccessPermission } from './accessPermissions';

let userId;
let request;
let state = {
  loaded: false,
  legacy: false,
  permissions: [],
  profilePermissions: [],
  allowedOverrides: [],
  denied: [],
};
const listeners = new Set();
let refreshTimer;

const handleFocus = () => load(userId, true);
const handleVisibility = () => {
  if (document.visibilityState === 'visible') {
    load(userId, true);
  }
};

const emit = (nextState) => {
  state = nextState;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== 'undefined') {
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    refreshTimer = window.setInterval(handleFocus, 60000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== 'undefined') {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(refreshTimer);
    }
  };
};

const load = (nextUserId, force = false) => {
  if (!nextUserId) {
    userId = nextUserId;
    request = null;
    emit({ ...state, loaded: false, legacy: false });
    return;
  }
  if (!force && userId === nextUserId && (request || state.loaded)) {
    return;
  }
  userId = nextUserId;
  emit({ ...state, loaded: false, legacy: false, error: null });
  request = fetchOrThrow('/api/access/session')
    .then((response) => response.json())
    .then((access) => {
      if (userId === nextUserId) {
        emit({ ...access, loaded: true, error: null });
      }
    })
    .catch((error) => {
      if (userId === nextUserId) {
        emit({
          loaded: true,
          legacy: false,
          permissions: [],
          profilePermissions: [],
          allowedOverrides: [],
          denied: [],
          error: error.message,
        });
      }
    })
    .finally(() => {
      request = null;
    });
};

export const refreshAccessPermissions = () => load(userId, true);

const useAccessPermissions = () => {
  const sessionUserId = useSelector((current) => current.session.user?.id);
  const access = useSyncExternalStore(subscribe, () => state);

  useEffect(() => {
    load(sessionUserId);
  }, [sessionUserId]);

  return useMemo(
    () => ({
      ...access,
      profileId: access.profileId ?? 0,
      can: (permission) => hasAccessPermission(access, permission),
    }),
    [access],
  );
};

export default useAccessPermissions;
