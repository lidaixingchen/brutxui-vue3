import crypto from 'crypto';
import { computeRegistryManifestIntegrity } from 'brutx-shared-vue';
import { CliError } from './error.js';
import { logger } from './logger.js';
import { isRequireSignature } from './signature-mode.js';
import { OFFICIAL_PUBLIC_KEYS } from './constants.js';
import type { TrustedPublicKey } from './types.js';

export type { TrustedPublicKey } from './types.js';

/**
 * 供应链安全：manifest 签名与验签（P1-6）
 *
 * 信任模型：
 *   - integrity 字段保证 manifest 内容自洽（防篡改可见内容）
 *   - signature 字段保证 manifest 确由受信任维护者签发（防伪造整个 manifest）
 *   - 两者职责不同：integrity 防"内容被改但 manifest 自洽"，signature 防"连 manifest 带 integrity 一起换"
 *
 * 签名范围：对 manifest 的 `integrity` 字段值（hex 字符串）做 Ed25519 签名。
 *   - integrity 已对 manifest 的 name/schemaVersion/registryVersion/items 做规范化 sha256
 *     （算法单一来源：brutx-shared-vue 的 computeRegistryManifestIntegrity）
 *   - 验签侧（verifyManifestIntegrityAndSignature）会先复算 integrity 并与 manifest.integrity 比对，
 *     再验签名——确保签名不仅绑定 integrity 字符串，也真正绑定 manifest 内容（防"改内容但保留原签名"）。
 *
 * 公钥分发：
 *   - 通过 BRUTX_REGISTRY_PUBLIC_KEYS 环境变量注入（JSON 数组 [{keyId, publicKey}]）
 *   - publicKey 格式为 base64 编码的 SPKI DER（单行，便于嵌入 JSON）
 *   - 未设置环境变量时验签降级为跳过（向后兼容，不强制启用）
 *
 * 密钥轮换：
 *   - 公钥列表按 keyId 索引，manifest.keyId 指定所用密钥
 *   - 旧 key 签发的 manifest 在过渡期（旧 key 仍在列表中）仍可信
 *   - 撤销旧 key 时从环境变量中移除即可
 *
 * 严格模式（P1-6 v2.2 修正）：
 *   - 默认行为：签名无效时 `warn`（不阻塞发布，避免迁移期卡死）
 *   - 严格模式：`--require-signature` flag 或 `BRUTX_REQUIRE_SIGNATURE=1` 激活，
 *     签名无效时升级为抛 REGISTRY_SIGNATURE_INVALID
 *   - 详见 AUXILIARY_PACKAGES_IMPROVEMENT_PLAN_V2.md 风险与取舍
 */

const PUBLIC_KEYS_ENV = 'BRUTX_REGISTRY_PUBLIC_KEYS';

/** 项目级受信任公钥 override（由命令入口从 components.json 的 trustedPublicKeys 设置）。 */
let trustedPublicKeysOverride: TrustedPublicKey[] | undefined;

/**
 * 设置项目级受信任公钥 override（基础设施闭环 P1）。
 * 传入空数组/null/undefined 时清空 override，回退到 env 与官方内置公钥。
 */
export function setTrustedPublicKeys(keys: TrustedPublicKey[] | null | undefined): void {
    trustedPublicKeysOverride = keys === null || keys === undefined || keys.length === 0
        ? undefined
        : [...keys];
}

/** 重置项目级受信任公钥 override（供测试隔离使用）。 */
export function resetTrustedPublicKeys(): void {
    trustedPublicKeysOverride = undefined;
}

