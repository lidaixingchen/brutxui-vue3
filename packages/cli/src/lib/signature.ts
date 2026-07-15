import crypto from 'crypto';
import { CliError } from './error.js';
import { logger } from './logger.js';

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
 *   - 签名 integrity 即绑定整个 manifest 内容，避免 CLI 侧重复规范化逻辑
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
 */

const PUBLIC_KEYS_ENV = 'BRUTX_REGISTRY_PUBLIC_KEYS';

export interface TrustedPublicKey {
    keyId: string;
    /** base64 编码的 SPKI DER 格式公钥 */
    publicKey: string;
}

/**
 * 从 BRUTX_REGISTRY_PUBLIC_KEYS 环境变量加载受信任公钥列表。
 * 格式：JSON 数组 [{keyId: "v1", publicKey: "base64..."}]
 * 未设置或解析失败时返回空数组（验签降级为跳过）。
 */
export function loadTrustedPublicKeys(): TrustedPublicKey[] {
    const env = process.env[PUBLIC_KEYS_ENV];
    if (!env) return [];
    try {
        const parsed: unknown = JSON.parse(env);
        if (!Array.isArray(parsed)) {
            logger.debug(`${PUBLIC_KEYS_ENV} is not a JSON array, signature verification disabled.`);
            return [];
        }
        return parsed.filter((k): k is TrustedPublicKey =>
            typeof k === 'object' && k !== null &&
            typeof (k as { keyId?: unknown }).keyId === 'string' && (k as { keyId: string }).keyId.length > 0 &&
            typeof (k as { publicKey?: unknown }).publicKey === 'string' && (k as { publicKey: string }).publicKey.length > 0
        );
    } catch {
        logger.debug(`${PUBLIC_KEYS_ENV} is not valid JSON, signature verification disabled.`);
        return [];
    }
}

/**
 * 验证 manifest 签名。
 *
 * 规则（按顺序短路）：
 *   1. manifest.signature 或 manifest.keyId 缺失 → 跳过验签（debug 日志），返回 false
 *   2. manifest.integrity 缺失 → 跳过验签（debug 日志），返回 false
 *   3. trustedKeys 为空 → 跳过验签（debug 日志），返回 false
 *   4. keyId 匹配的公钥不存在 → 抛 REGISTRY_SIGNATURE_INVALID
 *   5. 公钥格式错误 → 抛 REGISTRY_SIGNATURE_INVALID
 *   6. 签名验证失败 → 抛 REGISTRY_SIGNATURE_INVALID
 *   7. 验证通过 → 返回 true
 *
 * @returns true 表示签名通过验证；false 表示跳过验签（不抛错）
 * @throws CliError code=REGISTRY_SIGNATURE_INVALID 签名无效或 keyId 未匹配
 */
export function verifyManifestSignature(
    manifest: { integrity?: string; signature?: string; keyId?: string },
    trustedKeys: TrustedPublicKey[] = loadTrustedPublicKeys(),
): boolean {
    if (!manifest.signature || !manifest.keyId) {
        logger.debug('Manifest is unsigned (signature/keyId missing), skipping signature verification.');
        return false;
    }

    if (!manifest.integrity) {
        logger.debug('Manifest has signature but no integrity field, cannot verify.');
        return false;
    }

    if (trustedKeys.length === 0) {
        logger.debug(`No trusted public keys configured (set ${PUBLIC_KEYS_ENV} env var), skipping signature verification.`);
        return false;
    }

    const key = trustedKeys.find(k => k.keyId === manifest.keyId);
    if (!key) {
        throw new CliError(
            `Manifest signed with unknown keyId "${manifest.keyId}". No matching trusted public key found.`,
            { code: 'REGISTRY_SIGNATURE_INVALID' },
        );
    }

    const publicKeyObject = parsePublicKey(key.publicKey);
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
            throw new CliError(
                `Manifest signature verification failed. The manifest may have been tampered with.`,
                { code: 'REGISTRY_SIGNATURE_INVALID' },
            );
        }
        return true;
    } catch (error) {
        if (error instanceof CliError) throw error;
        throw new CliError(
            `Manifest signature verification failed: ${error instanceof Error ? error.message : String(error)}`,
            { code: 'REGISTRY_SIGNATURE_INVALID' },
        );
    }
}

function parsePublicKey(publicKeyBase64: string): crypto.KeyObject {
    try {
        const derBuffer = decodeBase64(publicKeyBase64);
        return crypto.createPublicKey({
            key: derBuffer,
            format: 'der',
            type: 'spki',
        });
    } catch (error) {
        throw new CliError(
            `Failed to parse trusted public key (invalid base64 SPKI): ${error instanceof Error ? error.message : String(error)}`,
            { code: 'REGISTRY_SIGNATURE_INVALID' },
        );
    }
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
