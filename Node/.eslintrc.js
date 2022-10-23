module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'max-len': ['error', { code: 9999, ignoreComments: true }],
    'brace-style': ['error', 'stroustrup', { allowSingleLine: false }],
    'no-console': 'off',
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    'no-restricted-syntax': 'off',
  },
};
