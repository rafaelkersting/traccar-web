export const SYSTEM_THEME_ATTRIBUTE = 'web.systemTheme';
export const SYSTEM_THEME_STORAGE_KEY = 'kersting.systemTheme';
export const DEFAULT_SYSTEM_THEME = 'futuristicGradient';

const systemThemes = [
  {
    id: 'classic',
    name: 'Tema Atual',
    description: 'Visual clássico do Kersting GPS, preservado como opção de aparência.',
    mode: 'system',
    colors: {
      primary: '#1a237e',
      secondary: '#2e7d32',
      geometry: '#3bb2d0',
    },
    effects: {
      pageGradient: 'none',
      loginGradient: 'linear-gradient(145deg, #1a237e 0%, #303f9f 100%)',
      buttonGradient: 'none',
      glow: 'none',
      shadow: '0 10px 30px rgba(15, 23, 42, 0.18)',
    },
    login: {
      backgroundImage: 'none',
      backgroundPosition: 'center',
      overlay: 'none',
      cardBackground: '#ffffff',
      cardBorder: 'transparent',
      cardBackdrop: 'none',
      brandColor: '#ffffff',
      brandAccent: '#ffffff',
      tagline: 'Inteligência em rastreamento veicular',
    },
    shape: { borderRadius: 4, cardRadius: 4, inputRadius: 4 },
    layout: { sidebarInset: true, sidebarWidth: 360 },
  },
  {
    id: 'darkModern',
    name: 'Dark Moderno',
    description: 'Superfícies profundas, azul elétrico e alto contraste para operação noturna.',
    mode: 'dark',
    colors: {
      primary: '#2f81f7',
      secondary: '#22d3ee',
      geometry: '#38bdf8',
      background: '#07111f',
      paper: '#0d1b2d',
      surface: '#11243a',
      sidebar: '#081421',
      text: '#f8fafc',
      textSecondary: '#9fb1c5',
      divider: 'rgba(148, 163, 184, 0.22)',
    },
    effects: {
      pageGradient: 'radial-gradient(circle at 70% 0%, #132b47 0%, #07111f 48%)',
      loginGradient: 'linear-gradient(145deg, #020817 0%, #0a2139 58%, #0f2f50 100%)',
      buttonGradient: 'linear-gradient(100deg, #1295ff 0%, #315cff 100%)',
      glow: '0 0 24px rgba(47, 129, 247, 0.28)',
      shadow: '0 16px 42px rgba(0, 0, 0, 0.42)',
    },
    login: {
      backgroundImage: "url('/login/dark-modern.webp')",
      backgroundPosition: 'center',
      overlay:
        'linear-gradient(90deg, rgba(1, 7, 18, 0.2) 0%, rgba(2, 9, 22, 0.12) 48%, rgba(2, 8, 20, 0.72) 100%)',
      cardBackground: 'rgba(7, 18, 38, 0.88)',
      cardBorder: 'rgba(71, 139, 255, 0.55)',
      cardBackdrop: 'blur(20px)',
      brandColor: '#f8fafc',
      brandAccent: '#3695ff',
      tagline: 'Inteligência que move seu negócio',
    },
    shape: { borderRadius: 12, cardRadius: 16, inputRadius: 10 },
    layout: { sidebarInset: true, sidebarWidth: 360 },
  },
  {
    id: 'lightClean',
    name: 'Light Clean',
    description: 'Interface clara, arejada e objetiva com detalhes em azul e violeta.',
    mode: 'light',
    colors: {
      primary: '#4856d9',
      secondary: '#6366e8',
      geometry: '#536dfe',
      background: '#f5f7fc',
      paper: '#ffffff',
      surface: '#f9faff',
      sidebar: '#ffffff',
      text: '#18213d',
      textSecondary: '#66708c',
      divider: '#e5e8f2',
    },
    effects: {
      pageGradient: 'linear-gradient(160deg, #ffffff 0%, #f3f5ff 100%)',
      loginGradient: 'linear-gradient(150deg, #ffffff 0%, #f0f3ff 72%, #e8ebff 100%)',
      buttonGradient: 'linear-gradient(100deg, #5661d9 0%, #6567e9 100%)',
      glow: '0 0 24px rgba(99, 102, 232, 0.14)',
      shadow: '0 14px 38px rgba(50, 63, 110, 0.13)',
    },
    login: {
      backgroundImage: "url('/login/light-clean.webp')",
      backgroundPosition: 'center',
      overlay:
        'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(248,251,255,0.08) 55%, rgba(245,249,255,0.52) 100%)',
      cardBackground: 'rgba(255, 255, 255, 0.94)',
      cardBorder: 'rgba(72, 86, 217, 0.16)',
      cardBackdrop: 'blur(16px)',
      brandColor: '#10295b',
      brandAccent: '#1976e9',
      tagline: 'Gestão inteligente. Frota conectada.',
    },
    shape: { borderRadius: 12, cardRadius: 16, inputRadius: 10 },
    layout: { sidebarInset: true, sidebarWidth: 360 },
  },
  {
    id: 'futuristicGradient',
    name: 'Gradiente Futurista',
    description: 'Azul, violeta e magenta com brilho controlado e superfícies translúcidas.',
    mode: 'dark',
    colors: {
      primary: '#8b5cf6',
      secondary: '#ec4899',
      geometry: '#22d3ee',
      background: '#0b1024',
      paper: '#171638',
      surface: '#211b4b',
      sidebar: '#11132e',
      text: '#fbf8ff',
      textSecondary: '#c4b9e8',
      divider: 'rgba(192, 132, 252, 0.3)',
    },
    effects: {
      pageGradient: 'radial-gradient(circle at 10% 0%, #48205f 0%, #171638 35%, #0b1024 76%)',
      loginGradient: 'linear-gradient(145deg, #16123b 0%, #37205c 56%, #7b245f 100%)',
      buttonGradient: 'linear-gradient(100deg, #0ea5ff 0%, #8b5cf6 52%, #ec4899 100%)',
      glow: '0 0 28px rgba(236, 72, 153, 0.3)',
      shadow: '0 18px 48px rgba(5, 5, 20, 0.52)',
    },
    login: {
      backgroundImage: "url('/login/futuristic-gradient.webp')",
      backgroundPosition: 'center',
      overlay:
        'linear-gradient(90deg, rgba(7,2,28,0.1) 0%, rgba(8,4,35,0.08) 50%, rgba(6,3,28,0.68) 100%)',
      cardBackground: 'rgba(17, 12, 52, 0.82)',
      cardBorder: 'rgba(220, 69, 255, 0.6)',
      cardBackdrop: 'blur(22px)',
      brandColor: '#ffffff',
      brandAccent: '#f03ae5',
      tagline: 'Rastreamento inteligente. Controle total.',
    },
    shape: { borderRadius: 14, cardRadius: 18, inputRadius: 12 },
    layout: { sidebarInset: true, sidebarWidth: 360 },
  },
  {
    id: 'professionalDashboard',
    name: 'Professional Dashboard',
    description: 'Painel corporativo integrado, navegação sólida e destaque em verde-petróleo.',
    mode: 'light',
    colors: {
      primary: '#087f8c',
      secondary: '#0ea5a8',
      geometry: '#00a6a6',
      background: '#eef3f4',
      paper: '#ffffff',
      surface: '#f6f9f9',
      sidebar: '#092f37',
      sidebarText: '#f8fafc',
      text: '#17313a',
      textSecondary: '#667a80',
      divider: '#d9e4e6',
    },
    effects: {
      pageGradient: 'linear-gradient(160deg, #f9fbfb 0%, #edf3f4 100%)',
      loginGradient: 'linear-gradient(145deg, #062f38 0%, #0a4a54 100%)',
      buttonGradient: 'linear-gradient(100deg, #07818d 0%, #0ea5a8 100%)',
      glow: '0 0 22px rgba(14, 165, 168, 0.17)',
      shadow: '0 12px 34px rgba(18, 59, 67, 0.16)',
    },
    login: {
      backgroundImage: "url('/login/professional-dashboard.webp')",
      backgroundPosition: 'center',
      overlay:
        'linear-gradient(90deg, rgba(3,21,30,0.08) 0%, rgba(4,27,38,0.06) 50%, rgba(5,30,39,0.58) 100%)',
      cardBackground: 'rgba(250, 254, 255, 0.94)',
      cardBorder: 'rgba(87, 218, 224, 0.42)',
      cardBackdrop: 'blur(18px)',
      brandColor: '#ffffff',
      brandAccent: '#41d5d7',
      tagline: 'Controle profissional da sua operação',
    },
    shape: { borderRadius: 8, cardRadius: 12, inputRadius: 8 },
    layout: { sidebarInset: false, sidebarWidth: 300 },
  },
];

