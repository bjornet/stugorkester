import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests only for now — pure logic, no DOM or SvelteKit runtime.
    include: ['src/**/*.test.ts']
  }
});
