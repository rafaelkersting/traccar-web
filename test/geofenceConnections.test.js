import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGeofencePermissionChanges,
  createGeofenceConnections,
  hasGeofenceConnections,
  selectAllCurrentDeviceIds,
} from '../src/settings/geofenceConnections.js';

test('identifica geocerca sem dispositivo ou grupo vinculado', () => {
  const connections = createGeofenceConnections();

  assert.equal(hasGeofenceConnections(connections), false);
});

test('mantém separadas as associações diretas e por grupo', () => {
  const connections = createGeofenceConnections({ deviceIds: [1, 2], groupIds: [7] });

  assert.equal(hasGeofenceConnections(connections), true);
  assert.deepEqual(connections.deviceIds, [1, 2]);
  assert.deepEqual(connections.groupIds, [7]);
});

test('seleciona somente os dispositivos existentes no momento da ação', () => {
  const currentDevices = [{ id: 1 }, { id: 2 }];
  const selectedIds = selectAllCurrentDeviceIds(currentDevices);
  const devicesAfterSelection = [...currentDevices, { id: 3 }];

  assert.deepEqual(selectedIds, [1, 2]);
  assert.equal(devicesAfterSelection.length, 3);
  assert.equal(selectedIds.includes(3), false);
});

test('gera somente inclusões e remoções necessárias', () => {
  const connections = createGeofenceConnections({ deviceIds: [1, 2], groupIds: [7] });
  connections.deviceIds = [2, 3];
  connections.groupIds = [8];

  assert.deepEqual(buildGeofencePermissionChanges(10, connections), {
    addDevices: [{ deviceId: 3, geofenceId: 10 }],
    removeDevices: [{ deviceId: 1, geofenceId: 10 }],
    addGroups: [{ groupId: 8, geofenceId: 10 }],
    removeGroups: [{ groupId: 7, geofenceId: 10 }],
  });
});

test('preserva vínculos existentes quando a edição não os altera', () => {
  const connections = createGeofenceConnections({ deviceIds: [1, 2], groupIds: [7] });

  assert.deepEqual(buildGeofencePermissionChanges(10, connections), {
    addDevices: [],
    removeDevices: [],
    addGroups: [],
    removeGroups: [],
  });
});