export const SYSTEM_THEMES = Object.freeze(systemThemes.map((item) => Object.freeze(item)));

export const resolveSystemThemeId = (themeId) =>
  SYSTEM_THEMES.some((item) => item.id === themeId) ? themeId : DEFAULT_SYSTEM_THEME;

export const getSystemTheme = (themeId) =>
  SYSTEM_THEMES.find((item) => item.id === resolveSystemThemeId(themeId));

export const resolvePersistedSystemThemeId = (userAttributes, localThemeId) => {
  const userThemeId = userAttributes?.[SYSTEM_THEME_ATTRIBUTE];
  if (userThemeId !== undefined && userThemeId !== null && userThemeId !== '') {
    return resolveSystemThemeId(userThemeId);
  }
  return resolveSystemThemeId(localThemeId || DEFAULT_SYSTEM_THEME);
};

const browserStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);

export const getStoredSystemThemeId = (storage = browserStorage()) => {
  try {
    return resolveSystemThemeId(storage?.getItem(SYSTEM_THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_SYSTEM_THEME;
  }
};

export const storeSystemThemeId = (themeId, storage = browserStorage()) => {
  const resolved = resolveSystemThemeId(themeId);
  try {
    storage?.setItem(SYSTEM_THEME_STORAGE_KEY, resolved);
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
  }
  return resolved;
};
