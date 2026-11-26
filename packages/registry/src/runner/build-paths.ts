import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CompilerPaths } from '../compiler/types.js';

const packagesDir = fileURLToPath(new URL('../../../', import.meta.url));

export function getDefaultPaths(): CompilerPaths {
    return {
        componentsDir: path.resolve(packagesDir, 'ui/src/components'),
        composablesDir: path.resolve(packagesDir, 'ui/src/composables'),
        localesDir: path.resolve(packagesDir, 'ui/src/locales'),
        libDir: path.resolve(packagesDir, 'ui/src/lib'),
        directivesDir: path.resolve(packagesDir, 'ui/src/directives'),
        typesDir: path.resolve(packagesDir, 'ui/src/types'),
        manifestPath: path.resolve(packagesDir, 'ui/registry-manifest.json'),
        outputDir: path.resolve(packagesDir, 'registry/registry'),
        apiContractPath: path.resolve(packagesDir, 'ui/api-contract.ts'),
    };
}
