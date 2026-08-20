import { describe, it, expect } from 'vitest';
import {
    validateRegistryIndex,
    validateRegistryItem,
    validateRegistryIntegrity,
    computeRegistryIntegrity,
    computeRegistryManifestIntegrity,
    RegistryIntegrityMismatchError,
    REGISTRY_ITEM_SCHEMA_URL,
    type RegistryIndex,
    type RegistryItem,
} from '../src/registry.js';

describe('registry schema and integrity validation', () => {
    const validFile = {
        path: 'components/ui/button.vue',
        content: '<template><button><slot /></button></template>',
        type: 'registry:ui' as const,
    };

    const validIntegrity = computeRegistryIntegrity([validFile]);

    const validItem: RegistryItem = {
        name: 'button',
        type: 'registry:ui',
        title: 'Button',
        description: 'A neo-brutalist button component.',
        category: 'action',
        status: 'stable',
        dependencies: [],
        registryDependencies: [],
        files: [validFile],
        tailwind: {},
        cssVars: {},
        integrity: validIntegrity,
    };

    const validIndex: RegistryIndex = {
        $schema: 'https://brutx.dev/schema/registry-index.json',
        name: 'brutx-ui',
        homepage: 'https://brutx.dev',
        schemaVersion: 1,
        registryVersion: '0.1.0',
        items: [
            {
                name: 'button',
                type: 'registry:ui',
                title: 'Button',
                description: 'A neo-brutalist button component.',
                category: 'action',
                status: 'stable',
                dependencies: [],
                registryDependencies: [],
                files: [
                    {
                        path: 'components/ui/button.vue',
                        type: 'registry:ui',
                    },
                ],
                tailwind: {},
                cssVars: {},
                integrity: validIntegrity,
            },
        ],
    };

    describe('validateRegistryIndex', () => {
        it('validates a correct registry index without throwing', () => {
            expect(() => validateRegistryIndex(validIndex)).not.toThrow();
        });

        it('throws for non-object data', () => {
            expect(() => validateRegistryIndex(null)).toThrow('expected an object');
            expect(() => validateRegistryIndex(undefined)).toThrow('expected an object');
            expect(() => validateRegistryIndex('string')).toThrow('expected an object');
            expect(() => validateRegistryIndex(123)).toThrow('expected an object');
        });

        it('throws for invalid $schema field', () => {
            expect(() => validateRegistryIndex({ ...validIndex, $schema: 123 })).toThrow('"$schema" must be a string');
        });

        it('throws for missing or empty required index fields', () => {
            expect(() => validateRegistryIndex({ ...validIndex, name: '' })).toThrow('"name" must be a non-empty string');
            expect(() => validateRegistryIndex({ ...validIndex, homepage: '' })).toThrow('"homepage" must be a non-empty string');
            expect(() => validateRegistryIndex({ ...validIndex, registryVersion: '' })).toThrow('"registryVersion" must be a non-empty string');
        });

        it('throws for invalid schemaVersion', () => {
            expect(() => validateRegistryIndex({ ...validIndex, schemaVersion: 0 })).toThrow('"schemaVersion" must be a positive integer');
            expect(() => validateRegistryIndex({ ...validIndex, schemaVersion: 1.5 })).toThrow('"schemaVersion" must be a positive integer');
            expect(() => validateRegistryIndex({ ...validIndex, schemaVersion: '1' })).toThrow('"schemaVersion" must be a positive integer');
        });

        it('throws for non-array items', () => {
            expect(() => validateRegistryIndex({ ...validIndex, items: null })).toThrow('"items" must be an array');
        });

        it('throws for duplicate item names in index', () => {
            const indexWithDuplicates: RegistryIndex = {
                ...validIndex,
                items: [validIndex.items[0], { ...validIndex.items[0] }],
            };
            expect(() => validateRegistryIndex(indexWithDuplicates)).toThrow('duplicate item name "button"');
        });

        it('throws for invalid items in index', () => {
            expect(() => validateRegistryIndex({
                ...validIndex,
                items: [{ ...validIndex.items[0], category: 'unknown-category' as any }],
            })).toThrow('"category" must be one of');

            expect(() => validateRegistryIndex({
                ...validIndex,
                items: [{ ...validIndex.items[0], status: 'invalid-status' as any }],
            })).toThrow('"status" must be one of');

            expect(() => validateRegistryIndex({
                ...validIndex,
                items: [{ ...validIndex.items[0], type: 'invalid:type' as any }],
            })).toThrow('"type" must be one of');
        });

        it('throws when legacy/deprecated item lacks replacement in index', () => {
            expect(() => validateRegistryIndex({
                ...validIndex,
                items: [{ ...validIndex.items[0], status: 'deprecated', replacement: undefined }],
            })).toThrow('"replacement" is required when "status" is deprecated');

            expect(() => validateRegistryIndex({
                ...validIndex,
                items: [{ ...validIndex.items[0], status: 'legacy', replacement: undefined }],
            })).toThrow('"replacement" is required when "status" is legacy');
        });
    });

    describe('validateRegistryItem', () => {
        it('validates a correct registry item without throwing', () => {
            expect(() => validateRegistryItem(validItem)).not.toThrow();
        });

        it('throws for non-object item', () => {
            expect(() => validateRegistryItem(null)).toThrow('expected an object');
        });

        it('enforces schema url when requireSchema is true', () => {
            expect(() => validateRegistryItem(validItem, { requireSchema: true })).toThrow('missing or invalid $schema');
            expect(() => validateRegistryItem({
                ...validItem,
                $schema: REGISTRY_ITEM_SCHEMA_URL,
            }, { requireSchema: true })).not.toThrow();
        });

        it('throws for empty files array', () => {
            expect(() => validateRegistryItem({ ...validItem, files: [] })).toThrow('"files" must not be empty');
        });

        it('throws for duplicate file paths in item', () => {
            expect(() => validateRegistryItem({
                ...validItem,
                files: [validFile, { ...validFile, content: 'other' }],
            })).toThrow('duplicate file path');
        });

        it('throws for unsafe file paths (traversal or absolute)', () => {
            expect(() => validateRegistryItem({
                ...validItem,
                files: [{ ...validFile, path: '../outside.ts' }],
            })).toThrow('must be a normalized relative path');

            expect(() => validateRegistryItem({
                ...validItem,
                files: [{ ...validFile, path: '/absolute.ts' }],
            })).toThrow('must be a normalized relative path');
        });

        it('throws RegistryIntegrityMismatchError when computed integrity differs from declared integrity', () => {
            expect(() => validateRegistryItem({
                ...validItem,
                integrity: 'sha256-0000000000000000000000000000000000000000000000000000000000000000',
            })).toThrow(RegistryIntegrityMismatchError);
        });
    });

    describe('computeRegistryIntegrity and validateRegistryIntegrity', () => {
        it('computes sha256 hash deterministically based on canonical path/content/type', () => {
            const hash1 = computeRegistryIntegrity([validFile]);
            const hash2 = computeRegistryIntegrity([{ ...validFile }]);
            expect(hash1).toBe(hash2);
            expect(hash1).toMatch(/^sha256-[a-f0-9]{64}$/);
        });

        it('validates integrity correctly', () => {
            expect(() => validateRegistryIntegrity(validItem)).not.toThrow();
            expect(() => validateRegistryIntegrity({
                ...validItem,
                integrity: 'sha256-wrong',
            })).toThrow('integrity mismatch');
        });

        it('computes manifest integrity deterministically', () => {
            const hash = computeRegistryManifestIntegrity({
                $schema: 'https://brutx.dev/schema/manifest.json',
                name: 'test',
                version: '1.0.0',
                homepage: 'https://brutx.dev',
                registryVersion: '1.0.0',
                items: [validItem],
            });
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64);
        });
    });
});
