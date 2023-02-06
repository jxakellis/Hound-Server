module.exports = {
  env: {
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'max-len': ['error', { code: 200, ignoreComments: true }],
    'brace-style': ['error', 'stroustrup', { allowSingleLine: false }],
    'no-console': 'off',
    'no-multi-str': 'off',
    'no-continue': 'off',
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
  },
};
