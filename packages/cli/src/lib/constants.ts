import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { ProjectType } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export { COMPONENTS, AVAILABLE_COMPONENTS } from 'brutx-shared-vue';
export type { ComponentMeta as ComponentInfo } from 'brutx-shared-vue';

export const CONFIG_FILES = {
    vite: ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'],
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

export const DEFAULT_ALIASES = {
    components: '@/components',
    utils: '@/lib/utils',
    composables: '@/composables',
} as const;

export const DEFAULT_TAILWIND_CONFIG = 'tailwind.config.js';

export const SCHEMA_URL = 'https://lidaixingchen.github.io/brutxui-vue3/schema.json';

export const DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/lidaixingchen/brutxui-vue3/main/packages/registry/registry';

export const BRUTALIST_CSS_STYLES = readFileSync(
    join(__dirname, '..', 'styles', 'brutalist.css'),
    'utf-8'
);

export const UTILS_TEMPLATE = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
`;
