import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { ProjectType, TrustedPublicKey } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 解析 styles 目录路径。
 * - 构建产物（dist/）中：styles/ 与 index.js 同级
 * - 源码（src/lib/）中：styles/ 在上级目录
 *
 * 仅对 ENOENT（候选不存在）继续尝试下一候选；权限等其他错误如实抛出，
 * 避免静默回退掩盖真实错误。候选必须是目录。
 */
async function resolveStylesDir(): Promise<string> {
    const candidates = [join(__dirname, 'styles'), join(__dirname, '..', 'styles')];
    for (const candidate of candidates) {
        try {
            if ((await stat(candidate)).isDirectory()) {
                return candidate;
            }
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    throw new Error(`无法定位 styles 目录（已尝试: ${candidates.join(', ')}）`);
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
    'vite-vue': ['src/index.css', 'src/style.css', 'src/App.css', 'src/assets/main.css', 'index.css'],
    'vite-vue-src': ['src/index.css', 'src/style.css', 'src/App.css', 'src/assets/main.css', 'src/styles/index.css'],
    nuxt: ['assets/css/main.css', 'assets/css/tailwind.css', 'assets/css/global.css'],
    unknown: [
        'src/index.css',
        'src/style.css',
        'src/assets/main.css',
        'src/styles/index.css',
        'assets/css/main.css',
        'index.css',
    ],
} as const;

export const SHARED_DEPENDENCIES = [
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
] as const;

export const COMPONENT_DEPENDENCIES = [
    '@lucide/vue',
    'reka-ui',
] as const;

// 由 SHARED 与 COMPONENT 并集展开生成，保持单一数据源（新增/删除依赖时无需重复维护）
export const BASE_DEPENDENCIES = [
    ...SHARED_DEPENDENCIES,
    ...COMPONENT_DEPENDENCIES,
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
    libUtils: 'lib/utils/',
    lib: 'lib/',
    directives: 'directives/',
} as const;

export const SCHEMA_URL = 'https://lidaixingchen.github.io/brutxui-vue3/schema.json';

/**
 * 默认 registry 源（产物发布时构建方案）：GitHub Release 资产，扁平命名，无目录层级。
 * 产物移出 git main 分支后 raw/jsDelivr 路径不再存在；Release 资产不可被 jsDelivr 镜像，
 * 故默认源为单元素数组（多源 fallback 引擎退化为单源尝试，可靠性由 GitHub 可用性兜底）。
 * 未配置自定义源时，resolveRegistrySources 返回此数组的副本。
 */
export const DEFAULT_REGISTRY_SOURCES = [
    'https://github.com/lidaixingchen/brutxui-vue3/releases/latest/download',
] as const;

/**
 * 默认主源（即 DEFAULT_REGISTRY_SOURCES 首项）。
 * 保留该导出以向后兼容旧调用方与测试；新代码优先使用 DEFAULT_REGISTRY_SOURCES。
 */
export const DEFAULT_REGISTRY_URL: string = DEFAULT_REGISTRY_SOURCES[0];

/**
 * 官方 Root 签名公钥 keyId（基础设施闭环 P1）。
 * 与 CI 发布工作流中的 BRUTX_REGISTRY_KEY_ID secret 保持一致。
 */
export const OFFICIAL_KEY_ID = 'official-v1';

/**
 * 官方 Root 公钥 Trust Store（基础设施闭环 P1）。
 * 集中收拢至 constants.ts，避免业务代码内联硬编码。
 * 用户零配置时 CLI 以这里的内置公钥校验官方 Registry manifest 签名。
 * 对应私钥保存在 CI Secret（BRUTX_REGISTRY_PRIVATE_KEY），永不入库。
 */
export const OFFICIAL_PUBLIC_KEYS: readonly TrustedPublicKey[] = [
    {
        keyId: OFFICIAL_KEY_ID,
        publicKey: 'MCowBQYDK2VwAyEAInjbAbxBUpf2XNWYyiUmp4owBPrUYLcz4IbTgFtTahM=',
        status: 'active',
        note: 'BrutxUI 官方注册表 Ed25519 签名密钥（SPKI DER / base64）',
    },
] as const;

export const DOCS_URL = 'https://lidaixingchen.github.io/brutxui-vue3/';

export const BRUTX_CSS_START_MARKER = '/* brutx-ui:start */';
export const BRUTX_CSS_END_MARKER = '/* brutx-ui:end */';

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// START → END 有序块匹配（非贪婪、跨行）。"是否已注入 BrutxUI tokens"的唯一判据：
// marker 顺序颠倒或分散（END 出现在 START 之前）时视为未注入，
// 与 init-service 的注入/替换行为保持一致，避免 doctor 误判已注入而 init 实际重复追加。
const BRUTX_CSS_BLOCK_PATTERN = new RegExp(
    `${escapeRegex(BRUTX_CSS_START_MARKER)}[\\s\\S]*?${escapeRegex(BRUTX_CSS_END_MARKER)}`,
);

/**
 * 判断 CSS 内容是否已包含完整的 BrutxUI tokens 块（BRUTX_CSS_START_MARKER ... BRUTX_CSS_END_MARKER 按序出现）。
 */
export function hasBrutxCssBlock(content: string): boolean {
    return BRUTX_CSS_BLOCK_PATTERN.test(content);
}

/**
 * 将 CSS 内容中已存在的 BrutxUI tokens 块整体替换为 replacement。
 * 块不存在时原样返回（调用方应先用 hasBrutxCssBlock 判断或自行处理追加分支）。
 */
export function replaceBrutxCssBlock(content: string, replacement: string): string {
    return content.replace(BRUTX_CSS_BLOCK_PATTERN, replacement);
}

let _brutalistCssStyles: string | undefined;

export async function getBrutalistCssStyles(): Promise<string> {
    if (_brutalistCssStyles === undefined) {
        try {
            const stylesDir = await resolveStylesDir();
            _brutalistCssStyles = await readFile(
                join(stylesDir, 'brutalist.css'),
                'utf-8'
            );
        } catch (error) {
            // 包装为带明确指引的错误，避免原始 ENOENT/EACCES 直接抛给调用方（doctor/init 命令）
            throw new Error(
                `读取 brutalist.css 失败，请确认 styles 目录及文件存在: ${(error as Error).message}`,
                { cause: error }
            );
        }
    }
    return _brutalistCssStyles;
}

export const CURRENT_CONFIG_VERSION = 1;

/* @brutx:cli-utils-template:start */
export const UTILS_TEMPLATE = `import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const BRUTAL_COLOR_NAMES = [
    'brutal-accent',
    'brutal-accent-foreground',
    'brutal-accent-subtle',
    'brutal-bg',
    'brutal-black',
    'brutal-destructive',
    'brutal-destructive-foreground',
    'brutal-destructive-subtle',
    'brutal-fg',
    'brutal-info',
    'brutal-info-foreground',
    'brutal-info-subtle',
    'brutal-muted',
    'brutal-muted-foreground',
    'brutal-overlay',
    'brutal-overlay-subtle',
    'brutal-placeholder',
    'brutal-primary',
    'brutal-primary-foreground',
    'brutal-primary-subtle',
    'brutal-ring',
    'brutal-secondary',
    'brutal-secondary-foreground',
    'brutal-secondary-subtle',
    'brutal-status-error',
    'brutal-status-error-foreground',
    'brutal-status-info',
    'brutal-status-info-foreground',
    'brutal-status-success',
    'brutal-status-success-foreground',
    'brutal-status-warning',
    'brutal-status-warning-foreground',
    'brutal-success',
    'brutal-success-foreground',
    'brutal-success-subtle',
    'brutal-yellow',
] as const;

const BRUTAL_Z_INDEX_NAMES = [
    'dialog',
    'dropdown',
    'header',
    'loading',
    'message',
    'popover',
    'preview-control',
    'preview-overlay',
    'sticky',
    'toast',
    'tooltip',
    'tour-canvas',
    'tour-popover',
] as const;

const customTwMerge = extendTailwindMerge({
    extend: {
        theme: {
            color: [...BRUTAL_COLOR_NAMES],
        },
        classGroups: {
            z: [{ z: [...BRUTAL_Z_INDEX_NAMES] }],
        },
    },
});

export const FOCUS_RING_CLASSES =
    "focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden";

export function cn(...inputs: ClassValue[]) {
    return customTwMerge(clsx(inputs));
}
`;

// 与 UTILS_TEMPLATE 逐字节一致，复用其定义保持单一数据源（须置于 UTILS_TEMPLATE 之后避免 TDZ）。
// doctor 的 AddCnFunction 用它追加到全新的 utils 文件（自带 import，保证自包含）。
export const CN_FUNCTION_TEMPLATE = UTILS_TEMPLATE;

// 仅函数体（无 import）：doctor 追加到已导入 clsx/tailwind-merge 的文件时使用，
// 避免同名 import 重复绑定导致 SyntaxError
export const CN_FUNCTION_BODY_TEMPLATE = `const BRUTAL_COLOR_NAMES = [
    'brutal-accent',
    'brutal-accent-foreground',
    'brutal-accent-subtle',
    'brutal-bg',
    'brutal-black',
    'brutal-destructive',
    'brutal-destructive-foreground',
    'brutal-destructive-subtle',
    'brutal-fg',
    'brutal-info',
    'brutal-info-foreground',
    'brutal-info-subtle',
    'brutal-muted',
    'brutal-muted-foreground',
    'brutal-overlay',
    'brutal-overlay-subtle',
    'brutal-placeholder',
    'brutal-primary',
    'brutal-primary-foreground',
    'brutal-primary-subtle',
    'brutal-ring',
    'brutal-secondary',
    'brutal-secondary-foreground',
    'brutal-secondary-subtle',
    'brutal-status-error',
    'brutal-status-error-foreground',
    'brutal-status-info',
    'brutal-status-info-foreground',
    'brutal-status-success',
    'brutal-status-success-foreground',
    'brutal-status-warning',
    'brutal-status-warning-foreground',
    'brutal-success',
    'brutal-success-foreground',
    'brutal-success-subtle',
    'brutal-yellow',
] as const;

const BRUTAL_Z_INDEX_NAMES = [
    'dialog',
    'dropdown',
    'header',
    'loading',
    'message',
    'popover',
    'preview-control',
    'preview-overlay',
    'sticky',
    'toast',
    'tooltip',
    'tour-canvas',
    'tour-popover',
] as const;

const customTwMerge = extendTailwindMerge({
    extend: {
        theme: {
            color: [...BRUTAL_COLOR_NAMES],
        },
        classGroups: {
            z: [{ z: [...BRUTAL_Z_INDEX_NAMES] }],
        },
    },
});

export const FOCUS_RING_CLASSES =
    "focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden";

export function cn(...inputs: ClassValue[]) {
    return customTwMerge(clsx(inputs));
}
`;
/* @brutx:cli-utils-template:end */

