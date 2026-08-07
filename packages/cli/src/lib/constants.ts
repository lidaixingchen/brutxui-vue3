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
 * 默认多 registry 源（基础设施闭环 P0）：GitHub Raw 主源 + jsDelivr CDN 镜像。
 * 未配置自定义源时，resolveRegistrySources 返回此数组的副本，
 * 使多源 fallback 引擎在零配置下即可提供 CDN 冗余高可用。
 */
export const DEFAULT_REGISTRY_SOURCES = [
    'https://raw.githubusercontent.com/lidaixingchen/brutxui-vue3/main/packages/registry/registry',
    'https://cdn.jsdelivr.net/gh/lidaixingchen/brutxui-vue3@main/packages/registry/registry',
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

// 自包含模板：自带 import（与 UTILS_TEMPLATE 一致）。doctor 的 AddCnFunction 会把该模板
// 追加到已有 utils 文件末尾——若文件此前未导入 clsx/tailwind-merge，缺少 import 会编译失败
export const CN_FUNCTION_TEMPLATE = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
`;

export const UTILS_TEMPLATE = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
`;
