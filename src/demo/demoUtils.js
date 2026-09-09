export const remainingSeconds = (expiresAt, now = Date.now()) =>
  Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));

export const formatRemaining = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = Math.floor(safeSeconds % 60);
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
};

const commonSteps = [
  'Dispositivo online',
  'Ignição ligada',
  'Veículo em movimento',
  'Entrada na geocerca',
  'Excesso de velocidade',
  'Saída da geocerca',
  'Ignição desligada',
  'Dispositivo offline',
  'Demonstração concluída',
];

export const scenarioProgressSteps = (scenarioId) => {
  switch (scenarioId) {
    case 'urban':
      return [
        'Ignição ligada',
        'Veículo em movimento',
        'Curvas urbanas',
        'Parada',
        'Retomada',
        'Ignição desligada',
      ];
    case 'highway':
      return [
        'Ignição ligada',
        'Acesso à rodovia',
        'Velocidade de cruzeiro',
        'Curva suave',
        'Desaceleração',
        'Percurso concluído',
      ];
    case 'geofence':
      return [
        'Fora da cerca',
        'Entrada na geocerca',
        'Permanência na geocerca',
        'Saída da geocerca',
        'Percurso concluído',
      ];
    case 'overspeed':
      return [
        'Fora da cerca',
        'Entrada na geocerca',
        'Excesso de velocidade',
        'Saída da geocerca',
        'Percurso concluído',
      ];
    case 'offline':
      return [
        'Dispositivo online',
        'Veículo em movimento',
        'Dispositivo offline',
        'Dispositivo online',
        'Percurso concluído',
      ];
    default:
      return commonSteps;
  }
};

export const progressState = (index, total, progress, currentStep, label) => {
  if (label === currentStep) return 'active';
  const threshold = ((index + 1) * 100) / Math.max(1, total);
  return progress >= threshold ? 'complete' : 'pending';
};
