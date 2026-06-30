import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default tseslint.config(
    {
        ignores: ['**/dist/**', '**/node_modules/**', '**/*.d.ts', '**/brutalism-plugin.js'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {
        files: ['*.vue', '**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
            },
        },
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            'vue/max-attributes-per-line': 'off',
            'vue/html-indent': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/consistent-type-assertions': ['error', {
                assertionStyle: 'as',
                objectLiteralTypeAssertions: 'allow',
            }],
            'no-restricted-imports': ['error', {
                patterns: [{
                    group: ['../../*'],
                    message: '请使用 @/ 别名代替多层相对路径导入',
                }],
            }],
        },
    },
    {
        files: ['**/*.test.ts', '**/*.spec.ts'],
        rules: {
            'vue/one-component-per-file': 'off',
            'no-restricted-imports': 'off',  // 测试文件允许导入 vitest.setup.ts 等特殊路径
        },
    }
)
