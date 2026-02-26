// @ts-check

import eslint from '@eslint/js';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importPlugin from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.turbo/**',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  jsdoc.configs['flat/recommended-typescript-error'],
  eslintPluginPrettier,

  {
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-extraneous-dependencies': 'error',
      'import-x/order': [
        'error',
        {
          pathGroups: [
            {
              pattern: '{./__tests__/fixtures/**,../__tests__/fixtures/**}',
              group: 'sibling',
              position: 'after',
            },
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: false,
          },
          pathGroupsExcludedImportTypes: ['builtin', 'object'],
          'newlines-between': 'always',
        },
      ],
    },
  },

  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  {
    rules: {
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/multiline-blocks': ['error', { noSingleLineBlocks: true }],
    },
  },

  {
    files: ['**/*.spec.ts', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },
);
