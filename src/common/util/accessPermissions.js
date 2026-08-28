export const ACCESS_MODULES = [
  {
    key: 'map',
    label: 'Mapa',
    permissions: [
      ['map.view', 'Visualizar mapa'],
      ['map.devices', 'Visualizar dispositivos no mapa'],
      ['map.follow', 'Seguir veículo'],
      ['map.history', 'Visualizar histórico'],
    ],
  },
  {
    key: 'devices',
    label: 'Dispositivos',
    permissions: [
      ['device.view', 'Visualizar'],
      ['device.create', 'Criar'],
      ['device.edit', 'Editar dados gerais'],
      ['device.delete', 'Excluir'],
      ['device.change-group', 'Alterar grupo'],
    ],
  },
  {
    key: 'appearance',
    label: 'Aparência do dispositivo',
    permissions: [
      ['device.appearance.view', 'Visualizar aparência'],
      ['device.appearance.card-image', 'Alterar imagem do card'],
      ['device.appearance.map-marker', 'Alterar marcador do mapa'],
      ['device.appearance.marker3d', 'Alterar ícone 3D'],
      ['device.appearance.marker-model', 'Alterar modelo do marcador'],
      ['device.appearance.marker-color', 'Alterar cor do marcador'],
      ['device.appearance.custom-upload', 'Enviar imagem personalizada'],
    ],
  },
  {
    key: 'commands',
    label: 'Comandos',
    permissions: [
      ['command.view', 'Visualizar comandos'],
      ['command.create', 'Criar comando salvo'],
      ['command.edit', 'Editar comando salvo'],
      ['command.delete', 'Excluir comando salvo'],
      ['command.send', 'Enviar comandos'],
      ['command.locate', 'Localizar veículo'],
      ['command.lock', 'Bloquear veículo'],
      ['command.unlock', 'Desbloquear veículo'],
    ],
  },
  {
    key: 'reports',
    label: 'Relatórios',
    permissions: [
      ['report.view', 'Visualizar'],
      ['report.generate', 'Gerar'],
      ['report.export', 'Exportar'],
    ],
  },
  {
    key: 'geofences',
    label: 'Cerca Virtual',
    permissions: [
      ['geofence.view', 'Visualizar'],
      ['geofence.create', 'Criar'],
      ['geofence.edit', 'Editar'],
      ['geofence.delete', 'Excluir'],
    ],
  },
  {
    key: 'groups',
    label: 'Grupos',
    permissions: [
      ['group.view', 'Visualizar'],
      ['group.create', 'Criar'],
      ['group.edit', 'Editar'],
      ['group.delete', 'Excluir'],
    ],
  },
  {
    key: 'drivers',
    label: 'Motoristas',
    permissions: [
      ['driver.view', 'Visualizar'],
      ['driver.create', 'Criar'],
      ['driver.edit', 'Editar'],
      ['driver.delete', 'Excluir'],
    ],
  },
  {
    key: 'calendars',
    label: 'Calendários',
    permissions: [
      ['calendar.view', 'Visualizar'],
      ['calendar.create', 'Criar'],
      ['calendar.edit', 'Editar'],
      ['calendar.delete', 'Excluir'],
    ],
  },
  {
    key: 'maintenance',
    label: 'Manutenção',
    permissions: [
      ['maintenance.view', 'Visualizar'],
      ['maintenance.create', 'Criar'],
      ['maintenance.edit', 'Editar'],
      ['maintenance.delete', 'Excluir'],
    ],
  },
  {
    key: 'notifications',
    label: 'Notificações',
    permissions: [
      ['notification.view', 'Visualizar'],
      ['notification.create', 'Criar'],
      ['notification.edit', 'Editar'],
      ['notification.delete', 'Excluir'],
    ],
  },
  {
    key: 'users',
    label: 'Usuários',
    permissions: [
      ['user.view', 'Visualizar'],
      ['user.create', 'Criar'],
      ['user.edit', 'Editar'],
      ['user.delete', 'Excluir'],
      ['user.assign-profile', 'Atribuir Perfil de Acesso'],
      ['user.link-scope', 'Vincular dispositivos e grupos'],
      ['user.access-control.edit', 'Alterar controle de acesso'],
      ['user.native-restrictions.edit', 'Alterar restrições nativas'],
      ['user.attributes.edit', 'Alterar atributos de outros usuários'],
    ],
  },
  {
    key: 'account',
    label: 'Conta do Usuário',
    permissions: [
      ['account.view', 'Visualizar conta'],
      ['account.basic.edit', 'Alterar nome'],
      ['account.email.edit', 'Alterar e-mail'],
      ['account.password.change', 'Alterar senha'],
      ['account.security.edit', 'Alterar segurança e TOTP'],
      ['account.preferences.edit', 'Alterar preferências pessoais'],
      ['account.location.edit', 'Alterar localização padrão'],
      ['account.attributes.edit', 'Alterar atributos da própria conta'],
    ],
  },
  {
    key: 'access-profiles',
    label: 'Perfis de Acesso',
    permissions: [
      ['access-profile.view', 'Visualizar'],
      ['access-profile.create', 'Criar'],
      ['access-profile.edit', 'Editar'],
      ['access-profile.disable', 'Desativar'],
      ['access-profile.assign', 'Atribuir a usuários'],
    ],
  },
  {
    key: 'attributes',
    label: 'Atributos Calculados',
    permissions: [
      ['attribute.view', 'Visualizar'],
      ['attribute.create', 'Criar'],
      ['attribute.edit', 'Editar'],
      ['attribute.delete', 'Excluir'],
    ],
  },
  {
    key: 'announcement',
    label: 'Anúncio',
    permissions: [
      ['announcement.view', 'Visualizar'],
      ['announcement.manage', 'Administrar'],
    ],
  },
  {
    key: 'server',
    label: 'Servidor',
    permissions: [
      ['server.view', 'Visualizar'],
      ['server.manage', 'Administrar'],
    ],
  },
  {
    key: 'preferences',
    label: 'Preferências',
    permissions: [
      ['preference.view', 'Visualizar'],
      ['preference.edit', 'Editar'],
    ],
  },
];

export const permissionLabel = (key) =>
  ACCESS_MODULES.flatMap((module) => module.permissions).find(([item]) => item === key)?.[1] || key;

export const permissionSource = (access, permission) => {
  if (access?.denied?.includes(permission)) {
    return 'deny';
  }
  if (access?.allowedOverrides?.includes(permission)) {
    return 'allow';
  }
  if (access?.profilePermissions?.includes(permission)) {
    return 'profile';
  }
  return 'none';
};

export const hasAccessPermission = (access, permission) =>
  Boolean(
    access?.loaded &&
    !access.error &&
    (access.legacy ||
      (access.permissions?.includes(permission) && !access.denied?.includes(permission))),
  );
