import assert from 'node:assert/strict';
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
});

test('todos os templates possuem tokens centrais obrigatórios', () => {
  SYSTEM_THEMES.forEach((item) => {
    assert.ok(item.name);
    assert.ok(item.description);
    assert.ok(['system', 'light', 'dark'].includes(item.mode));
    assert.match(item.colors.primary, /^#[0-9a-f]{6}$/i);
    assert.match(item.colors.secondary, /^#[0-9a-f]{6}$/i);
    assert.ok(item.effects.loginGradient);
    assert.ok(item.effects.mapFilter);
    assert.ok(item.shape.cardRadius > 0);
    assert.ok(item.layout.sidebarWidth > 0);
  });
});

test('identificador inválido restaura o tema padrão', () => {
  assert.equal(resolveSystemThemeId('unknown'), DEFAULT_SYSTEM_THEME);
  assert.equal(getSystemTheme('unknown').id, DEFAULT_SYSTEM_THEME);
});

test('tema do usuário tem precedência sobre servidor e armazenamento local', () => {
  assert.equal(
    resolvePersistedSystemThemeId(
      { [SYSTEM_THEME_ATTRIBUTE]: 'futuristicGradient' },
      { [SYSTEM_THEME_ATTRIBUTE]: 'lightClean' },
      'darkModern',
    ),
    'futuristicGradient',
  );
  assert.equal(
    resolvePersistedSystemThemeId({}, { [SYSTEM_THEME_ATTRIBUTE]: 'lightClean' }, 'darkModern'),
    'lightClean',
  );
  assert.equal(resolvePersistedSystemThemeId({}, {}, 'darkModern'), DEFAULT_SYSTEM_THEME);
  assert.equal(resolvePersistedSystemThemeId(undefined, {}, 'darkModern'), 'darkModern');
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
