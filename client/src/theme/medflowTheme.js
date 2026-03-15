export const THEMES = {
  HEALING_TEAL: 'healing-teal',
  TRUST_BLUE: 'trust-blue',
  MEDICAL_SLATE: 'medical-slate'
};

export const applyMedflowTheme = (theme = THEMES.HEALING_TEAL) => {
  const element = document.documentElement;
  
  // Minimal Solid Clinical Precision Palette
  const variables = {
    '--bg-sidebar': '#0f172a', /* Solid Navy */
    '--bg-header': '#ffffff',
    '--bg-app': '#f8fafc',
    '--bg-panel': '#ffffff',
    '--text-main': '#1e293b',
    '--text-secondary': '#64748b',
    '--border': '#e2e8f0',
    '--medflow-primary': '#2563eb',
    '--medflow-accent': '#3b82f6',
    '--accent-glow': 'none',
    '--page-gradient': 'none',
    '--hero-glow': 'none'
  };

  Object.entries(variables).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
  
  element.setAttribute('data-theme', theme);
};

export default { THEMES, applyMedflowTheme };
