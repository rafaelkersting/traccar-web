import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCommandResultMessage,
  getCriticalCommandSafety,
  getEligibleCatalogUsers,
  groupQuickCommands,
  isSystemCommand,
  parseCatalogIds,
} from '../src/settings/commandCatalog.js';

const command = (type, category, order = 0, critical = false) => ({
  type,
  attributes: {
    systemDefault: true,
    systemDefaultActive: true,
    systemDefaultCategory: category,
    systemDefaultOrder: order,
    systemDefaultCritical: critical,
  },
});

test('organiza comandos rápidos por categoria e ordem', () => {
  const groups = groupQuickCommands([
    command('engineStop', 'security', 30, true),
    command('positionSingle', 'location', 10),
    command('engineResume', 'security', 40, true),
  ]);
  assert.deepEqual(
    groups.map((group) => [group.id, group.commands.map((item) => item.type)]),
    [
      ['location', ['positionSingle']],
      ['security', ['engineStop', 'engineResume']],
    ],
  );
  assert.equal(isSystemCommand(groups[0].commands[0]), true);
});

test('impede bloqueio quando a última velocidade indica movimento', () => {
  const result = getCriticalCommandSafety(command('engineStop', 'security', 30, true), {
    speed: 5,
    fixTime: new Date().toISOString(),
  });
  assert.equal(result.blocked, true);
  assert.equal(result.stale, false);
});

test('avisa quando a última posição é antiga sem afirmar resultado físico', () => {
  const result = getCriticalCommandSafety(command('engineResume', 'security', 40, true), {
    speed: 0,
    fixTime: '2020-01-01T00:00:00.000Z',
  });
  assert.equal(result.blocked, false);
  assert.equal(result.stale, true);
  assert.match(getCommandResultMessage(200), /Solicitação aceita/);
  assert.match(getCommandResultMessage(202), /enfileirado/);
});

const users = [
  { id: 1, profile: 'administrator', groupIds: [10] },
  { id: 2, profile: 'manager', groupIds: [20] },
  { id: 3, profile: 'client', groupIds: [10] },
  { id: 4, profile: 'manager', groupIds: [10], disabled: true },
];

test('filtra usuários pelos perfis e ignora desativados', () => {
  const result = getEligibleCatalogUsers(users, {
    systemDefaultProfiles: 'administrator,manager',
    systemDefaultUserScope: 'all',
  });
  assert.deepEqual(
    result.map((user) => user.id),
    [1, 2],
  );
});

test('filtra usuários específicos e por grupos sem duplicar ids', () => {
  assert.deepEqual(parseCatalogIds('1, 2, 1, inválido'), [1, 2]);
  assert.deepEqual(
    getEligibleCatalogUsers(users, {
      systemDefaultProfiles: 'administrator,manager,client',
      systemDefaultUserScope: 'users',
      systemDefaultUserIds: '2,3',
    }).map((user) => user.id),
    [2, 3],
  );
  assert.deepEqual(
    getEligibleCatalogUsers(users, {
      systemDefaultProfiles: 'administrator,manager,client',
      systemDefaultUserScope: 'groups',
      systemDefaultUserGroupIds: '10',
    }).map((user) => user.id),
    [1, 3],
  );
});

test('não considera usuários quando nenhum perfil está selecionado', () => {
  assert.deepEqual(getEligibleCatalogUsers(users, { systemDefaultProfiles: '' }), []);
});
