import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import {
    validateBrutalistConfig,
    migrateConfig,
    readConfig,
    readConfigSafe,
} from '../src/lib/config.js';
import { CURRENT_CONFIG_VERSION, SCHEMA_URL } from '../src/lib/constants.js';

describe('Config Domain Module', () => {
    let memoryFs: MemoryFileSystemAdapter;

    beforeEach(() => {
        memoryFs = new MemoryFileSystemAdapter();
    });

    afterEach(() => {
    });

    describe('migrateConfig', () => {
        it('should return config unchanged when version is current', async () => {
            const raw = { $version: CURRENT_CONFIG_VERSION, $schema: 'https://example.com', style: 'brutalism' };
            const result = await migrateConfig(raw);
            expect(result).toEqual(raw);
        });

        it('should migrate v0 config by adding $schema and $version', async () => {
            const raw = { style: 'brutalism', tailwind: { config: '', css: 'src/index.css' } };
            const result = await migrateConfig(raw);
            expect(result.$version).toBe(1);
            expect(result.$schema).toBe(SCHEMA_URL);
        });

        it('should not overwrite existing $schema during migration', async () => {
            const raw = { $version: 0, $schema: 'https://custom.schema', style: 'brutalism' };
            const result = await migrateConfig(raw);
            expect(result.$schema).toBe('https://custom.schema');
            expect(result.$version).toBe(1);
        });

        it('should handle missing $version as v0', async () => {
            const raw = { style: 'brutalism' };
            const result = await migrateConfig(raw);
            expect(result.$version).toBe(1);
        });
    });

    describe('validateBrutalistConfig', () => {
        it('throws when config is not an object or is null/array', () => {
            expect(() => validateBrutalistConfig(null)).toThrow('Invalid components.json: expected an object.');
            expect(() => validateBrutalistConfig([])).toThrow('Invalid components.json: expected an object.');
            expect(() => validateBrutalistConfig('string')).toThrow('Invalid components.json: expected an object.');
        });

        it('validates schema, style, tailwind and aliases fields', () => {
            expect(() => validateBrutalistConfig({ $schema: 123 })).toThrow('"$schema" must be a string');
            expect(() => validateBrutalistConfig({ style: 123 })).toThrow('"style" must be a string');
            expect(() => validateBrutalistConfig({ tailwind: 'not-obj' })).toThrow('"tailwind" must be an object');
            expect(() => validateBrutalistConfig({ aliases: 'not-obj' })).toThrow('"aliases" must be an object');
        });

        it('validates trustedPublicKeys array and elements', () => {
            expect(() => validateBrutalistConfig({ trustedPublicKeys: 'not-array' })).toThrow('"trustedPublicKeys" must be an array');
            expect(() => validateBrutalistConfig({ trustedPublicKeys: [{ keyId: '' }] })).toThrow('requires a non-empty "keyId"');
            expect(() => validateBrutalistConfig({ trustedPublicKeys: [{ keyId: 'k1', publicKey: '' }] })).toThrow('requires a non-empty "publicKey"');
        });
    });

    describe('readConfig and readConfigSafe (Side-effect free)', () => {
        it('throws when components.json is missing', async () => {
            await expect(readConfig('/workspace', memoryFs)).rejects.toThrow('components.json not found');
            expect(await readConfigSafe('/workspace', memoryFs)).toBeNull();
        });

        it('throws on malformed JSON', async () => {
            await memoryFs.writeFile('/workspace/components.json', '{ bad json');
            await expect(readConfig('/workspace', memoryFs)).rejects.toThrow('Failed to parse components.json: invalid JSON');
            expect(await readConfigSafe('/workspace', memoryFs)).toBeNull();
        });

        it('reads valid config and does NOT pollute global signature mode or public keys', async () => {
            const configJson = {
                $schema: SCHEMA_URL,
                $version: 1,
                style: 'brutalism',
                tailwind: { config: 'tailwind.config.js', css: 'src/app.css' },
                aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
                requireSignature: true,
                trustedPublicKeys: [
                    { keyId: 'official-1', publicKey: 'mock-pk-base64' },
                ],
            };

            await memoryFs.writeFile('/workspace/components.json', JSON.stringify(configJson, null, 2));

            const parsed = await readConfig('/workspace', memoryFs);
            expect(parsed.requireSignature).toBe(true);
            expect(parsed.trustedPublicKeys).toHaveLength(1);
            expect(parsed.trustedPublicKeys?.[0].keyId).toBe('official-1');

            // 核心断言：纯函数读取配置不会隐式改变全局状态或环境变量
            expect(process.env.BRUTX_REQUIRE_SIGNATURE).toBeUndefined();
        });
    });
});
