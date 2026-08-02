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
