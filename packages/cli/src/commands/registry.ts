import { DiskFileSystemAdapter } from 'brutx-shared-vue/fs';
const defaultDiskFs = new DiskFileSystemAdapter();
import path from 'path';
import { resolveRegistrySources, readConfigSafe, isOfflineRequested, CliError, logger } from '../lib/index.js';

/**
 * registry 源管理子命令（基础设施闭环 P1）：
 *   - `brutx registry list`   —— 打印当前解析生效的所有源及其连通性状态
 *   - `brutx registry add`    —— 向 components.json 的 registries 列表添加源
 *   - `brutx registry remove` —— 移除指定源
 */

export interface RegistrySourceStatus {
    url: string;
    reachable: boolean;
    /** 离线模式下未执行网络探测时为 true（reachable 固定为 false，但不代表不可达） */
    skipped?: boolean;
    latencyMs?: number;
    error?: string;
}

async function probeSource(source: string): Promise<RegistrySourceStatus> {
    if (!source.startsWith('http://') && !source.startsWith('https://')) {
        const exists = await defaultDiskFs.pathExists(source);
        return {
            url: source,
            reachable: exists,
            error: exists ? undefined : 'Local registry path does not exist',
        };
    }
    const probeUrl = `${source}/registry-manifest.json`;
    const start = Date.now();
    try {
        const res = await fetch(probeUrl, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
        const latencyMs = Date.now() - start;
        return {
            url: source,
            reachable: res.ok,
            latencyMs,
            error: res.ok ? undefined : `HTTP ${res.status} ${res.statusText}`,
        };
    } catch (error) {
        const latencyMs = Date.now() - start;
        return {
            url: source,
            reachable: false,
            latencyMs,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

async function readConfigRaw(cwd: string): Promise<Record<string, unknown>> {
    const configPath = path.join(cwd, 'components.json');
    if (!(await defaultDiskFs.pathExists(configPath))) {
        throw new CliError('components.json not found. Run `brutx-vue init` first.', {
            code: 'CONFIG_NOT_FOUND',
        });
    }
    let raw: unknown;
    try {
        raw = await defaultDiskFs.readJson(configPath);
    } catch (error) {
        throw new CliError(`Failed to parse components.json: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        throw new CliError('Invalid components.json: expected an object.');
    }
    return raw as Record<string, unknown>;
}

export async function registryList(options: { cwd?: string; json?: boolean; offline?: boolean }): Promise<void> {
    const cwd = options.cwd ?? process.cwd();
    const config = await readConfigSafe(cwd);
    const sources = resolveRegistrySources(config);
    // 基础设施闭环 P2：离线模式下跳过网络探测（与 doctor 一致），仅报告已配置源列表。
    const offline = isOfflineRequested(options.offline);
    const results: RegistrySourceStatus[] = offline
        ? sources.map(url => ({ url, reachable: false, skipped: true, error: 'Offline mode, reachability check skipped.' }))
        : await Promise.all(sources.map(probeSource));

    if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
    }

    logger.newLine();
    logger.bold('Registry Sources');
    logger.newLine();
    for (const r of results) {
        const icon = r.reachable ? '✅' : (r.skipped ? '⏸' : '❌');
        const latency = r.latencyMs !== undefined ? ` (${r.latencyMs}ms)` : '';
        const err = r.error ? ` — ${r.error}` : '';
        logger.log(`  ${icon} ${r.url}${latency}${err}`);
    }
    logger.newLine();
    logger.info(`${results.length} source(s) resolved (first is primary).`);
    logger.newLine();
}

export async function registryAdd(url: string, options: { cwd?: string }): Promise<void> {
    const cwd = options.cwd ?? process.cwd();
    const normalized = url.trim();
    if (normalized.length === 0) {
        throw new CliError('Registry source URL must not be empty.');
    }

    const raw = await readConfigRaw(cwd);
    const registries = Array.isArray(raw.registries)
        ? raw.registries.filter((u): u is string => typeof u === 'string' && u.length > 0)
        : [];

    if (registries.includes(normalized)) {
        logger.info(`Registry source already present: ${normalized}`);
        return;
    }

    raw.registries = [...registries, normalized];
    await defaultDiskFs.writeJson(path.join(cwd, 'components.json'), raw, { spaces: 2 });
    logger.success(`Added registry source: ${normalized}`);
}

export async function registryRemove(url: string, options: { cwd?: string }): Promise<void> {
    const cwd = options.cwd ?? process.cwd();
    const normalized = url.trim();

    const raw = await readConfigRaw(cwd);
    const registries = Array.isArray(raw.registries)
        ? raw.registries.filter((u): u is string => typeof u === 'string' && u.length > 0)
        : [];

    if (!registries.includes(normalized)) {
        logger.warn(`Registry source not found: ${normalized}`);
        return;
    }

    const remaining = registries.filter(u => u !== normalized);
    if (remaining.length === 0) {
        // 移除最后一个自定义源后删除字段，恢复官方默认多源
        delete raw.registries;
    } else {
        raw.registries = remaining;
    }

    await defaultDiskFs.writeJson(path.join(cwd, 'components.json'), raw, { spaces: 2 });
    logger.success(`Removed registry source: ${normalized}`);
}
