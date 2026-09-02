import path from 'path';
import { DiskFileSystemAdapter, type FileSystemAdapter } from 'brutx-shared-vue/fs';
import type { BrutalistConfig, RuleSeverity, TrustedPublicKey } from './types.js';
import {
    SCHEMA_URL,
    DEFAULT_ALIASES,
    DEFAULT_TAILWIND_CONFIG,
    CURRENT_CONFIG_VERSION,
} from './constants.js';

const defaultDiskFs = new DiskFileSystemAdapter();

/**
 * 校验原始 components.json 数据格式是否合法。
 */
export function validateBrutalistConfig(data: unknown): asserts data is Record<string, unknown> {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('Invalid components.json: expected an object.');
    }

    const config = data as Record<string, unknown>;

    if (config.$schema !== undefined && typeof config.$schema !== 'string') {
        throw new Error('Invalid components.json: "$schema" must be a string.');
    }

    if (config.style !== undefined && typeof config.style !== 'string') {
        throw new Error('Invalid components.json: "style" must be a string.');
    }

    if (config.tailwind !== undefined) {
        if (typeof config.tailwind !== 'object' || config.tailwind === null || Array.isArray(config.tailwind)) {
            throw new Error('Invalid components.json: "tailwind" must be an object.');
        }
        const tailwind = config.tailwind as Record<string, unknown>;
        if (tailwind.config !== undefined && typeof tailwind.config !== 'string') {
            throw new Error('Invalid components.json: "tailwind.config" must be a string.');
        }
        if (tailwind.css !== undefined && typeof tailwind.css !== 'string') {
            throw new Error('Invalid components.json: "tailwind.css" must be a string.');
        }
    }

    if (config.aliases !== undefined) {
        if (typeof config.aliases !== 'object' || config.aliases === null || Array.isArray(config.aliases)) {
            throw new Error('Invalid components.json: "aliases" must be an object.');
        }
        const aliases = config.aliases as Record<string, unknown>;
        if (aliases.components !== undefined && typeof aliases.components !== 'string') {
            throw new Error('Invalid components.json: "aliases.components" must be a string.');
        }
        if (aliases.utils !== undefined && typeof aliases.utils !== 'string') {
            throw new Error('Invalid components.json: "aliases.utils" must be a string.');
        }
        if (aliases.composables !== undefined && typeof aliases.composables !== 'string') {
            throw new Error('Invalid components.json: "aliases.composables" must be a string.');
        }
    }

    if (config.registries !== undefined) {
        if (!Array.isArray(config.registries) || config.registries.some(url => typeof url !== 'string' || url.length === 0)) {
            throw new Error('Invalid components.json: "registries" must be an array of non-empty strings.');
        }
    }

    if (config.requireSignature !== undefined && typeof config.requireSignature !== 'boolean') {
        throw new Error('Invalid components.json: "requireSignature" must be a boolean.');
    }

    if (config.trustedPublicKeys !== undefined) {
        if (!Array.isArray(config.trustedPublicKeys)) {
            throw new Error('Invalid components.json: "trustedPublicKeys" must be an array.');
        }
        for (const key of config.trustedPublicKeys) {
            if (typeof key !== 'object' || key === null || Array.isArray(key)) {
                throw new Error('Invalid components.json: each "trustedPublicKeys" entry must be an object.');
            }
            const k = key as Record<string, unknown>;
            if (typeof k.keyId !== 'string' || k.keyId.length === 0) {
                throw new Error('Invalid components.json: each "trustedPublicKeys" entry requires a non-empty "keyId".');
            }
            if (typeof k.publicKey !== 'string' || k.publicKey.length === 0) {
                throw new Error('Invalid components.json: each "trustedPublicKeys" entry requires a non-empty "publicKey".');
            }
        }
    }

    if (config.plugins !== undefined) {
        if (!Array.isArray(config.plugins) || config.plugins.some(p => typeof p !== 'string' || p.length === 0)) {
            throw new Error('Invalid components.json: "plugins" must be an array of non-empty strings.');
        }
    }

    if (config.rules !== undefined) {
        if (typeof config.rules !== 'object' || config.rules === null || Array.isArray(config.rules)) {
            throw new Error('Invalid components.json: "rules" must be an object.');
        }
        for (const [ruleId, severity] of Object.entries(config.rules as Record<string, unknown>)) {
            if (severity !== 'off' && severity !== 'warn' && severity !== 'error') {
                throw new Error(`Invalid components.json: rule "${ruleId}" severity must be "off", "warn", or "error".`);
            }
        }
    }
}

/**
 * 迁移旧版本配置至当前版本规范。
 */
