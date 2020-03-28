module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: 'eslint:recommended',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2019,
  },
  rules: {},
  overrides: [
    Object.assign(
      {
        files: ['**/*.{test,spec}.js', '**/{tests,__tests__}/**/*.*'],
        env: { jest: true },
        plugins: ['jest'],
      },
      require('eslint-plugin-jest').configs.recommended,
    ),
  ],
};
