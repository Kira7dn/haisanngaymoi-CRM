import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node', // Use node for integration tests with server
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
    // Exclude integration tests by default (they start Next.js servers and take long time)
    exclude: ['backend/**', 'node_modules/**', '.next/**', '__tests__/integration/**'],
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
