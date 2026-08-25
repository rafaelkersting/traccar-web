import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACCESS_MODULES,
  hasAccessPermission,
  permissionSource,
} from '../src/common/util/accessPermissions.js';

test('catálogo RBAC contém somente chaves únicas', () => {
  const permissions = ACCESS_MODULES.flatMap((module) =>
    module.permissions.map(([permission]) => permission),
  );
  assert.equal(new Set(permissions).size, permissions.length);
  assert.deepEqual(
    ACCESS_MODULES.map((module) => module.key),
    [
      'map',
      'devices',
      'appearance',
      'commands',
      'reports',
      'geofences',
      'groups',
      'drivers',
      'calendars',
      'maintenance',
      'notifications',
      'users',
      'access-profiles',
      'attributes',
      'announcement',
      'server',
      'preferences',
    ],
  );
  assert.equal(permissions.length, 72);
});
test('negação individual prevalece sobre perfil e permissão adicional', () => {
  const access = {
    profilePermissions: ['driver.view'],
    allowedOverrides: ['driver.view'],
    denied: ['driver.view'],
  };
  assert.equal(permissionSource(access, 'driver.view'), 'deny');
});

test('origem efetiva diferencia perfil e exceção permitida', () => {
  assert.equal(
    permissionSource({ profilePermissions: ['calendar.view'] }, 'calendar.view'),
    'profile',
  );
  assert.equal(
    permissionSource({ allowedOverrides: ['maintenance.edit'] }, 'maintenance.edit'),
    'allow',
  );
});

test('todas as permissões migradas ficam negadas em OFF e permitidas em ON', () => {
  const permissions = ACCESS_MODULES.flatMap((module) =>
    module.permissions.map(([permission]) => permission),
  );
  permissions.forEach((permission) => {
    assert.equal(
      hasAccessPermission({ loaded: true, permissions: [], denied: [] }, permission),
      false,
    );
    assert.equal(
      hasAccessPermission({ loaded: true, permissions: [permission], denied: [] }, permission),
      true,
    );
    assert.equal(
      hasAccessPermission(
        { loaded: true, permissions: [permission], denied: [permission] },
        permission,
      ),
      false,
    );
  });
});
