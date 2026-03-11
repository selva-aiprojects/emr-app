// Medflow EMR - 3-Mode Theme Configuration

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  MIDNIGHT: 'midnight'
};

export const applyMedflowTheme = (theme = THEMES.LIGHT) => {
  const element = document.documentElement;
  
  // Base configuration defaults (Light Theme - "Professional Clinical")
  let variables = {
    '--bg-sidebar': '#0f172a',    // Dark Sidebar like Login
    '--bg-header': '#0f172a',     // Dark Header to match Sidebar
    '--bg-header-rgb': '15, 23, 42',
    '--bg-app': '#f8fafc',        // Pure medical light area
    '--bg-panel': '#ffffff',      // Pure white panels
    '--text-main': '#0f172a',
    '--text-secondary': '#64748b',
    '--text-header': '#f8fafc',   // White text on dark header
    '--text-on-dark': '#f8fafc',  // Explicit light text for dark areas
    '--border': '#e2e8f0',
    '--medflow-primary': '#0f172a',
    '--medflow-accent': '#2563eb',
    '--medflow-accent-alpha': 'rgba(37, 99, 235, 0.1)',
    '--accent-glow': 'rgba(37, 99, 235, 0.08)'
  };

  if (theme === THEMES.DARK) {
    variables = {
      '--bg-sidebar': '#020617',
      '--bg-header': '#020617',
      '--bg-header-rgb': '2, 6, 23',
      '--bg-app': '#0f172a',      // Slate 900
      '--bg-panel': '#1e293b',    // Slate 800 extension
      '--text-main': '#f8fafc',
      '--text-secondary': '#94a3b8',
      '--text-header': '#f8fafc',
      '--text-on-dark': '#f8fafc',
      '--border': '#334155',
      '--medflow-primary': '#020617',
      '--medflow-accent': '#3b82f6',
      '--medflow-accent-alpha': 'rgba(59, 130, 246, 0.15)',
      '--accent-glow': 'rgba(59, 130, 246, 0.2)'
    };
    element.classList.add('dark-mode');
  } else if (theme === THEMES.MIDNIGHT) {
    variables = {
      '--bg-sidebar': '#020617',
      '--bg-header': '#020617',
      '--bg-header-rgb': '2, 6, 23',
      '--bg-app': '#0f172a',
      '--bg-panel': '#1e293b',
      '--text-main': '#f1f5f9',
      '--text-secondary': '#94a3b8',
      '--text-header': '#f1f5f9',
      '--text-on-dark': '#f1f5f9',
      '--border': 'rgba(56, 189, 248, 0.15)',
      '--medflow-primary': '#020617',
      '--medflow-accent': '#38bdf8',
      '--medflow-accent-alpha': 'rgba(56, 189, 248, 0.15)',
      '--accent-glow': 'rgba(56, 189, 248, 0.2)'
    };
    element.classList.add('dark-mode');
  } else {
    element.classList.remove('dark-mode');
  }
  
  // Apply globally
  Object.entries(variables).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
  
  // Set data attribute for absolute strict CSS overrides
  element.setAttribute('data-theme', theme);
};

export default { THEMES, applyMedflowTheme };
