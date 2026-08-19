import { describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import type { RegistryBuildManifest } from '../../src/compiler/types.js';
import {
    signManifest,
    signManifestFromEnv,
    verifyManifestSignature,
} from '../../src/emitters/manifest-signer.js';

describe('ManifestSigner', () => {
    const mockManifest: RegistryBuildManifest = {
        $schema: 'https://lidaixingchen.github.io/brutxui-vue3/registry-manifest.schema.json',
        name: 'brutx-ui-vue',
        schemaVersion: 1,
        registryVersion: '0.1.0',
        buildTimestamp: null,
        gitCommit: null,
        integrity: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        itemCount: 1,
        items: {},
    };

    it('signs manifest and verifies signature with Ed25519 keypair', () => {
        const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
        const privPem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
        const pubPem = publicKey.export({ format: 'pem', type: 'spki' }).toString();

        const signed = signManifest(mockManifest, privPem, 'key-2026');
        expect(signed.keyId).toBe('key-2026');
        expect(signed.signature).toBeDefined();

        const isValid = verifyManifestSignature(signed, pubPem);
        expect(isValid).toBe(true);
    });

    it('leaves manifest unsigned when environment variables are unset', () => {
        delete process.env.BRUTX_REGISTRY_PRIVATE_KEY;
        delete process.env.BRUTX_REGISTRY_KEY_ID;

        const result = signManifestFromEnv(mockManifest);
        expect(result.signature).toBeUndefined();
        expect(result.keyId).toBeUndefined();
    });
});
