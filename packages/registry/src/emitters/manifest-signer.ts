import crypto from 'node:crypto';
import type { RegistryBuildManifest } from '../compiler/types.js';

export const PRIVATE_KEY_ENV = 'BRUTX_REGISTRY_PRIVATE_KEY';
export const KEY_ID_ENV = 'BRUTX_REGISTRY_KEY_ID';

export function createPrivateKeyFromInput(raw: string): crypto.KeyObject {
    if (raw.includes('-----BEGIN')) {
        return crypto.createPrivateKey(raw);
    }
    return crypto.createPrivateKey({
        key: Buffer.from(raw, 'base64'),
        format: 'der',
        type: 'pkcs8',
    });
}

export function createPublicKeyFromInput(raw: string): crypto.KeyObject {
    if (raw.includes('-----BEGIN')) {
        return crypto.createPublicKey(raw);
    }
    return crypto.createPublicKey({
        key: Buffer.from(raw, 'base64'),
        format: 'der',
        type: 'spki',
    });
}

export function signManifest(
    manifest: RegistryBuildManifest,
    privateKeyRaw: string,
    keyId: string
): RegistryBuildManifest {
    const privateKey = createPrivateKeyFromInput(privateKeyRaw);
    const signature = crypto.sign(null, Buffer.from(manifest.integrity, 'utf-8'), privateKey).toString('base64');
    return { ...manifest, signature, keyId };
}

export function signManifestFromEnv(
    manifest: RegistryBuildManifest,
    options: { strict?: boolean; verbose?: boolean } = {}
): RegistryBuildManifest {
    const privateKeyRaw = process.env[PRIVATE_KEY_ENV];
    const keyId = process.env[KEY_ID_ENV];

    if (!privateKeyRaw || !keyId) {
        if (options.strict) {
            throw new Error(
                `Strict signing enabled but signing credentials missing (${PRIVATE_KEY_ENV} or ${KEY_ID_ENV} not set).`
            );
        }
        if (options.verbose) {
            console.log('ℹ Registry manifest left unsigned (BRUTX_REGISTRY_PRIVATE_KEY / BRUTX_REGISTRY_KEY_ID not set).');
        }
        return manifest;
    }

    try {
        return signManifest(manifest, privateKeyRaw, keyId);
    } catch (error) {
        const cause = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to sign registry manifest with keyId "${keyId}": ${cause}`, { cause: error });
    }
}

export function verifyManifestSignature(
    manifest: RegistryBuildManifest,
    publicKeyRaw: string
): boolean {
    if (!manifest.signature) return false;
    const publicKey = createPublicKeyFromInput(publicKeyRaw);

    return crypto.verify(
        null,
        Buffer.from(manifest.integrity, 'utf-8'),
        publicKey,
        Buffer.from(manifest.signature, 'base64')
    );
}
