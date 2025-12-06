// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import unused from 'eslint-plugin-unused-imports';

export default [
  { ignores: ['dist', 'node_modules', 'coverage', 'public/cub3d'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
      'unused-imports': unused,
    },
    rules: {
      // general
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off', // handled by unused-imports
      // imports
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        },
      ],
      // react + jsx
      'react/jsx-uses-vars': 'error', // ⬅️ mark JSX identifiers as used
      'react/jsx-uses-react': 'off', // new JSX transform
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // unused imports/vars
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
    },
    settings: { react: { version: 'detect' } },
  },
];
