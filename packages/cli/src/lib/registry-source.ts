import { DEFAULT_REGISTRY_URL } from './constants.js';
import { isOfflineMode } from './cache.js';
import { CliError } from './error.js';
import { logger } from './logger.js';
import type { BrutalistConfig } from './types.js';

/**
 * 多 registry 源与离线韧性（P1-5）
 *
 * 解析优先级（高 → 低）：
 *   1. 命令行 --registry（覆盖整个源列表）
 *   2. components.json 的 registries 数组（主源 + 镜像）
 *   3. DEFAULT_REGISTRY_URL（兜底）
 *
 * 离线模式（BRUTX_OFFLINE=1 或 --offline）：
 *   - 不发网络请求，只读缓存
 *   - TTL 过期也复用（但调用方必须通过 integrity 校验）
 *   - 缓存未命中时抛 REGISTRY_OFFLINE_UNAVAILABLE
 *
 * 认证：
 *   - BRUTX_REGISTRY_TOKEN → 注入 Authorization: Bearer <token>
 *   - BRUTX_REGISTRY_HEADERS → JSON 格式额外 header（覆盖 token）
 *   - 仅对 http(s):// 源生效；本地文件源不注入
 */

const TOKEN_ENV = 'BRUTX_REGISTRY_TOKEN';
const HEADERS_ENV = 'BRUTX_REGISTRY_HEADERS';
const OFFLINE_ENV = 'BRUTX_OFFLINE';

/**
 * 返回按优先级排列的 registry 源列表。
 * - override 非空时只返回 [override]
 * - 否则取 config.registries（过滤空串）
 * - 都没有时返回 [DEFAULT_REGISTRY_URL]
 */
export function resolveRegistrySources(
    config: BrutalistConfig | null,
    override?: string,
): string[] {
    if (override) {
        return [override];
    }
    const fromConfig = config?.registries?.filter(url => typeof url === 'string' && url.length > 0);
    if (fromConfig && fromConfig.length > 0) {
        return fromConfig;
    }
    return [DEFAULT_REGISTRY_URL];
}

/**
 * 全局离线开关：BRUTX_OFFLINE=1 或显式 --offline 均激活。
 */
export function isOfflineRequested(flagValue?: boolean): boolean {
    return flagValue === true || isOfflineMode();
}

/**
 * 为指定 registry URL 注入认证 header。
 *
 * 规则：
 *   - BRUTX_REGISTRY_HEADERS 若可解析为 JSON 对象，则完全替代默认 token header
 *   - 否则 BRUTX_REGISTRY_TOKEN 作为 Bearer token 注入
 *   - 仅对 http(s):// 源生效；本地路径源不注入
 *   - 公共 registry 也会注入（用户若设了 token，视为希望走认证）
 */
export function buildAuthHeaders(registryUrl: string): Record<string, string> {
    if (!isHttpUrl(registryUrl)) return {};

    const headersEnv = process.env[HEADERS_ENV];
    if (headersEnv) {
        try {
            const parsed = JSON.parse(headersEnv);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                return parsed as Record<string, string>;
            }
        } catch {
            logger.debug(`BRUTX_REGISTRY_HEADERS is not valid JSON, falling back to BRUTX_REGISTRY_TOKEN.`);
        }
    }

    const token = process.env[TOKEN_ENV];
    if (token) {
        return { Authorization: `Bearer ${token}` };
    }
    return {};
}

function isHttpUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
}

/**
 * 多源 fallback 执行器：按序尝试每个源，首个成功的胜出。
 *
 * - 离线模式：不触网，对每个源尝试读缓存；缓存未命中即抛 REGISTRY_OFFLINE_UNAVAILABLE
 * - 在线模式：依次尝试，首个成功即返回；失败则记录原因并尝试下一个
 * - 全部失败时抛出聚合错误（最后一个源的 CliError 作为 cause）
 * - 源切换时输出 warn 日志，便于用户感知 fallback 发生
 */
export async function fetchWithSources<T>(
    sources: string[],
    fetcher: (source: string) => Promise<T>,
    options: { offline: boolean } = { offline: false },
): Promise<{ result: T; source: string }> {
    if (sources.length === 0) {
        throw new CliError('No registry source available.', { code: 'REGISTRY_FETCH_FAILED' });
    }

    if (options.offline) {
        // 离线模式：fetcher 实现必须先查缓存再触网，离线时不应触网。
        // 这里不直接拦截——而是把 offline 标志交给 fetcher，由它决定读缓存或抛错。
        // 但若 fetcher 抛 REGISTRY_OFFLINE_UNAVAILABLE，直接冒泡（无 fallback 意义）。
        const firstError: CliError | null = null;
        for (const source of sources) {
            try {
                const result = await fetcher(source);
                return { result, source };
            } catch (error) {
                if (error instanceof CliError && error.code === 'REGISTRY_OFFLINE_UNAVAILABLE') {
                    throw error;
                }
                // 其他错误在离线模式下视为该源不可用，尝试下一个
                logger.debug(`Offline source ${source} failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        throw new CliError(
            `All ${sources.length} registry source(s) unavailable in offline mode. ` +
            `Pre-cache components by running add/list --check-updates while online.`,
            { code: 'REGISTRY_OFFLINE_UNAVAILABLE', cause: firstError }
        );
    }

    let lastError: Error | null = null;
    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        try {
            const result = await fetcher(source);
            if (i > 0) {
                logger.warn(`Primary registry source failed, fell back to: ${source}`);
            }
            return { result, source };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (i < sources.length - 1) {
                logger.warn(`Registry source ${source} failed: ${lastError.message}. Trying next source...`);
            }
        }
    }

    throw new CliError(
        `All ${sources.length} registry source(s) failed. Last error: ${lastError?.message ?? 'Unknown error'}`,
        { code: 'REGISTRY_FETCH_FAILED', cause: lastError }
    );
}

/**
 * 临时设置 BRUTX_OFFLINE 环境变量（用于把 --offline 标志透传给底层 getItem 路径）。
 * 返回还原函数，调用方在 finally 中调用以恢复原值。
 *
 * 这是为了避免在所有调用链上新增 offline 参数（侵入性太大）。
 * 底层 cache.ts / registry.ts 通过 isOfflineMode() 读取该环境变量。
 */
export function withOfflineScope(offline: boolean): () => void {
    if (!offline) return () => {};
    const previous = process.env[OFFLINE_ENV];
    process.env[OFFLINE_ENV] = '1';
    return () => {
        if (previous === undefined) delete process.env[OFFLINE_ENV];
        else process.env[OFFLINE_ENV] = previous;
    };
}
