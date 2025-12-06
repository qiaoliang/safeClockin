module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    'vitest/globals': true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'vue',
    'vitest'
  ],
  rules: {
    // Vue specific rules
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'error',
    
    // General rules
    'no-console': 'warn',
    'no-unused-vars': 'warn',
    'prefer-const': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
      env: {
        vitest: true
      },
      rules: {
        'no-unused-expressions': 'off'
      }
    }
  ]
}