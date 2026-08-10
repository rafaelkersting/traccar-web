import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider, useMediaQuery } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import theme from './common/theme';
import { useLocalization } from './common/components/LocalizationProvider';
import branding from '../branding';
import { SystemThemeContext } from './common/theme/SystemThemeContext';
import {
  DEFAULT_SYSTEM_THEME,
  getStoredSystemThemeId,
  resolvePersistedSystemThemeId,
  resolveSystemThemeId,
  storeSystemThemeId,
} from './common/theme/systemThemes';

const cache = {
  ltr: createCache({
    key: 'muiltr',
    stylisPlugins: [prefixer],
  }),
  rtl: createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  }),
};

const AppThemeProvider = ({ children }) => {
  const server = useSelector((state) => state.session.server);
  const user = useSelector((state) => state.session.user);
  const { direction } = useLocalization();

  const [localThemeId, setLocalThemeId] = useState(getStoredSystemThemeId);
  const [previewThemeId, setPreviewThemeId] = useState(null);

  const serverDarkMode = server?.attributes?.darkMode;
  const preferDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const darkMode = serverDarkMode !== undefined ? serverDarkMode : preferDarkMode;

  const persistedThemeId = resolvePersistedSystemThemeId(
    user?.attributes,
    localThemeId || DEFAULT_SYSTEM_THEME,
  );
  const activeThemeId = previewThemeId || persistedThemeId;

  const previewTheme = useCallback((themeId) => {
    setPreviewThemeId(resolveSystemThemeId(themeId));
  }, []);
  const clearThemePreview = useCallback(() => setPreviewThemeId(null), []);

  const contextValue = useMemo(
    () => ({
      activeThemeId,
      persistedThemeId,
      previewThemeId,
      previewTheme,
      clearThemePreview,
    }),
    [activeThemeId, persistedThemeId, previewThemeId, previewTheme, clearThemePreview],
  );

  const themeInstance = theme(server, activeThemeId, darkMode, direction);

  useEffect(() => {
    const storedThemeId = storeSystemThemeId(persistedThemeId);
    setLocalThemeId(storedThemeId);
  }, [persistedThemeId]);

  useEffect(() => {
    document.documentElement.dataset.systemTheme = activeThemeId;
  }, [activeThemeId]);

  useEffect(() => {
    document.title = server?.attributes?.title || branding.name;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', server?.attributes?.description || branding.description);
  }, [server]);

  return (
    <CacheProvider value={cache[direction]}>
      <SystemThemeContext value={contextValue}>
        <ThemeProvider theme={themeInstance}>{children}</ThemeProvider>
      </SystemThemeContext>
    </CacheProvider>
  );
};

export default AppThemeProvider;
