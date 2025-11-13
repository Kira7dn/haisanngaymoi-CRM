import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        '**/.next/**',
        '**/node_modules/**',
        '**/__tests__/**',
        '**/*.spec.*',
        '**/*.test.*',
      ],
    },
    // Only exclude common paths, allow integration tests
    exclude: ['backend/**', 'node_modules/**', '.next/**'],
    include: ['**/*.spec.ts', '**/*.test.ts'],
  },
  server: {
    sourcemapIgnoreList(sourcePath, sourcemapPath) {
      return (
        sourcePath.includes('/.next/') ||
        sourcePath.includes('\\.next\\') ||
        (sourcemapPath ? sourcemapPath.includes('/.next/') || sourcemapPath.includes('\\.next\\') : false)
      )
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
