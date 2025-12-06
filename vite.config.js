import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    copyPublicDir: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    globals: true,
  },
});
