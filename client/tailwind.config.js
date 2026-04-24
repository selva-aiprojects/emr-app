/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', sans-serif],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        clinical: {
          primary: '#011627',
          'primary-dark': '#0B2545',
          accent: '#0077B6',
        },
      },
      borderRadius: {
        xl: '32px',
        lg: '24px',
        md: '16px',
      },
    },
  },
  plugins: [],
}

