import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      '**/build/',
      '**/dist/',
      '**/coverage/',
      'backend/src/generated/',
      'data/',
      'docs/',
      'test-results/',
      'playwright-report/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      complexity: ['error', 15],
    },
  },
  {
    files: ['frontend/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, jsxA11y.flatConfigs.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['backend/**/*.{ts,js}', 'e2e/**/*.ts', 'scripts/**/*.mjs', '*.{ts,mjs,js}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['backend/jest.config.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
  prettier,
);
