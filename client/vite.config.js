import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: '.',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
  },
  server: {
    port: 5175,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 5175
  }
});
// trigger-v2
