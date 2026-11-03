/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Phase 1 runs locally only: bind to localhost, never to the network.
// `base` is relative so the static build also works from a sub-directory (Phase 2 hosting).
export default defineConfig({
  base: process.env.OTC_BASE ?? './',
  plugins: [react()],
  server: { host: 'localhost', port: 5173, strictPort: true },
  preview: { host: 'localhost', port: 4173, strictPort: true },
  build: { chunkSizeWarningLimit: 2500 },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60000,
  },
});
