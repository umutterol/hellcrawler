import { defineConfig } from 'vite';
import path from 'path';
import electron from 'vite-plugin-electron/simple';

const isElectron = process.env.npm_lifecycle_event?.includes('electron') ||
                   process.argv.includes('--mode') && process.argv.includes('electron');

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: !isElectron, // Don't auto-open browser when running Electron
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  plugins: isElectron
    ? [
        electron({
          main: {
            entry: 'electron/main.ts',
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  external: ['electron'],
                },
              },
            },
          },
          preload: {
            input: 'electron/preload.ts',
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  external: ['electron'],
                },
              },
            },
          },
        }),
      ]
    : [],
});
