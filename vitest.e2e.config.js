/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.e2e.js'],
    include: [
      'tests/e2e/**/*.test.js',
      'tests/e2e/**/*.spec.js'
    ],
    exclude: [
      'node_modules/',
      'tests/unit/',
      'tests/integration/',
      'tests/e2e/disabled/',
      'unpackage/',
      'coverage/',
      '**/*.d.ts',
      '**/*.config.*'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'unpackage/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
    testTimeout: 30000, // E2E 测试超时时间设为30秒
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/api': resolve(__dirname, './src/api'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/store': resolve(__dirname, './src/store'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/static': resolve(__dirname, './src/static')
    }
  }
})