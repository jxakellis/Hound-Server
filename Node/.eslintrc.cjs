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
    // Custom 
    'max-len': ['error', { code: 200, ignoreComments: true }], 
    'brace-style': ['error', 'stroustrup', { allowSingleLine: false }],
    // Error
    '@typescript-eslint/no-unsafe-member-access': ['error'],
    "@typescript-eslint/strict-boolean-expressions": [
      "error",
      {
        "allowString": false,
        "allowNumber": false,
        "allowNullableObject": false,
        "allowNullableBoolean": false,
        "allowNullableString": false,
        "allowNullableNumber": false,
        "allowNullableEnum": false,
        "allowAny": false,
        "allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing": false
      }
    ],
    'array-callback-return': ['error'],
    // Warn
    "@typescript-eslint/explicit-function-return-type": ['warn'],
    "@typescript-eslint/no-shadow": ['warn'],
    "@typescript-eslint/no-explicit-any": ['warn'],
    'no-console': ['warn'],
    // Off
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    // no-shadow is disabled in favor of enabling @typescript-eslint/no-shadow
    "no-shadow": "off",
    "dot-notation": "off",
  },
  settings: {
    "import/resolver": {
      "node": {
        "alwaysTryTypes": true,
        "extensions": [".js", ".jsx", ".ts", ".tsx"]
      },
    }
  },
  ignorePatterns: ['.eslintrc.*', 'built/', 'pm2.config.*', 'tsconfig.*'],
};
