/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'unpackage/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@/api': resolve(__dirname, 'api'),
      '@/components': resolve(__dirname, 'components'),
      '@/pages': resolve(__dirname, 'pages'),
      '@/store': resolve(__dirname, 'store'),
      '@/utils': resolve(__dirname, 'utils'),
      '@/test': resolve(__dirname, 'test')
    }
  }
})