import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import {
    loadTrustedPublicKeys,
    verifyManifestSignature,
    generateEd25519KeyPair,
    signManifestIntegrity,
    type TrustedPublicKey,
} from '../src/lib/signature.js';
import {
    setRequireSignature,
    resetRequireSignature,
} from '../src/lib/signature-mode.js';
import { CliError } from '../src/lib/error.js';
import { logger } from '../src/lib/logger.js';

const PUBLIC_KEYS_ENV = 'BRUTX_REGISTRY_PUBLIC_KEYS';

describe('loadTrustedPublicKeys (P1-6)', () => {
    beforeEach(() => {
        delete process.env[PUBLIC_KEYS_ENV];
    });

    afterEach(() => {
        delete process.env[PUBLIC_KEYS_ENV];
    });

    it('returns empty array when env var is unset', () => {
        expect(loadTrustedPublicKeys()).toEqual([]);
    });

    it('returns parsed array when env var contains valid JSON', () => {
        const keys: TrustedPublicKey[] = [
            { keyId: 'v1', publicKey: 'a'.repeat(44) + '=' },
            { keyId: 'v2', publicKey: 'b'.repeat(44) + '=' },
        ];
        process.env[PUBLIC_KEYS_ENV] = JSON.stringify(keys);
        expect(loadTrustedPublicKeys()).toEqual(keys);
    });

    it('returns empty array when env var is not valid JSON', () => {
        process.env[PUBLIC_KEYS_ENV] = '{invalid json';
        expect(loadTrustedPublicKeys()).toEqual([]);
    });

    it('returns empty array when env var is valid JSON but not an array', () => {
        process.env[PUBLIC_KEYS_ENV] = JSON.stringify({ keyId: 'v1', publicKey: 'x' });
        expect(loadTrustedPublicKeys()).toEqual([]);
    });

    it('filters out entries with missing keyId or publicKey', () => {
        process.env[PUBLIC_KEYS_ENV] = JSON.stringify([
            { keyId: 'v1', publicKey: 'valid-key' },
            { keyId: '', publicKey: 'empty-keyId' },
            { keyId: 'v3', publicKey: '' },
            { keyId: 'v4' },
            { publicKey: 'no-keyId' },
            null,
            'not-an-object',
        ]);
        expect(loadTrustedPublicKeys()).toEqual([
            { keyId: 'v1', publicKey: 'valid-key' },
        ]);
    });
});

