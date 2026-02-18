// Medflow EMR - Logo-Based Theme Configuration
// This file should be updated with the exact colors from your Medflow-logo.jpg

// STEP 1: Extract colors from your logo using these methods:
// 1. Use an online color picker tool: https://htmlcolorcodes.com/color-picker/
// 2. Use Chrome DevTools: Right-click logo > Inspect > Styles > Color picker
// 3. Use Adobe Color Extractor: https://color.adobe.com/create/image

// STEP 2: Update these values with your logo's exact colors

export const logoBasedTheme = {
  // PRIMARY LOGO COLORS - Update these with your logo's exact colors
  logoPrimary: '#10b981',        // Main dominant color from your logo
  logoSecondary: '#3b82f6',      // Secondary color from your logo
  logoAccent: '#059669',         // Darker shade from your logo
  
  // DERIVED COLORS - These will automatically adjust when you update the logo colors
  primaryLight: '#34d399',       // Lighter version of logoPrimary
  primaryDark: '#059669',        // Darker version of logoPrimary
  secondaryLight: '#60a5fa',     // Lighter version of logoSecondary
  secondaryDark: '#2563eb',      // Darker version of logoSecondary
  
  // GRADIENTS - Match your logo's color flow
  gradients: {
    primary: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',      // Main logo gradient
    primaryHover: 'linear-gradient(135deg, #059669 0%, #2563eb 100%)',   // Darker hover version
    logoFlow: 'linear-gradient(135deg, var(--logo-primary) 0%, var(--logo-secondary) 100%)',
    subtle: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
  },
  
  // SHADOWS - Based on logo colors
  shadows: {
    primary: 'rgba(16, 185, 129, 0.3)',      // Using logoPrimary with opacity
    secondary: 'rgba(59, 130, 246, 0.3)',    // Using logoSecondary with opacity
    hover: 'rgba(16, 185, 129, 0.2)',        // Lighter hover shadow
    focus: 'rgba(16, 185, 129, 0.1)'         // Focus ring shadow
  },
  
  // COMPONENT THEMES
  components: {
    buttons: {
      primary: 'linear-gradient(135deg, var(--logo-primary) 0%, var(--logo-secondary) 100%)',
      primaryHover: 'linear-gradient(135deg, var(--logo-primary-dark) 0%, var(--logo-secondary-dark) 100%)',
      secondary: '#f1f5f9',
      secondaryHover: '#e2e8f0',
      focus: 'var(--logo-primary)',
      focusShadow: '0 0 0 3px var(--logo-focus-shadow)'
    },
    
    forms: {
      border: '#e5e7eb',
      focus: 'var(--logo-primary)',
      focusShadow: '0 0 0 3px var(--logo-focus-shadow)',
      background: '#ffffff'
    },
    
    backgrounds: {
      primary: 'linear-gradient(135deg, var(--logo-primary) 0%, var(--logo-secondary) 100%)',
      page: '#f8fafc',
      card: '#ffffff',
      overlay: 'rgba(15, 23, 42, 0.4)'
    }
  },
  
  // CSS CUSTOM PROPERTIES - These will be applied automatically
  cssVariables: {
    '--logo-primary': '#10b981',
    '--logo-secondary': '#3b82f6',
    '--logo-accent': '#059669',
    '--logo-primary-light': '#34d399',
    '--logo-primary-dark': '#059669',
    '--logo-secondary-light': '#60a5fa',
    '--logo-secondary-dark': '#2563eb',
    '--logo-gradient': 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
    '--logo-gradient-hover': 'linear-gradient(135deg, #059669 0%, #2563eb 100%)',
    '--logo-shadow-primary': 'rgba(16, 185, 129, 0.3)',
    '--logo-shadow-secondary': 'rgba(59, 130, 246, 0.3)',
    '--logo-shadow-hover': 'rgba(16, 185, 129, 0.2)',
    '--logo-shadow-focus': 'rgba(16, 185, 129, 0.1)'
  }
};

// COLOR EXTRACTION HELPER
export const extractLogoColors = {
  // Instructions for extracting colors from Medflow-logo.jpg:
  
  method1: {
    name: "Chrome DevTools",
    steps: [
      "1. Open your app in Chrome browser",
      "2. Right-click on the Medflow logo",
      "3. Select 'Inspect' from the menu",
      "4. In DevTools, find the <img> element",
      "5. Click on the color box in the Styles panel",
      "6. Use the eyedropper tool to pick colors from the logo",
      "7. Note the hex values (e.g., #1a73e8, #34a853)"
    ]
  },
  
  method2: {
    name: "Online Color Picker",
    steps: [
      "1. Go to https://htmlcolorcodes.com/color-picker/",
      "2. Upload your Medflow-logo.jpg",
      "3. Click on different parts of the logo",
      "4. Note the main colors (usually 2-3 primary colors)",
      "5. Update the theme values above"
    ]
  },
  
  method3: {
    name: "Adobe Color",
    steps: [
      "1. Go to https://color.adobe.com/create/image",
      "2. Upload your Medflow-logo.jpg",
      "3. Adobe will automatically extract the color palette",
      "4. Note the primary colors from the palette",
      "5. Update the theme configuration"
    ]
  }
};

// THEME APPLIER
export const applyLogoTheme = (customColors = {}) => {
  const theme = { ...logoBasedTheme, ...customColors };
  
  // Apply CSS variables
  const root = document.documentElement;
  Object.entries(theme.cssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  return theme;
};

// QUICK COLOR UPDATER
export const updateThemeColors = (primaryColor, secondaryColor, accentColor) => {
  const newTheme = {
    logoPrimary: primaryColor,
    logoSecondary: secondaryColor,
    logoAccent: accentColor,
    // Update derived colors automatically
    primaryLight: lightenColor(primaryColor, 20),
    primaryDark: darkenColor(primaryColor, 20),
    secondaryLight: lightenColor(secondaryColor, 20),
    secondaryDark: darkenColor(secondaryColor, 20)
  };
  
  return applyLogoTheme(newTheme);
};

// COLOR UTILITIES
const lightenColor = (color, percent) => {
  // Simple color lightening utility
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
};

const darkenColor = (color, percent) => {
  // Simple color darkening utility
  return lightenColor(color, -percent);
};

export default logoBasedTheme;
