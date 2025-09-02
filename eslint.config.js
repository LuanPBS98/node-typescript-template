import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import airbnb from 'eslint-config-airbnb-base';
import airbnbTs from 'eslint-config-airbnb-typescript';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
        ...globals.es2022
      }
    },
    plugins: {
      '@typescript-eslint': tsEslint
    },
    rules: {
      'import/extensions': 'off',
      'lines-between-class-members': 'off',
      'no-useless-constructor': 'off',
      
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      'no-console': 'off',
      'class-methods-use-this': 'off',
      'import/prefer-default-export': 'off',
    }
  },
  {
    ...airbnb,
    ...airbnbTs
  },
  prettier
];