describe('verifyManifestSignature (P1-6)', () => {
    let keyPair: { keyId: string; publicKey: string; privateKey: string };
    let validSignature: string;
    const manifestIntegrity = 'a'.repeat(64);

    beforeEach(() => {
        delete process.env[PUBLIC_KEYS_ENV];
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        keyPair = generateEd25519KeyPair();
        validSignature = signManifestIntegrity(manifestIntegrity, keyPair.privateKey);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete process.env[PUBLIC_KEYS_ENV];
        resetRequireSignature();
    });

    it('returns false (skip) when manifest is unsigned (no signature/keyId)', () => {
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity },
            [keyPair],
        );
        expect(result).toBe(false);
    });

    it('returns false (skip) when manifest has signature but missing keyId', () => {
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature },
            [keyPair],
        );
        expect(result).toBe(false);
    });

    it('returns false (skip) when manifest has keyId but missing signature', () => {
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, keyId: keyPair.keyId },
            [keyPair],
        );
        expect(result).toBe(false);
    });

    it('returns false (skip) when manifest is signed but missing integrity field', () => {
        const result = verifyManifestSignature(
            { signature: validSignature, keyId: keyPair.keyId },
            [keyPair],
        );
        expect(result).toBe(false);
    });

    it('returns false (skip) when trustedKeys is empty (no public keys configured)', () => {
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: keyPair.keyId },
            [],
        );
        expect(result).toBe(false);
    });

    it('returns true when signature is valid and keyId matches', () => {
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: keyPair.keyId },
            [keyPair],
        );
        expect(result).toBe(true);
    });

    it('returns true when signature is valid using base64url-encoded public key', () => {
        // 转 base64url
        const base64UrlKey: TrustedPublicKey = {
            keyId: keyPair.keyId,
            publicKey: keyPair.publicKey.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
        };
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: keyPair.keyId },
            [base64UrlKey],
        );
        expect(result).toBe(true);
    });

    it('returns true when signature is valid using base64url-encoded signature', () => {
        const base64UrlSig = validSignature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: base64UrlSig, keyId: keyPair.keyId },
            [keyPair],
        );
        expect(result).toBe(true);
    });

    it('throws REGISTRY_SIGNATURE_INVALID when keyId does not match any trusted key (strict mode)', () => {
        setRequireSignature(true);
        expect(() => verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: 'unknown-key-id' },
            [keyPair],
        )).toThrowError(/unknown keyId/);
        try {
            verifyManifestSignature(
                { integrity: manifestIntegrity, signature: validSignature, keyId: 'unknown-key-id' },
                [keyPair],
            );
            throw new Error('should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(CliError);
            expect((error as CliError).code).toBe('REGISTRY_SIGNATURE_INVALID');
        }
    });

    it('warns and returns false when keyId does not match any trusted key (default mode)', () => {
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: 'unknown-key-id' },
            [keyPair],
        );
        expect(result).toBe(false);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain('unknown keyId');
        expect(warnSpy.mock.calls[0][0]).toContain('--require-signature');
    });

    it('throws REGISTRY_SIGNATURE_INVALID when signature is invalid (tampered) (strict mode)', () => {
        setRequireSignature(true);
        const tamperedSig = validSignature.slice(0, -2) + 'XX';
        expect(() => verifyManifestSignature(
            { integrity: manifestIntegrity, signature: tamperedSig, keyId: keyPair.keyId },
            [keyPair],
        )).toThrow();
        try {
            verifyManifestSignature(
                { integrity: manifestIntegrity, signature: tamperedSig, keyId: keyPair.keyId },
                [keyPair],
            );
            throw new Error('should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(CliError);
            expect((error as CliError).code).toBe('REGISTRY_SIGNATURE_INVALID');
        }
    });

    it('warns and returns false when signature is invalid (tampered) (default mode)', () => {
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const tamperedSig = validSignature.slice(0, -2) + 'XX';
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: tamperedSig, keyId: keyPair.keyId },
            [keyPair],
        );
        expect(result).toBe(false);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain('signature verification failed');
    });

    it('throws REGISTRY_SIGNATURE_INVALID when signature is for different content (strict mode)', () => {
        setRequireSignature(true);
        // 用同一个密钥对不同内容签名，再尝试验旧 manifest
        const otherSignature = signManifestIntegrity('different-integrity-value', keyPair.privateKey);
        expect(() => verifyManifestSignature(
            { integrity: manifestIntegrity, signature: otherSignature, keyId: keyPair.keyId },
            [keyPair],
        )).toThrow();
        try {
            verifyManifestSignature(
                { integrity: manifestIntegrity, signature: otherSignature, keyId: keyPair.keyId },
                [keyPair],
            );
            throw new Error('should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(CliError);
            expect((error as CliError).code).toBe('REGISTRY_SIGNATURE_INVALID');
        }
    });

    it('warns and returns false when signature is for different content (default mode)', () => {
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const otherSignature = signManifestIntegrity('different-integrity-value', keyPair.privateKey);
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: otherSignature, keyId: keyPair.keyId },
            [keyPair],
        );
        expect(result).toBe(false);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain('signature verification failed');
    });

    it('throws REGISTRY_SIGNATURE_INVALID when public key is malformed (strict mode)', () => {
        setRequireSignature(true);
        const malformedKey: TrustedPublicKey = {
            keyId: keyPair.keyId,
            publicKey: 'not-valid-base64-!!@#$',
        };
        expect(() => verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: keyPair.keyId },
            [malformedKey],
        )).toThrow();
        try {
            verifyManifestSignature(
                { integrity: manifestIntegrity, signature: validSignature, keyId: keyPair.keyId },
                [malformedKey],
            );
            throw new Error('should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(CliError);
            expect((error as CliError).code).toBe('REGISTRY_SIGNATURE_INVALID');
        }
    });

    it('warns and returns false when public key is malformed (default mode)', () => {
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const malformedKey: TrustedPublicKey = {
            keyId: keyPair.keyId,
            publicKey: 'not-valid-base64-!!@#$',
        };
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: keyPair.keyId },
            [malformedKey],
        );
        expect(result).toBe(false);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain('parse trusted public key');
    });

    it('throws REGISTRY_SIGNATURE_INVALID when signature is malformed (not valid base64) (strict mode)', () => {
        setRequireSignature(true);
        // base64 解码能成功但内容长度不对，verify 会失败
        const malformedSig = 'short';
        expect(() => verifyManifestSignature(
            { integrity: manifestIntegrity, signature: malformedSig, keyId: keyPair.keyId },
            [keyPair],
        )).toThrow();
    });

    it('warns and returns false when signature is malformed (default mode)', () => {
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const malformedSig = 'short';
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: malformedSig, keyId: keyPair.keyId },
            [keyPair],
        );
        expect(result).toBe(false);
        expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('supports multiple trusted keys with keyId-based selection', () => {
        const keyPair2 = generateEd25519KeyPair();
        const sig2 = signManifestIntegrity(manifestIntegrity, keyPair2.privateKey);

        // 两个公钥都在列表中，签名来自 key2
        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: sig2, keyId: keyPair2.keyId },
            [keyPair, keyPair2],
        );
        expect(result).toBe(true);

        // 切回 key1
        const result1 = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: keyPair.keyId },
            [keyPair, keyPair2],
        );
        expect(result1).toBe(true);
    });

    it('simulates key rotation: old key removed from list, new signature uses new keyId (strict mode)', () => {
        setRequireSignature(true);
        // 阶段 1: v1 密钥签发
        const v1Result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: keyPair.keyId },
            [keyPair],
        );
        expect(v1Result).toBe(true);

        // 阶段 2: 轮换到 v2 密钥，v1 从受信任列表移除
        const keyPair2 = generateEd25519KeyPair();
        const sig2 = signManifestIntegrity(manifestIntegrity, keyPair2.privateKey);

        // v2 签名验证通过
        expect(verifyManifestSignature(
            { integrity: manifestIntegrity, signature: sig2, keyId: keyPair2.keyId },
            [keyPair2],
        )).toBe(true);

        // v1 签名不再被受信任（keyId 不在列表中）→ 抛错
        expect(() => verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: keyPair.keyId },
            [keyPair2],
        )).toThrow(/unknown keyId/);
    });

    it('simulates key rotation: old signature warns when old key removed (default mode)', () => {
        // 阶段 1: v1 签名验证通过
        expect(verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: keyPair.keyId },
            [keyPair],
        )).toBe(true);

        // 阶段 2: 轮换到 v2，v1 不在受信任列表
        const keyPair2 = generateEd25519KeyPair();
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

        const result = verifyManifestSignature(
            { integrity: manifestIntegrity, signature: validSignature, keyId: keyPair.keyId },
            [keyPair2],
        );
        expect(result).toBe(false);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain('unknown keyId');
    });
});

