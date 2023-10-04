module.exports = {
  env: {
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended', // Use recommended rules from the @typescript-eslint/eslint-plugin
  ],
  parser: '@typescript-eslint/parser', // Use the TypeScript parser
  parserOptions: {
    ecmaVersion: 'latest',
    project: './tsconfig.json', // Point to your tsconfig.json
    sourceType: 'module', // Allows the use of imports
  },
  plugins: ['@typescript-eslint'], // Use the TypeScript plugin
  rules: {
    'max-len': ['error', { code: 200, ignoreComments: true }],
    'brace-style': ['error', 'stroustrup', { allowSingleLine: false }],
    'no-console': 'off',
    'no-multi-str': 'off',
    'no-continue': 'off',
    '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: true, variables: true }], // Use the TypeScript version of the rule
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-unsafe-member-access': 2,
    "@typescript-eslint/explicit-function-return-type": 1,
    "no-shadow": "off",
    "no-extend-native": "off",
    "@typescript-eslint/no-shadow": ["error"]
  },
  settings: {
    "import/resolver": {
      "node": {
        "extensions": [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  },
  ignorePatterns: ['.eslintrc.js'],
};
