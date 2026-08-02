export const systemCommandKeys = {
  system: 'systemDefault',
  active: 'systemDefaultActive',
  order: 'systemDefaultOrder',
  confirmation: 'systemDefaultConfirmation',
  critical: 'systemDefaultCritical',
  newUsers: 'systemDefaultNewUsers',
  existingUsers: 'systemDefaultExistingUsers',
  profiles: 'systemDefaultProfiles',
  category: 'systemDefaultCategory',
  summary: 'systemDefaultSummary',
  userScope: 'systemDefaultUserScope',
  userIds: 'systemDefaultUserIds',
  userGroupIds: 'systemDefaultUserGroupIds',
  deviceScope: 'systemDefaultDeviceScope',
  deviceIds: 'systemDefaultDeviceIds',
  deviceGroupIds: 'systemDefaultDeviceGroupIds',
};

export const catalogProfiles = [
  { id: 'administrator', title: 'Administrador' },
  { id: 'manager', title: 'Gestor' },
  { id: 'client', title: 'Cliente' },
];

export const parseCatalogIds = (value) =>
  String(value || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter(
      (item, index, values) => Number.isInteger(item) && item > 0 && values.indexOf(item) === index,
    );

export const serializeCatalogIds = (ids = []) =>
  [...new Set(ids.map(Number))].filter(Boolean).join(',');

export const getEligibleCatalogUsers = (users = [], attributes = {}) => {
  const profiles = String(attributes[systemCommandKeys.profiles] || '')
    .split(',')
    .map((profile) => profile.trim())
    .filter(Boolean);
  const scope = attributes[systemCommandKeys.userScope] || 'all';
  const userIds = parseCatalogIds(attributes[systemCommandKeys.userIds]);
  const groupIds = parseCatalogIds(attributes[systemCommandKeys.userGroupIds]);
  return users.filter((user) => {
    if (user.disabled || user.readonly || user.temporary || !profiles.includes(user.profile)) {
      return false;
    }
    if (scope === 'users') {
      return userIds.includes(user.id);
    }
    if (scope === 'groups') {
      return user.groupIds?.some((groupId) => groupIds.includes(groupId));
    }
    return true;
  });
};

export const commandCategories = [
  { id: 'location', title: 'LOCALIZAÇÃO' },
  { id: 'equipment', title: 'EQUIPAMENTO' },
  { id: 'security', title: 'SEGURANÇA' },
  { id: 'other', title: 'OUTROS' },
];

export const isSystemCommand = (command) =>
  Boolean(command?.attributes?.[systemCommandKeys.system]);

export const isCriticalCommand = (command) =>
  Boolean(command?.attributes?.[systemCommandKeys.critical]);

export const getCommandCategory = (command) =>
  command?.attributes?.[systemCommandKeys.category] || 'other';

export const groupQuickCommands = (commands = []) =>
  commandCategories
    .map((category) => ({
      ...category,
      commands: commands
        .filter((command) => getCommandCategory(command) === category.id)
        .sort(
          (first, second) =>
            (first.attributes?.[systemCommandKeys.order] || 0) -
            (second.attributes?.[systemCommandKeys.order] || 0),
        ),
    }))
    .filter((category) => category.commands.length);

export const getCriticalCommandSafety = (command, position, now = Date.now()) => {
  if (!isCriticalCommand(command)) {
    return { blocked: false, stale: false };
  }
  const fixTime = position?.fixTime ? new Date(position.fixTime).getTime() : 0;
  const stale = !fixTime || now - fixTime > 10 * 60 * 1000;
  const moving = command.type === 'engineStop' && Number(position?.speed || 0) > 0.5;
  return { blocked: moving, stale };
};

export const getCommandResultMessage = (status) =>
  status === 202
    ? 'Comando aceito e enfileirado para envio quando o dispositivo estiver disponível.'
    : 'Solicitação aceita pelo servidor. Aguarde a confirmação do equipamento.';
