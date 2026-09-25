const difference = (values, reference) => values.filter((value) => !reference.includes(value));

export const createGeofenceConnections = ({ deviceIds = [], groupIds = [] } = {}) => ({
  deviceIds: [...deviceIds],
  groupIds: [...groupIds],
  originalDeviceIds: [...deviceIds],
  originalGroupIds: [...groupIds],
});

export const selectAllCurrentDeviceIds = (devices) => devices.map((device) => device.id);

export const hasGeofenceConnections = ({ deviceIds, groupIds }) =>
  deviceIds.length > 0 || groupIds.length > 0;

export const buildGeofencePermissionChanges = (geofenceId, connections) => {
  const createDevicePermission = (deviceId) => ({ deviceId, geofenceId });
  const createGroupPermission = (groupId) => ({ groupId, geofenceId });

  return {
    addDevices: difference(connections.deviceIds, connections.originalDeviceIds).map(
      createDevicePermission,
    ),
    removeDevices: difference(connections.originalDeviceIds, connections.deviceIds).map(
      createDevicePermission,
    ),
    addGroups: difference(connections.groupIds, connections.originalGroupIds).map(
      createGroupPermission,
    ),
    removeGroups: difference(connections.originalGroupIds, connections.groupIds).map(
      createGroupPermission,
    ),
  };
};
