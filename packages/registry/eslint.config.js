import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
    {
        ignores: ['**/node_modules/**', 'registry/**', '**/*.d.ts'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/consistent-type-assertions': ['error', {
                assertionStyle: 'as',
                objectLiteralTypeAssertions: 'allow',
            }],
        },
    },
    {
        files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
)
