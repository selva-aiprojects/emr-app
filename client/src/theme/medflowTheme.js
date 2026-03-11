// Medflow EMR - 3-Mode Theme Configuration

export const THEMES = {
  HEALING_TEAL: 'healing-teal',
  TRUST_BLUE: 'trust-blue',
  MEDICAL_SLATE: 'medical-slate'
};

export const applyMedflowTheme = (theme = THEMES.HEALING_TEAL) => {
  const element = document.documentElement;
  
  // Base configuration defaults (Healing Teal)
  let variables = {
    '--bg-sidebar': 'rgba(9, 36, 47, 0.75)',
    '--bg-header': 'rgba(9, 36, 47, 0.85)',
    '--bg-header-rgb': '9, 36, 47',
    '--bg-app': '#f6fbfb',
    '--bg-panel': '#ffffff',
    '--text-main': '#0f172a',
    '--text-secondary': '#53636d',
    '--text-header': '#e9fbff',
    '--text-on-dark': '#e9fbff',
    '--border': 'rgba(15, 23, 42, 0.12)',
    '--medflow-primary': '#0f5a6e',
    '--medflow-accent': '#17c3b2',
    '--medflow-accent-alpha': 'rgba(23, 195, 178, 0.15)',
    '--accent-glow': 'rgba(23, 195, 178, 0.15)',
    '--sidebar-text': '#e9fbff',
    '--sidebar-muted': 'rgba(233, 251, 255, 0.72)',
    '--sidebar-hover': 'rgba(23, 195, 178, 0.18)',
    '--sidebar-icon': '#9ff3ea',
    '--page-gradient': 'linear-gradient(120deg, rgba(240, 252, 252, 0.9), rgba(244, 247, 255, 0.95))',
    '--hero-glow': 'radial-gradient(circle at 20% 20%, rgba(23, 195, 178, 0.18), transparent 55%)'
  };

  if (theme === THEMES.TRUST_BLUE) {
    variables = {
      '--bg-sidebar': 'rgba(16, 36, 64, 0.78)',
      '--bg-header': 'rgba(16, 36, 64, 0.85)',
      '--bg-header-rgb': '16, 36, 64',
      '--bg-app': '#f3f6fb',
      '--bg-panel': '#ffffff',
      '--text-main': '#0f1a2c',
      '--text-secondary': '#4c5a70',
      '--text-header': '#eaf3ff',
      '--text-on-dark': '#eaf3ff',
      '--border': 'rgba(15, 26, 44, 0.12)',
      '--medflow-primary': '#193a6a',
      '--medflow-accent': '#5ec0ff',
      '--medflow-accent-alpha': 'rgba(94, 192, 255, 0.15)',
      '--accent-glow': 'rgba(94, 192, 255, 0.18)',
      '--sidebar-text': '#eaf3ff',
      '--sidebar-muted': 'rgba(234, 243, 255, 0.72)',
      '--sidebar-hover': 'rgba(94, 192, 255, 0.18)',
      '--sidebar-icon': '#96d8ff',
      '--page-gradient': 'linear-gradient(120deg, rgba(236, 242, 252, 0.9), rgba(248, 250, 255, 0.96))',
      '--hero-glow': 'radial-gradient(circle at 20% 20%, rgba(94, 192, 255, 0.18), transparent 55%)'
    };
  } else if (theme === THEMES.MEDICAL_SLATE) {
    variables = {
      '--bg-sidebar': 'rgba(27, 36, 48, 0.82)',
      '--bg-header': 'rgba(27, 36, 48, 0.88)',
      '--bg-header-rgb': '27, 36, 48',
      '--bg-app': '#eef1f5',
      '--bg-panel': '#ffffff',
      '--text-main': '#101827',
      '--text-secondary': '#495467',
      '--text-header': '#eef3f9',
      '--text-on-dark': '#eef3f9',
      '--border': 'rgba(16, 24, 39, 0.14)',
      '--medflow-primary': '#2f4c6b',
      '--medflow-accent': '#7aa7c7',
      '--medflow-accent-alpha': 'rgba(122, 167, 199, 0.18)',
      '--accent-glow': 'rgba(122, 167, 199, 0.2)',
      '--sidebar-text': '#eef3f9',
      '--sidebar-muted': 'rgba(238, 243, 249, 0.7)',
      '--sidebar-hover': 'rgba(122, 167, 199, 0.18)',
      '--sidebar-icon': '#b7cee2',
      '--page-gradient': 'linear-gradient(120deg, rgba(238, 241, 245, 0.9), rgba(248, 250, 252, 0.96))',
      '--hero-glow': 'radial-gradient(circle at 20% 20%, rgba(122, 167, 199, 0.18), transparent 55%)'
    };
  }
  
  // Apply globally
  Object.entries(variables).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
  
  // Set data attribute for absolute strict CSS overrides
  element.setAttribute('data-theme', theme);
};

export default { THEMES, applyMedflowTheme };
