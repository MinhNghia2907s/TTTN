import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const clientRoot = fileURLToPath(new URL('./client/', import.meta.url));

export default defineConfig({
  root: clientRoot,
  envDir: '.',
  define: {
    __API_BASE_URL__: JSON.stringify('/api'),
  },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
