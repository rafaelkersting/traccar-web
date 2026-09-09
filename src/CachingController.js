import { useDispatch, useSelector } from 'react-redux';
import {
  geofencesActions,
  groupsActions,
  driversActions,
  maintenancesActions,
  calendarsActions,
} from './store';
import { useAsyncTask } from './reactHelper';
import fetchOrThrow from './common/util/fetchOrThrow';
import useAccessPermissions from './common/util/useAccessPermissions';

const CachingController = () => {
  const authenticated = useSelector((state) => !!state.session.user);
  const dispatch = useDispatch();
  const access = useAccessPermissions();
  const accessLoaded = access.loaded;
  const canViewGeofences = access.can('geofence.view');
  const canViewGroups = access.can('group.view');
  const canViewDrivers = access.can('driver.view');
  const canViewMaintenances = access.can('maintenance.view');
  const canViewCalendars = access.can('calendar.view');

  useAsyncTask(
    async ({ signal }) => {
      if (authenticated && canViewGeofences) {
        const response = await fetchOrThrow('/api/geofences', { signal });
        dispatch(geofencesActions.refresh(await response.json()));
      } else if (accessLoaded) {
        dispatch(geofencesActions.refresh([]));
      }
    },
    [authenticated, accessLoaded, canViewGeofences, dispatch],
  );

  useAsyncTask(
    async ({ signal }) => {
      if (authenticated && canViewGroups) {
        const response = await fetchOrThrow('/api/groups', { signal });
        dispatch(groupsActions.refresh(await response.json()));
      } else if (accessLoaded) {
        dispatch(groupsActions.refresh([]));
      }
    },
    [authenticated, accessLoaded, canViewGroups, dispatch],
  );

  useAsyncTask(
    async ({ signal }) => {
      if (authenticated && canViewDrivers) {
        const response = await fetchOrThrow('/api/drivers', { signal });
        dispatch(driversActions.refresh(await response.json()));
      } else if (accessLoaded) {
        dispatch(driversActions.refresh([]));
      }
    },
    [authenticated, accessLoaded, canViewDrivers, dispatch],
  );

  useAsyncTask(
    async ({ signal }) => {
      if (authenticated && canViewMaintenances) {
        const response = await fetchOrThrow('/api/maintenance', { signal });
        dispatch(maintenancesActions.refresh(await response.json()));
      } else if (accessLoaded) {
        dispatch(maintenancesActions.refresh([]));
      }
    },
    [authenticated, accessLoaded, canViewMaintenances, dispatch],
  );

  useAsyncTask(
    async ({ signal }) => {
      if (authenticated && canViewCalendars) {
        const response = await fetchOrThrow('/api/calendars', { signal });
        dispatch(calendarsActions.refresh(await response.json()));
      } else if (accessLoaded) {
        dispatch(calendarsActions.refresh([]));
      }
    },
    [authenticated, accessLoaded, canViewCalendars, dispatch],
  );

  return null;
};

export default CachingController;
