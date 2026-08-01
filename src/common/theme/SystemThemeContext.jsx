import { createContext, use } from 'react';
import { DEFAULT_SYSTEM_THEME } from './systemThemes';

export const SystemThemeContext = createContext({
  activeThemeId: DEFAULT_SYSTEM_THEME,
  persistedThemeId: DEFAULT_SYSTEM_THEME,
  previewThemeId: null,
  previewTheme: () => {},
  clearThemePreview: () => {},
});

export const useSystemTheme = () => use(SystemThemeContext);
