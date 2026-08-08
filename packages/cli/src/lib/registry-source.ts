import { DEFAULT_REGISTRY_SOURCES } from './constants.js';
import { isOfflineMode } from './cache.js';
import { CliError } from './error.js';
import { logger } from './logger.js';
import type { BrutalistConfig } from './types.js';

/**
 * 多 registry 源与离线韧性（P1-5 / 基础设施闭环 P0）
 *
 * 解析优先级（高 → 低）：
 *   1. 命令行 --registry（覆盖整个源列表）
 *   2. components.json 的 registries 数组（主源 + 镜像）
 *   3. DEFAULT_REGISTRY_SOURCES（GitHub Raw 主源 + jsDelivr CDN 镜像）
 *
 * 离线模式（BRUTX_OFFLINE=1 或 --offline）：
 *   - 不发网络请求，只读缓存
 *   - TTL 过期也复用（但调用方必须通过 integrity 校验）
 *   - 默认多源下依次尝试各源缓存，全部未命中才抛 REGISTRY_OFFLINE_UNAVAILABLE
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
 * - 都没有时返回 DEFAULT_REGISTRY_SOURCES 副本（GitHub Raw + jsDelivr CDN）
 */
export function resolveRegistrySources(
    config: BrutalistConfig | null,
    override?: string,
): string[] {
    if (override !== undefined) {
        const trimmed = override.trim();
        if (trimmed.length === 0) {
            // 显式传空串（如 --registry ''）是参数错误，静默回退默认源会掩盖问题
            throw new CliError('Registry override cannot be empty.', { code: 'INVALID_REGISTRY' });
        }
        return [trimmed];
    }
    const fromConfig = config?.registries?.filter(url => typeof url === 'string' && url.length > 0);
    if (fromConfig && fromConfig.length > 0) {
        return fromConfig;
    }
    return [...DEFAULT_REGISTRY_SOURCES];
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
                // 显式校验值类型：数字/布尔/嵌套对象会被 Headers 隐式 stringify 成
                // "3"/"[object Object]"，产生非预期 header，故过滤并告警
                const headers: Record<string, string> = {};
                for (const [key, value] of Object.entries(parsed)) {
                    if (typeof value === 'string') {
                        headers[key] = value;
                    } else {
                        logger.warn(`Header "${key}" ignored: value must be a string.`);
                    }
                }
                return headers;
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
        // 默认多源下，组件可能缓存在任一源（如 CDN 镜像），故 REGISTRY_OFFLINE_UNAVAILABLE
        // 不立即冒泡——依次尝试各源缓存，全部未命中才抛 REGISTRY_OFFLINE_UNAVAILABLE。
        let firstError: CliError | null = null;
        for (const source of sources) {
            try {
                const result = await fetcher(source);
                return { result, source };
            } catch (error) {
                // 其他错误在离线模式下同样视为该源不可用，尝试下一个
                if (firstError === null && error instanceof CliError) {
                    firstError = error;
                }
                logger.debug(`Offline source ${source} failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        throw new CliError(
            `All ${sources.length} registry source(s) unavailable in offline mode. ` +
            `Pre-cache components by running list --check-updates while online.`,
            { code: 'REGISTRY_OFFLINE_UNAVAILABLE', cause: firstError }
        );
    }

    const sourceErrors: CliError[] = [];
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
            const err = error instanceof Error ? error : new Error(String(error));
            if (err instanceof CliError) sourceErrors.push(err);
            lastError = err;
            if (i < sources.length - 1) {
                logger.warn(`Registry source ${source} failed: ${err.message}. Trying next source...`);
            }
        }
    }

    // 信任链/完整性失败不折叠成泛化 REGISTRY_FETCH_FAILED——透出原始错误码与信息，
    // 避免把"签名被篡改/内容被篡改"误判为普通网络故障。
    // REGISTRY_SIGNATURE_INVALID 优先（信任链断裂最严重），其次 REGISTRY_INTEGRITY_FAILED（内容被篡改）。
    const signatureError = sourceErrors.find(e => e.code === 'REGISTRY_SIGNATURE_INVALID');
    if (signatureError) {
        throw signatureError;
    }
    const integrityError = sourceErrors.find(e => e.code === 'REGISTRY_INTEGRITY_FAILED');
    if (integrityError) {
        // 多源下 integrity 失败也可能是源间内容滞后（如 CDN 缓存延迟），附提示但保留原错误码
        throw new CliError(
            `${integrityError.message} This may indicate a consistency delay between registry sources ` +
            `(e.g. CDN cache lag). Retry later, or force the primary source with --registry.`,
            { code: 'REGISTRY_INTEGRITY_FAILED', cause: integrityError }
        );
    }

    // "组件不存在"（404/本地缺失）是确定性信号：全部源均报 not-found 时透出 COMPONENT_NOT_FOUND，
    // 供调用方区分 not-found 与 registry-unreachable；若任一源是网络/其他错误（或含非 CliError），
    // 仍聚合为 REGISTRY_FETCH_FAILED，避免把临时网络故障误判为组件不存在
    if (sourceErrors.length === sources.length
        && sourceErrors.every(e => e.code === 'COMPONENT_NOT_FOUND')) {
        throw new CliError(
            `Component not found in any of the ${sources.length} registry source(s).`,
            { code: 'COMPONENT_NOT_FOUND', cause: sourceErrors[0] }
        );
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
// 嵌套离线作用域的引用计数：多个 withOfflineScope(true) 并发/嵌套时，
// 只有最外层还原才恢复原环境变量，避免"写-删-写"互相覆盖导致状态残留
let offlineScopeCount = 0;

export function withOfflineScope(offline: boolean): () => void {
    if (!offline) return () => {};
    const previous = offlineScopeCount === 0 ? process.env[OFFLINE_ENV] : undefined;
    offlineScopeCount++;
    process.env[OFFLINE_ENV] = '1';
    return () => {
        offlineScopeCount--;
        if (offlineScopeCount === 0) {
            if (previous === undefined) delete process.env[OFFLINE_ENV];
            else process.env[OFFLINE_ENV] = previous;
        }
    };
}