export async function migrateConfig(raw: Record<string, unknown>): Promise<Record<string, unknown>> {
    const version = typeof raw.$version === 'number' ? raw.$version : 0;

    if (version >= CURRENT_CONFIG_VERSION) {
        return raw;
    }

    const migrated = { ...raw };

    // v0 → v1: add $schema and $version if missing
    if (version < 1) {
        if (!migrated.$schema) {
            migrated.$schema = SCHEMA_URL;
        }
        migrated.$version = 1;
    }

    return migrated;
}

/**
 * 安全尝试读取 components.json，文件不存在或格式异常时返回 null。
 */
export async function readConfigSafe(
    cwd: string,
    fsAdapter: FileSystemAdapter = defaultDiskFs,
): Promise<BrutalistConfig | null> {
    try {
        return await readConfig(cwd, fsAdapter);
    } catch {
        return null;
    }
}

/**
 * 读取并校验 components.json 配置（纯函数，无隐式全局副作用）。
 */
export async function readConfig(
    cwd: string,
    fsAdapter: FileSystemAdapter = defaultDiskFs,
): Promise<BrutalistConfig> {
    const configPath = path.join(cwd, 'components.json');
    if (!(await fsAdapter.pathExists(configPath))) {
        throw new Error('components.json not found. Run `brutx-vue init` first.');
    }

    let config: unknown;
    try {
        config = await fsAdapter.readJson(configPath);
    } catch (error) {
        throw new Error(`Failed to parse components.json: invalid JSON. ${error instanceof Error ? error.message : ''}`, { cause: error });
    }

    validateBrutalistConfig(config);

    const raw = await migrateConfig(config);
    const rawTailwind = raw.tailwind;
    const rawAliases = raw.aliases;

    const tailwind = (typeof rawTailwind === 'object' && rawTailwind !== null && !Array.isArray(rawTailwind))
        ? rawTailwind as Record<string, unknown>
        : undefined;
    const aliases = (typeof rawAliases === 'object' && rawAliases !== null && !Array.isArray(rawAliases))
        ? rawAliases as Record<string, unknown>
        : undefined;

    const parsed: BrutalistConfig = {
        $schema: (typeof raw.$schema === 'string' ? raw.$schema : undefined) ?? SCHEMA_URL,
        $version: typeof raw.$version === 'number' ? raw.$version : undefined,
        style: (typeof raw.style === 'string' ? raw.style : undefined) ?? 'brutalism',
        tailwind: {
            config: (typeof tailwind?.config === 'string' ? tailwind.config : undefined) ?? DEFAULT_TAILWIND_CONFIG,
            css: (typeof tailwind?.css === 'string' ? tailwind?.css : undefined) ?? '@/styles/globals.css',
        },
        aliases: {
            components: (typeof aliases?.components === 'string' ? aliases.components : undefined) ?? DEFAULT_ALIASES.components,
            utils: (typeof aliases?.utils === 'string' ? aliases.utils : undefined) ?? DEFAULT_ALIASES.utils,
            composables: (typeof aliases?.composables === 'string' ? aliases.composables : undefined) ?? DEFAULT_ALIASES.composables,
        },
        sharedBase: typeof raw.sharedBase === 'string' ? raw.sharedBase : undefined,
        registries: Array.isArray(raw.registries)
            ? raw.registries.filter((url): url is string => typeof url === 'string' && url.length > 0)
            : undefined,
        plugins: Array.isArray(raw.plugins)
            ? raw.plugins.filter((p): p is string => typeof p === 'string' && p.length > 0)
            : undefined,
        rules: (typeof raw.rules === 'object' && raw.rules !== null && !Array.isArray(raw.rules))
            ? Object.fromEntries(
                Object.entries(raw.rules as Record<string, unknown>).filter(
                    ([, v]) => v === 'off' || v === 'warn' || v === 'error'
                )
            ) as Record<string, RuleSeverity>
            : undefined,
        requireSignature: typeof raw.requireSignature === 'boolean' ? raw.requireSignature : undefined,
        trustedPublicKeys: Array.isArray(raw.trustedPublicKeys)
            ? (raw.trustedPublicKeys as Array<Record<string, unknown>>)
                .filter(
                    k => typeof k === 'object' && k !== null &&
                        typeof k.keyId === 'string' && k.keyId.length > 0 &&
                        typeof k.publicKey === 'string' && k.publicKey.length > 0
                )
                .map((k): TrustedPublicKey => ({
                    keyId: k.keyId as string,
                    publicKey: k.publicKey as string,
                    status: (k.status === 'active' || k.status === 'rotated' || k.status === 'revoked') ? k.status : undefined,
                    note: typeof k.note === 'string' ? k.note : undefined,
                }))
            : undefined,
    };

    return parsed;
}
