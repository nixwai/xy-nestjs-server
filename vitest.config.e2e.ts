import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['development'],
  },
  test: {
    globals: true,
    root: './',
    include: ['test/e2e/**/*.e2e-spec.ts'],
    setupFiles: ['./test/setup.ts'],
    environment: 'node',
    fileParallelism: false,
  },
});
