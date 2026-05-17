import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // Treat .js files in src/ as JSX (legacy from CRA where JSX in .js was fine).
      // When we migrate to TS this goes away.
      include: /\.(jsx?|tsx?)$/,
    }),
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build', // keep CRA-compatible output dir for Vercel
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom'],
          'vendor-sentry': ['@sentry/browser'],
          'vendor-icons':  ['lucide-react'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
