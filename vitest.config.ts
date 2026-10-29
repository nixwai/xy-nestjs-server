import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/unit/**/*.spec.ts'],
    setupFiles: ['./test/setup.ts'],
    environment: 'node',
    coverage: {
      thresholds: {
        branches: 65,
        functions: 75,
        lines: 80,
        statements: 80,
      },
    },
  },
});