/** 从 BRUTX_REGISTRY_PUBLIC_KEYS 环境变量解析受信任公钥（原有逻辑）。 */
function parseEnvTrustedPublicKeys(): TrustedPublicKey[] {
    const env = process.env[PUBLIC_KEYS_ENV];
    if (!env) return [];
    try {
        const parsed: unknown = JSON.parse(env);
        if (!Array.isArray(parsed)) {
            const message = `${PUBLIC_KEYS_ENV} is not a JSON array, signature verification disabled.`;
            if (isRequireSignature()) {
                throw new CliError(message, { code: 'REGISTRY_SIGNATURE_INVALID' });
            }
            logger.warn(message);
            return [];
        }
        const filtered = parsed.filter((k): k is TrustedPublicKey =>
            typeof k === 'object' && k !== null &&
            typeof (k as { keyId?: unknown }).keyId === 'string' && (k as { keyId: string }).keyId.length > 0 &&
            typeof (k as { publicKey?: unknown }).publicKey === 'string' && (k as { publicKey: string }).publicKey.length > 0
        );
        if (filtered.length < parsed.length) {
            const invalidCount = parsed.length - filtered.length;
            const base = `${PUBLIC_KEYS_ENV} contains ${invalidCount} invalid entr${invalidCount !== 1 ? 'ies' : 'y'} (missing keyId/publicKey)`;
            if (isRequireSignature()) {
                // 严格模式：不得静默降级跳过，直接拒绝继续（文案不使用"被忽略"以免与实际行为矛盾）
                throw new CliError(`${base}.`, { code: 'REGISTRY_SIGNATURE_INVALID' });
            }
            logger.warn(`${base}; they were ignored.`);
        }
        return filtered;
    } catch (error) {
        // 解析失败：严格模式下拒绝继续（避免验签被静默降级跳过），否则 warn 提示配置错误
        if (error instanceof CliError) throw error;
        const message = `${PUBLIC_KEYS_ENV} is not valid JSON, signature verification disabled.`;
        if (isRequireSignature()) {
            throw new CliError(message, { code: 'REGISTRY_SIGNATURE_INVALID' });
        }
        logger.warn(message);
        return [];
    }
}

/**
 * 合并受信任公钥：配置源（override 或 env）优先，官方 Root 公钥作为信任锚兜底。
 * 按 keyId 去重，配置在前（同名 keyId 时配置覆盖官方）。
 */
function mergeTrustedKeys(configured: TrustedPublicKey[]): TrustedPublicKey[] {
    if (configured.length === 0) {
        return [...OFFICIAL_PUBLIC_KEYS];
    }
    const byKeyId = new Map<string, TrustedPublicKey>();
    for (const key of [...configured, ...OFFICIAL_PUBLIC_KEYS]) {
        byKeyId.set(key.keyId, key);
    }
    return Array.from(byKeyId.values());
}

/**
 * 加载受信任公钥列表（基础设施闭环 P1）。
 * 优先级：项目级 setTrustedPublicKeys → BRUTX_REGISTRY_PUBLIC_KEYS 环境变量 → OFFICIAL_PUBLIC_KEYS。
 * 官方 Root 公钥始终作为信任锚并入结果（配置同名 keyId 时以配置为准）。
 * 零配置时返回 OFFICIAL_PUBLIC_KEYS，实现官方 Registry 签名开箱即验。
 */
export function loadTrustedPublicKeys(): TrustedPublicKey[] {
    const configured = trustedPublicKeysOverride ?? parseEnvTrustedPublicKeys();
    return mergeTrustedKeys(configured);
}

/**
 * 验证 manifest 签名。
 *
 * 规则（按顺序短路）：
 *   1. manifest.signature 或 manifest.keyId 缺失 → 跳过验签（debug 日志），返回 false
 *   2. manifest.integrity 缺失 → 无法验签（warn 降级，见 #109：integrity 为必填契约，
 *      解析层已保证拉取路径不会产出缺 integrity 的 manifest），返回 false
 *   3. trustedKeys 为空 → 跳过验签（debug 日志），返回 false
 *   4. keyId 匹配的公钥不存在 → handleSignatureFailure()
 *   5. 公钥格式错误 → handleSignatureFailure()
 *   6. 签名验证失败 → handleSignatureFailure()
 *   7. 验证通过 → 返回 true
 *
 * 严格模式（--require-signature 或 BRUTX_REQUIRE_SIGNATURE=1）：
 *   签名失败时抛 REGISTRY_SIGNATURE_INVALID。
 * 默认模式（迁移期推荐）：
 *   签名失败时 warn 日志并返回 false，不阻塞 getItem 流程（integrity 仍兜底防篡改）。
 *
 * @returns true 表示签名通过验证；false 表示跳过验签或签名失败已降级为 warn
 * @throws CliError code=REGISTRY_SIGNATURE_INVALID 严格模式下签名无效
 */
