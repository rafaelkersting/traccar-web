import assert from 'node:assert/strict';
import test from 'node:test';
import { getUserAccountCapabilities } from '../src/common/util/userAccountPermissions.js';

const capabilities = (permissions, options = {}) =>
  getUserAccountCapabilities({
    can: (permission) => permissions.includes(permission),
    self: true,
    creating: false,
    manager: false,
    administrator: false,
    ...options,
  });

test('permissões da própria conta são independentes em ON e OFF', () => {
  const matrix = [
    ['account.basic.edit', 'basic'],
    ['account.email.edit', 'email'],
    ['account.password.change', 'password'],
    ['account.security.edit', 'security'],
    ['account.preferences.edit', 'preferences'],
    ['account.location.edit', 'location'],
    ['account.attributes.edit', 'attributes'],
  ];

  matrix.forEach(([permission, capability]) => {
    assert.equal(capabilities([])[capability], false);
    assert.equal(capabilities([permission])[capability], true);
  });
});

test('permissão da própria conta não permite editar outro usuário', () => {
  const result = capabilities(['account.preferences.edit'], { self: false });
  assert.equal(result.preferences, false);
  assert.equal(result.editOther, false);
});

test('atributos e seções sensíveis de outro usuário exigem permissões específicas', () => {
  const result = capabilities(
    [
      'user.edit',
      'user.attributes.edit',
      'user.native-restrictions.edit',
      'user.access-control.edit',
    ],
    { self: false, manager: true, administrator: true },
  );
  assert.equal(result.basic, true);
  assert.equal(result.attributes, true);
  assert.equal(result.nativeRestrictions, true);
  assert.equal(result.accessControl, true);
});
