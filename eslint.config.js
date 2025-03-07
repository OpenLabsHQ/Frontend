import js from '@eslint/js';
import svelteParser from 'svelte-eslint-parser';
import sveltePlugin from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-undef': 'off' // Disable no-undef as TypeScript catches these errors
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    plugins: {
      svelte: sveltePlugin,
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      'no-undef': 'off' // Disable no-undef for Svelte files (browser globals like window, document)
    },
  },
  prettierConfig,
  {
    ignores: ['**/node_modules/**', '**/build/**'],
  },
];