import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';

export default [
  // Base configuration
  js.configs.recommended,
  
  // Global configuration for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Best practices
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_|^client$' }],
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Import rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index'
          ],
          'newlines-between': 'always',
        },
      ],
      'import/newline-after-import': 'error',
      
      // Code style
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      
      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
  
  // Configuration for scripts and CLI tools
  {
    files: ['scripts/**/*.js', 'migrations/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
  
  // Configuration for test files
  {
    files: ['**/*.test.js', '**/*.spec.js', 'jest.setup.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
    ],
  },
];
