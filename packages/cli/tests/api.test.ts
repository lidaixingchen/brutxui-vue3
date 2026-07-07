import { describe, expect, it } from 'vitest';
import * as api from '../src/api.js';

describe('programmatic API entry point', () => {
    const expectedFunctions = [
        'ensureUtilsFile',
        'resolveComponents',
        'resolveComponentFilePath',
        'writeComponentFiles',
        'diffComponent',
        'diffComponents',
        'getInstalledComponents',
        'initializeProjectFiles',
        'injectNuxtConfig',
        'countComponentFiles',
        'prepareRemoveComponents',
        'removeComponents',
    ];

    it.each(expectedFunctions)('exports %s as a function', (name) => {
        const fn = (api as Record<string, unknown>)[name];
        expect(typeof fn).toBe('function');
    });

    it('resolveComponents resolves to empty result for empty input', async () => {
        const result = await api.resolveComponents([]);
        expect(result).toEqual({
            items: [],
            dependencies: [],
        });
    });

    it('exports type-only identifiers as undefined at runtime', () => {
        const typeOnly = [
            'ComponentFileWriteCallbacks',
            'ComponentFileWriteFailure',
            'ComponentFileWriteOptions',
            'ComponentFileWriteResult',
            'ComponentResolutionResult',
            'EnsureUtilsFileResult',
            'NuxtConfigResult',
            'NuxtConfigStatus',
            'ProjectInitializationCallbacks',
            'ProjectInitializationOptions',
            'ProjectInitializationResult',
            'ProjectInitializationSettings',
            'RemoveExecutionOptions',
            'RemoveExecutionResult',
            'RemovePreparation',
        ];

        for (const name of typeOnly) {
            expect((api as Record<string, unknown>)[name]).toBeUndefined();
        }
    });
});
