/// <reference types="vitest" />
import {defineConfig} from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/app/**/*.ts'],
      exclude: [
        'src/app/**/*.spec.ts',
        'src/app/**/*.routes.ts',
        'src/app/main.ts',
        'src/app/**/model/*.ts',
        'src/app/**/db/db-config.ts',
      ],
      thresholds: {
        statements: 89,
        branches: 69,
        functions: 90,
        lines: 90,
      },
    },
  },
});
