import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { ProjectType } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 解析 styles 目录路径。
 * - 构建产物（dist/）中：styles/ 与 index.js 同级
 * - 源码（src/lib/）中：styles/ 在上级目录
 */
async function resolveStylesDir(): Promise<string> {
    const direct = join(__dirname, 'styles');
    try {
        await access(direct);
        return direct;
    } catch {
        return join(__dirname, '..', 'styles');
    }
}

export { COMPONENTS, AVAILABLE_COMPONENTS } from 'brutx-shared-vue';

export const CONFIG_FILES = {
    nuxt: ['nuxt.config.js', 'nuxt.config.ts', 'nuxt.config.mjs'],
    tailwind: [
        'tailwind.config.ts',
        'tailwind.config.js',
        'tailwind.config.mjs',
        'tailwind.config.cjs',
    ],
    tsconfig: ['tsconfig.json', 'jsconfig.json'],
    lockfiles: {
        pnpm: 'pnpm-lock.yaml',
        yarn: 'yarn.lock',
        bun: 'bun.lockb',
    },
} as const;

export const CSS_LOCATIONS: Record<ProjectType, readonly string[]> = {
    'vite-vue': ['src/index.css', 'src/App.css', 'src/assets/main.css', 'index.css'],
    'vite-vue-src': ['src/index.css', 'src/App.css', 'src/assets/main.css', 'src/styles/index.css'],
    nuxt: ['assets/css/main.css', 'assets/css/tailwind.css', 'assets/css/global.css'],
    unknown: [
        'src/index.css',
        'src/assets/main.css',
        'src/styles/index.css',
        'assets/css/main.css',
        'index.css',
    ],
} as const;

export const BASE_DEPENDENCIES = [
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
    '@lucide/vue',
    'reka-ui',
] as const;

export const SHARED_DEPENDENCIES = [
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
] as const;

export const COMPONENT_DEPENDENCIES = [
    '@lucide/vue',
    'reka-ui',
] as const;

export const DEFAULT_ALIASES = {
    components: '@/components',
    utils: '@/lib/utils',
    composables: '@/composables',
} as const;

export const DEFAULT_TAILWIND_CONFIG = 'tailwind.config.js';

export const REGISTRY_PATH_PREFIXES = {
    components: 'components/',
    composables: 'composables/',
    locales: 'locales/',
    libUtils: 'lib/utils',
    lib: 'lib/',
    directives: 'directives/',
} as const;

export const SCHEMA_URL = 'https://lidaixingchen.github.io/brutxui-vue3/schema.json';

export const DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/lidaixingchen/brutxui-vue3/main/packages/registry/registry';

export const DOCS_URL = 'https://lidaixingchen.github.io/brutxui-vue3/';

let _brutalistCssStyles: string | undefined;

export async function getBrutalistCssStyles(): Promise<string> {
    if (_brutalistCssStyles === undefined) {
        const stylesDir = await resolveStylesDir();
        _brutalistCssStyles = await readFile(
            join(stylesDir, 'brutalist.css'),
            'utf-8'
        );
    }
    return _brutalistCssStyles;
}

export const CURRENT_CONFIG_VERSION = 1;

export const CN_FUNCTION_TEMPLATE = `export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
`;

export const UTILS_TEMPLATE = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
`;
