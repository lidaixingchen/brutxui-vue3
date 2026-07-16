import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

// SSR-unsafe globals that must be accessed via @/lib/env wrappers (§3.2).
// `no-restricted-globals` intercepts bare references (e.g. `document`);
// `no-restricted-syntax` intercepts member access (e.g. `window.localStorage`).
const SSR_UNSAFE_GLOBALS = [
    'window', 'document', 'navigator',
    'localStorage', 'sessionStorage',
    'MutationObserver', 'IntersectionObserver', 'ResizeObserver',
    'getComputedStyle', 'history', 'location',
    // requestAnimationFrame / cancelAnimationFrame use no-op wrappers in env.ts;
    // lint still requires routing through the tool layer to keep a single entry point.
    'requestAnimationFrame', 'cancelAnimationFrame',
]

const SSR_UNSAFE_MEMBER_SELECTORS = [
    'MemberExpression[object.type="Identifier"][object.name="window"]',
    'MemberExpression[object.type="Identifier"][object.name="globalThis"]',
    'MemberExpression[object.type="Identifier"][object.name="self"]',
]

export default tseslint.config(
    {
        ignores: ['**/dist/**', '**/node_modules/**', '**/*.d.ts'],
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
            'vue/singleline-html-element-content-newline': 'off',
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
        files: ['**/*.test.ts', '**/*.spec.ts', 'src/test-utils/**/*.ts'],
        rules: {
            'vue/one-component-per-file': 'off',
            'no-restricted-imports': 'off',  // 测试文件允许导入 vitest.setup.ts 等特殊路径
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
        },
    },
    // §3.2 SSR-safe lint: production code must route DOM/BOM access through @/lib/env.
    {
        files: ['src/**/*.ts', 'src/**/*.vue', 'src/**/*.tsx'],
        ignores: ['src/lib/env.ts', 'src/test-utils/**'],
        rules: {
            'no-restricted-globals': ['error', ...SSR_UNSAFE_GLOBALS.map(name => ({
                name,
                message: `Use the corresponding getter from "@/lib/env" for SSR safety (e.g. getDocument(), getLocalStorage()).`,
            }))],
            'no-restricted-syntax': ['error', ...SSR_UNSAFE_MEMBER_SELECTORS.map(selector => ({
                selector,
                message: 'Use getXxx() from "@/lib/env" for SSR safety. Do not access window/globalThis/self directly.',
            }))],
        },
    },
    // §3.2 SSR-safe lint: env.ts (tool layer impl) + test files are exempt.
    {
        files: [
            'src/lib/env.ts',
            '**/*.test.ts',
            '**/*.spec.ts',
            'src/test-utils/**',
            'src/test/**',
            'src/vitest.setup.ts',
            'src/vitest.browser.setup.ts',
        ],
        rules: {
            'no-restricted-globals': 'off',
            'no-restricted-syntax': 'off',
        },
    },
)
