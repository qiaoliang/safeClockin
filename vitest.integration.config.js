/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.integration.js'],
    include: [
      'tests/integration/**/*.test.js',
      'tests/integration/**/*.spec.js'
    ],
    exclude: [
      'node_modules/',
      'tests/unit/',
      'tests/e2e/',
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
    testTimeout: 10000, // 集成测试超时时间设为10秒
    hookTimeout: 10000
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