describe('generateEd25519KeyPair + signManifestIntegrity (P1-6)', () => {
    it('generates a valid Ed25519 keypair with base64 SPKI public key', () => {
        const pair = generateEd25519KeyPair();
        expect(pair.keyId).toMatch(/^key-[0-9a-f]+$/);
        expect(pair.publicKey).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
        expect(pair.privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/);

        // 公钥应能加载为 KeyObject
        const publicKeyObject = crypto.createPublicKey({
            key: Buffer.from(pair.publicKey, 'base64'),
            format: 'der',
            type: 'spki',
        });
        expect(publicKeyObject.asymmetricKeyType).toBe('ed25519');
    });

    it('signs integrity and produces base64 signature verifiable by corresponding public key', () => {
        const pair = generateEd25519KeyPair();
        const integrity = 'deadbeef'.repeat(8);
        const signature = signManifestIntegrity(integrity, pair.privateKey);

        expect(typeof signature).toBe('string');
        expect(signature.length).toBeGreaterThan(0);

        // 直接用 crypto 验签
        const publicKeyObject = crypto.createPublicKey({
            key: Buffer.from(pair.publicKey, 'base64'),
            format: 'der',
            type: 'spki',
        });
        const valid = crypto.verify(
            null,
            Buffer.from(integrity, 'utf-8'),
            publicKeyObject,
            Buffer.from(signature, 'base64'),
        );
        expect(valid).toBe(true);
    });

    it('produces different signatures for different content', () => {
        const pair = generateEd25519KeyPair();
        const sig1 = signManifestIntegrity('content-a', pair.privateKey);
        const sig2 = signManifestIntegrity('content-b', pair.privateKey);
        expect(sig1).not.toBe(sig2);
    });

    it('produces different signatures for different keys on same content', () => {
        const pair1 = generateEd25519KeyPair();
        const pair2 = generateEd25519KeyPair();
        const sig1 = signManifestIntegrity('same-content', pair1.privateKey);
        const sig2 = signManifestIntegrity('same-content', pair2.privateKey);
        expect(sig1).not.toBe(sig2);
    });

    it('generates unique keyIds', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 20; i++) {
            ids.add(generateEd25519KeyPair().keyId);
        }
        expect(ids.size).toBe(20);
    });
});