export function verifyManifestSignature(
    manifest: { integrity?: string; signature?: string; keyId?: string },
    trustedKeys: TrustedPublicKey[] = loadTrustedPublicKeys(),
): boolean {
    // 缺失签名/信任公钥：严格模式下不得静默放行（否则删除 signature/keyId 即可绕过强制验签），
    // 默认模式保持原有的跳过（debug 日志）语义。
    if (!manifest.signature || !manifest.keyId) {
        return handleSignatureFailure('Manifest is unsigned (signature/keyId missing). Strict signature mode requires a signed manifest.', 'debug');
    }

    // #109：integrity 为必填契约，缺 integrity 无法验签不再是预期内的跳过（debug），
    // 而是需要用户知晓的降级（默认 warn；严格模式抛 REGISTRY_SIGNATURE_INVALID）。
    if (!manifest.integrity) {
        return handleSignatureFailure('Manifest has signature but no integrity field, cannot verify.');
    }

    if (trustedKeys.length === 0) {
        return handleSignatureFailure(`No trusted public keys configured (set ${PUBLIC_KEYS_ENV} env var). Strict signature mode requires a trusted key.`, 'debug');
    }

    const key = trustedKeys.find(k => k.keyId === manifest.keyId);
    if (!key) {
        return handleSignatureFailure(
            `Manifest signed with unknown keyId "${manifest.keyId}". No matching trusted public key found.`,
        );
    }

    let publicKeyObject: crypto.KeyObject;
    try {
        publicKeyObject = parsePublicKey(key.publicKey);
    } catch (error) {
        // parsePublicKey 抛通用 Error——统一走降级路径（warn / 严格模式抛 REGISTRY_SIGNATURE_INVALID）
        return handleSignatureFailure(
            `Failed to parse trusted public key: ${error instanceof Error ? error.message : String(error)}`,
        );
    }

    const signatureBuffer = decodeBase64(manifest.signature);
    const messageBuffer = Buffer.from(manifest.integrity, 'utf-8');

    try {
        const valid = crypto.verify(
            null,
            messageBuffer,
            publicKeyObject,
            signatureBuffer,
        );
        if (!valid) {
            return handleSignatureFailure(
                'Manifest signature verification failed. The manifest may have been tampered with.',
            );
        }
        return true;
    } catch (error) {
        // try 内 if (!valid) 分支在严格模式会抛 CliError(REGISTRY_SIGNATURE_INVALID)，
        // 此处透传避免被再次包装成双层消息；crypto.verify 自身的通用异常走统一降级路径
        if (error instanceof CliError) throw error;
        return handleSignatureFailure(
            `Manifest signature verification failed: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * 已签名 manifest 的字段子集（供 integrity 复算 + 验签）。
 * name/schemaVersion/registryVersion/items 由 build 侧写入，用于复算 integrity。
 * integrity 保持可选：输入是运行时 JSON 解析值（未定型时是诚实的），
 * 解析层（registry.ts fetchRegistryManifestSummary）已保证拉取路径的 integrity 必填契约。
 */
export interface SignedManifestVerifyInput {
    name?: unknown;
    schemaVersion?: unknown;
    registryVersion?: unknown;
    items?: unknown;
    integrity?: string;
    signature?: string;
    keyId?: string;
}

/**
 * 复算 manifest 自身 integrity 并与字段声明值比对。
 * - 仅当 name/schemaVersion/registryVersion/items 字段齐全且 items 为对象时才复算，
 *   否则返回 null（无法复算，调用方应跳过该项校验，避免误伤旧版/非标准 manifest）。
 * @returns 复算得到的 sha256 hex；字段不齐或无法复算时返回 null
 */
function recomputeManifestIntegrity(manifest: SignedManifestVerifyInput): string | null {
    const items = manifest.items;
    if (
        typeof manifest.name !== 'string' ||
        typeof manifest.schemaVersion !== 'number' ||
        typeof manifest.registryVersion !== 'string' ||
        typeof items !== 'object' || items === null || Array.isArray(items)
    ) {
        return null;
    }
    try {
        return computeRegistryManifestIntegrity({
            name: manifest.name,
            schemaVersion: manifest.schemaVersion,
            registryVersion: manifest.registryVersion,
            items: items as Record<string, unknown>,
        });
    } catch {
        return null;
    }
}

/**
 * 完整校验已签名 manifest（基础设施闭环 P0 安全契约）：integrity 自洽 + 签名真实性。
 *
 * 在 verifyManifestSignature（仅对 integrity 字符串验签）之上，先复算 integrity 并比对
 * manifest.integrity，封堵"攻击者改写 registryVersion/items 等内容字段、保留原 integrity+签名"
 * 的空子——签名不再只是"绑定一个字符串"，而是真正绑定 manifest 内容。
 *
 * 规则（短路顺序）：
 *   1. 未签名（缺 signature/keyId）→ 交给 verifyManifestSignature 跳过（向后兼容旧 registry）
 *   2. 缺 integrity → 交给 verifyManifestSignature，由 handleSignatureFailure 处理
 *      （#109：integrity 为必填契约，缺 integrity 无法验签走 warn 降级，不再 debug 跳过）
 *   3. trustedKeys 为空 → 跳过（用户未配置任何信任公钥，不强制校验）
 *   4. 复算 integrity 与 manifest.integrity 不一致 → handleSignatureFailure()
 *   5. 剩余校验（keyId 匹配、公钥解析、签名验证）→ 交给 verifyManifestSignature
 *
 * @throws CliError code=REGISTRY_SIGNATURE_INVALID 严格模式下 integrity 复算不一致或签名无效
 */
export function verifyManifestIntegrityAndSignature(
    manifest: SignedManifestVerifyInput,
    trustedKeys: TrustedPublicKey[] = loadTrustedPublicKeys(),
): boolean {
    // 未签名 / 缺 integrity / 无信任公钥 → 交给 verifyManifestSignature 处理
    // （缺 integrity 由 handleSignatureFailure 走 warn 降级，见 #109）
    if (!manifest.signature || !manifest.keyId || !manifest.integrity) {
        return verifyManifestSignature(manifest, trustedKeys);
    }
    if (trustedKeys.length === 0) {
        return verifyManifestSignature(manifest, trustedKeys);
    }

    // 内容 ↔ integrity 自洽：复算并比对（与 build 侧共用 computeRegistryManifestIntegrity）
    const recomputed = recomputeManifestIntegrity(manifest);
    if (recomputed !== null && recomputed !== manifest.integrity) {
        return handleSignatureFailure(
            'Manifest integrity mismatch: manifest content does not match its integrity field. ' +
            'The manifest may have been tampered with.',
        );
    }

    return verifyManifestSignature(manifest, trustedKeys);
}

/**
 * 处理签名失败：默认模式 warn（或 debug），严格模式抛错。
 * 返回 false 表示已降级为 warn/debug，调用方应继续流程（integrity 会兜底校验）。
 * @param logLevel 默认模式下记录日志的级别；'debug' 用于"未签名/无法校验"这类预期内的跳过场景。
 */
function handleSignatureFailure(message: string, logLevel: 'debug' | 'warn' = 'warn'): false {
    if (isRequireSignature()) {
        throw new CliError(message, { code: 'REGISTRY_SIGNATURE_INVALID' });
    }
    if (logLevel === 'debug') {
        logger.debug(message);
    } else {
        logger.warn(`[Signature] ${message} (use --require-signature to enforce)`);
    }
    return false;
}

function parsePublicKey(publicKeyBase64: string): crypto.KeyObject {
    const derBuffer = decodeBase64(publicKeyBase64);
    return crypto.createPublicKey({
        key: derBuffer,
        format: 'der',
        type: 'spki',
    });
}

function decodeBase64(value: string): Buffer {
    // 兼容 base64 与 base64url
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(normalized, 'base64');
}

/**
 * 生成 Ed25519 密钥对（用于测试与签名工具）。
 * 返回的 publicKey 为 base64 编码的 SPKI DER，可直接配置到 BRUTX_REGISTRY_PUBLIC_KEYS。
 */
export function generateEd25519KeyPair(): {
    keyId: string;
    publicKey: string;
    privateKey: string;
} {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const publicDer = publicKey.export({ type: 'spki', format: 'der' });
    return {
        keyId: 'key-' + crypto.randomBytes(4).toString('hex'),
        publicKey: publicDer.toString('base64'),
        privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    };
}

/**
 * 用私钥对 manifest 的 integrity 字段签名（用于测试与签名工具）。
 * 返回 base64 编码的签名，可直接注入 manifest.signature 字段。
 */
export function signManifestIntegrity(
    integrity: string,
    privateKeyPem: string,
): string {
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    const signature = crypto.sign(null, Buffer.from(integrity, 'utf-8'), privateKey);
    return signature.toString('base64');
}
