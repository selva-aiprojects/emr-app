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
        target: 'http://127.0.0.1:4005',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
        buffer: false
      }
    }
  },
  preview: {
    port: 5175
  }
});
// trigger-v2
