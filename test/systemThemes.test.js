import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import {
  DEFAULT_SYSTEM_THEME,
  SYSTEM_THEME_ATTRIBUTE,
  SYSTEM_THEMES,
  getStoredSystemThemeId,
  getSystemTheme,
  resolvePersistedSystemThemeId,
  resolveSystemThemeId,
  storeSystemThemeId,
} from '../src/common/theme/systemThemes.js';
import dimensions, { getThemeDimensions } from '../src/common/theme/dimensions.js';

test('catálogo contém o tema atual e os quatro templates solicitados', () => {
  assert.deepEqual(
    SYSTEM_THEMES.map((item) => item.id),
    ['classic', 'darkModern', 'lightClean', 'futuristicGradient', 'professionalDashboard'],
  );
  assert.equal(new Set(SYSTEM_THEMES.map((item) => item.id)).size, SYSTEM_THEMES.length);
  assert.equal(DEFAULT_SYSTEM_THEME, 'futuristicGradient');
  assert.equal(getSystemTheme(DEFAULT_SYSTEM_THEME).name, 'Gradiente Futurista');
});

test('todos os templates possuem tokens centrais obrigatórios', () => {
  SYSTEM_THEMES.forEach((item) => {
    assert.ok(item.name);
    assert.ok(item.description);
    assert.ok(['system', 'light', 'dark'].includes(item.mode));
    assert.match(item.colors.primary, /^#[0-9a-f]{6}$/i);
    assert.match(item.colors.secondary, /^#[0-9a-f]{6}$/i);
    assert.ok(item.effects.loginGradient);
    assert.ok(item.login.backgroundImage);
    assert.ok(item.login.backgroundPosition);
    assert.ok(item.login.cardBackground);
    assert.ok(item.login.cardBorder);
    assert.ok(item.login.brandColor);
    assert.ok(item.login.brandAccent);
    assert.ok(item.login.tagline);
    assert.equal('mapFilter' in item.effects, false);
    assert.ok(item.shape.cardRadius > 0);
    assert.ok(item.layout.sidebarWidth > 0);
  });
});

test('quatro templates personalizados possuem fundos de login próprios', () => {
  const customThemes = SYSTEM_THEMES.filter((item) => item.id !== 'classic');
  const backgrounds = customThemes.map((item) => item.login.backgroundImage);

  assert.equal(new Set(backgrounds).size, 4);
  backgrounds.forEach((background) => assert.match(background, /^url\('\/login\/.+\.webp'\)$/));
  assert.equal(getSystemTheme('classic').login.backgroundImage, 'none');
});

test('fundos de login existem, são leves e o tema é preparado antes do React', () => {
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
  const viteConfig = readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');

  assert.ok(index.indexOf('__SYSTEM_THEME_BOOTSTRAP__') < index.indexOf('/src/index.jsx'));
  assert.match(viteConfig, /defaultTheme: DEFAULT_SYSTEM_THEME/);
  assert.match(viteConfig, /storageKey: SYSTEM_THEME_STORAGE_KEY/);
  assert.match(viteConfig, /themeIds: SYSTEM_THEMES\.map/);
  SYSTEM_THEMES.filter((item) => item.id !== 'classic').forEach((item) => {
    const assetName = item.login.backgroundImage.match(/\/login\/(.+\.webp)/)?.[1];
    assert.ok(assetName);
    assert.ok(statSync(new URL(`../public/login/${assetName}`, import.meta.url)).size < 150_000);
    assert.match(styles, new RegExp(`data-system-theme='${item.id}'`));
  });
});

test('templates não alteram a aparência do canvas do mapa', () => {
  const mapStyles = readFileSync(new URL('../src/map/core/MapView.css', import.meta.url), 'utf8');

  assert.match(mapStyles, /\.map-view-root \.maplibregl-canvas/);
  assert.match(mapStyles, /filter: none !important/);
  assert.match(mapStyles, /opacity: 1 !important/);
  assert.match(mapStyles, /mix-blend-mode: normal !important/);
  assert.match(mapStyles, /backdrop-filter: none !important/);
  assert.match(mapStyles, /background: transparent !important/);
});

test('identificador inválido restaura o tema padrão', () => {
  assert.equal(resolveSystemThemeId('unknown'), DEFAULT_SYSTEM_THEME);
  assert.equal(getSystemTheme('unknown').id, DEFAULT_SYSTEM_THEME);
});

test('tema do usuário tem precedência e ausência de preferência respeita o navegador', () => {
  assert.equal(
    resolvePersistedSystemThemeId({ [SYSTEM_THEME_ATTRIBUTE]: 'futuristicGradient' }, 'darkModern'),
    'futuristicGradient',
  );
  assert.equal(
    resolvePersistedSystemThemeId({ [SYSTEM_THEME_ATTRIBUTE]: 'invalid' }, 'darkModern'),
    DEFAULT_SYSTEM_THEME,
  );
  assert.equal(resolvePersistedSystemThemeId({}, 'darkModern'), 'darkModern');
  assert.equal(resolvePersistedSystemThemeId(undefined, 'lightClean'), 'lightClean');
  assert.equal(resolvePersistedSystemThemeId({}, undefined), DEFAULT_SYSTEM_THEME);
});

test('dimensões estáticas permanecem compatíveis e o drawer varia por template', () => {
  assert.equal(dimensions.popupMapOffset, 300);
  assert.equal(getThemeDimensions(getSystemTheme('classic')).drawerWidthDesktop, '360px');
  assert.equal(
    getThemeDimensions(getSystemTheme('professionalDashboard')).drawerWidthDesktop,
    '300px',
  );
});

test('armazenamento local mantém apenas identificadores válidos', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key),
    setItem: (key, value) => values.set(key, value),
  };

  assert.equal(storeSystemThemeId('darkModern', storage), 'darkModern');
  assert.equal(getStoredSystemThemeId(storage), 'darkModern');
  assert.equal(storeSystemThemeId('invalid', storage), DEFAULT_SYSTEM_THEME);
  assert.equal(getStoredSystemThemeId(storage), DEFAULT_SYSTEM_THEME);
});
