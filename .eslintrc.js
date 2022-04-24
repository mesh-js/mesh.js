module.exports = {
  globals: {
    meshjs: true,
    importScripts: true,
    globalThis: true,
  },
  extends:  "eslint-config-sprite",
  plugins: ['html'],
  rules: {
    "complexity": ["warn", 50],
    'import/prefer-default-export': 'off',
    "no-unused-vars": 'warn',
    'no-restricted-globals': 'off',
  },
}
