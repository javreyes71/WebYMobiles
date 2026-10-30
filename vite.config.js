import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('@mui') ||
            id.includes('@emotion') ||
            id.includes('@popperjs')
          ) {
            return 'vendor-mui';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          return 'vendor-react';
        },
      },
    },
  },
});
