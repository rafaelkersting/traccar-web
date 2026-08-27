export const createEmptyAccessState = () => ({
  loaded: false,
  legacy: false,
  permissions: [],
  profilePermissions: [],
  allowedOverrides: [],
  denied: [],
  error: null,
  refreshError: null,
});

export const completeAccessLoad = (access) => ({
  ...createEmptyAccessState(),
  ...access,
  loaded: true,
});

export const failAccessLoad = (current, error, background) =>
  background
    ? {
        ...current,
        refreshError: error.message,
      }
    : {
        ...createEmptyAccessState(),
        loaded: true,
        error: error.message,
      };
