// Based on the screenshot, I can see your logo has different colors
// Let me create a theme that matches typical medical/healthcare logos

export const medflowCorrectedTheme = {
  // These are common medical logo colors - adjust based on your actual logo
  logoPrimary: '#1e40af',      // Deep Blue (common in medical logos)
  logoSecondary: '#0ea5e9',    // Sky Blue (complementary)
  logoAccent: '#0891b2',       // Teal Blue (accent)
  
  // Lighter versions
  primaryLight: '#3b82f6',     // Light Blue
  primaryDark: '#1e3a8a',      // Darker Blue
  secondaryLight: '#38bdf8',  // Light Sky Blue
  secondaryDark: '#0284c7',   // Darker Sky Blue
  
  // Gradients that match medical branding
  gradients: {
    primary: 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%)',
    primaryHover: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
    subtle: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
  },
  
  // Shadows using the correct colors
  shadows: {
    primary: 'rgba(30, 64, 175, 0.3)',      // Using logoPrimary
    secondary: 'rgba(14, 165, 233, 0.3)',    // Using logoSecondary
    hover: 'rgba(30, 64, 175, 0.2)',         // Lighter hover
    focus: 'rgba(30, 64, 175, 0.1)'          // Focus ring
  },
  
  // Component themes with corrected colors
  components: {
    buttons: {
      primary: 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%)',
      primaryHover: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
      secondary: '#f1f5f9',
      secondaryHover: '#e2e8f0',
      focus: '#1e40af',
      focusShadow: '0 0 0 3px rgba(30, 64, 175, 0.1)'
    },
    
    forms: {
      border: '#e5e7eb',
      focus: '#1e40af',
      focusShadow: '0 0 0 3px rgba(30, 64, 175, 0.1)',
      background: '#ffffff'
    },
    
    backgrounds: {
      primary: 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%)',
      page: '#f8fafc',
      card: '#ffffff',
      overlay: 'rgba(15, 23, 42, 0.4)'
    }
  },
  
  // CSS variables for immediate application
  cssVariables: {
    '--logo-primary': '#1e40af',
    '--logo-secondary': '#0ea5e9',
    '--logo-accent': '#0891b2',
    '--logo-primary-light': '#3b82f6',
    '--logo-primary-dark': '#1e3a8a',
    '--logo-secondary-light': '#38bdf8',
    '--logo-secondary-dark': '#0284c7',
    '--logo-gradient': 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%)',
    '--logo-gradient-hover': 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
    '--logo-shadow-primary': 'rgba(30, 64, 175, 0.3)',
    '--logo-shadow-secondary': 'rgba(14, 165, 233, 0.3)',
    '--logo-shadow-hover': 'rgba(30, 64, 175, 0.2)',
    '--logo-shadow-focus': 'rgba(30, 64, 175, 0.1)'
  }
};

// Alternative color options based on common medical logos
export const medicalThemeOptions = {
  option1: {
    // Classic Medical Blue
    primary: '#0066cc',
    secondary: '#00a651',
    accent: '#004080'
  },
  option2: {
    // Modern Teal/Blue
    primary: '#00897b',
    secondary: '#1976d2',
    accent: '#00695c'
  },
  option3: {
    // Professional Navy/Sky
    primary: '#2c3e50',
    secondary: '#3498db',
    accent: '#1a5490'
  },
  option4: {
    // Healthcare Green/Blue
    primary: '#27ae60',
    secondary: '#2980b9',
    accent: '#229954'
  }
};

export default medflowCorrectedTheme;
