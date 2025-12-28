module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  globals: {
    uni: 'readonly',
    wx: 'readonly',
    plus: 'readonly',
    getCurrentPages: 'readonly',
    getApp: 'readonly'
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
    'vue'
  ],
  rules: {
    // Vue specific rules
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'error',
    
    // General rules
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': 'warn',
    'prefer-const': 'error'
  }
}