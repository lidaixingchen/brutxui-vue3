/**
 * Constants and configuration data
 * All hardcoded values should be centralized here
 */

import type { ProjectType } from './types.js';

// Re-export component metadata from the shared package (single source of truth)
export { COMPONENTS, AVAILABLE_COMPONENTS } from 'brutx-shared';
export type { ComponentMeta as ComponentInfo } from 'brutx-shared';

// ============================================================================
// File Patterns - No hardcoding in other files
// ============================================================================

export const CONFIG_FILES = {
    next: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    vite: ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'],
    remix: ['remix.config.js'],
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

// ============================================================================
// CSS File Locations by Project Type
// ============================================================================

export const CSS_LOCATIONS: Record<ProjectType, readonly string[]> = {
    nextjs: ['app/globals.css', 'styles/globals.css', 'app/global.css'],
    'nextjs-src': ['src/app/globals.css', 'src/styles/globals.css', 'src/app/global.css'],
    vite: ['src/index.css', 'src/App.css', 'index.css'],
    'vite-src': ['src/index.css', 'src/App.css', 'src/styles/index.css'],
    cra: ['src/index.css', 'src/App.css'],
    remix: ['app/styles/global.css', 'app/root.css', 'app/tailwind.css'],
    unknown: [
        'src/index.css',
        'src/app/globals.css',
        'app/globals.css',
        'src/styles/globals.css',
        'styles/globals.css',
        'index.css',
    ],
} as const;

// ============================================================================
// Base Dependencies (installed on init)
// ============================================================================

export const BASE_DEPENDENCIES = [
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
    'lucide-react',
] as const;

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_ALIASES = {
    components: '@/components',
    utils: '@/lib/utils',
} as const;

export const DEFAULT_TAILWIND_CONFIG = 'tailwind.config.js';

export const SCHEMA_URL = 'https://brutxui.site/schema.json';

export const DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/dev-snake/brutxui/main/packages/registry/registry';

// ============================================================================
// Brutalist CSS Styles
// ============================================================================

export const BRUTALIST_CSS_STYLES = `
/* Brutalist UI Styles */
:root {
    --brutal-border-width: 3px;
    --brutal-border-color: #000000;
    --brutal-shadow-color: #000000;
    --brutal-shadow-offset-sm: 2px;
    --brutal-shadow-offset: 4px;
    --brutal-shadow-offset-lg: 6px;
    --brutal-shadow-offset-xl: 8px;
}

.dark {
    --brutal-border-color: #ffffff;
    --brutal-shadow-color: #ffffff;
}

.border-3 {
    border-width: var(--brutal-border-width, 3px);
}

.border-brutal {
    border-color: var(--brutal-border-color, #000000);
}

.shadow-brutal {
    box-shadow: var(--brutal-shadow-offset, 4px) var(--brutal-shadow-offset, 4px) 0px 0px var(--brutal-shadow-color, #000000);
}

.shadow-brutal-sm {
    box-shadow: var(--brutal-shadow-offset-sm, 2px) var(--brutal-shadow-offset-sm, 2px) 0px 0px var(--brutal-shadow-color, #000000);
}

.shadow-brutal-lg {
    box-shadow: var(--brutal-shadow-offset-lg, 6px) var(--brutal-shadow-offset-lg, 6px) 0px 0px var(--brutal-shadow-color, #000000);
}

.shadow-brutal-xl {
    box-shadow: var(--brutal-shadow-offset-xl, 8px) var(--brutal-shadow-offset-xl, 8px) 0px 0px var(--brutal-shadow-color, #000000);
}
`;

// ============================================================================
// Utils Template
// ============================================================================

export const UTILS_TEMPLATE = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
`;
