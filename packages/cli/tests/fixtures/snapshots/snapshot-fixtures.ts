import crypto from 'node:crypto';
import {
    computeRegistryIntegrity,
    computeRegistryManifestIntegrity,
    type RegistryFile,
    type RegistryItem,
} from 'brutx-shared-vue';
import { signManifestIntegrity, generateEd25519KeyPair } from '../../../src/lib/signature.js';
import type { RegistryBuildManifest } from '../../../../registry/src/compiler/types.js';

export interface TestSnapshotBundle {
    version: string;
    tag: string;
    gitCommit: string;
    manifest: RegistryBuildManifest;
    items: Record<string, RegistryItem>;
}

export const TEST_KEYPAIR = generateEd25519KeyPair();

function createTestComponent(
    name: string,
    files: Array<{ path: string; content: string; type?: RegistryFile['type'] }>,
    dependencies: string[] = [],
    registryDependencies: string[] = []
): RegistryItem {
    const formattedFiles: RegistryFile[] = files.map(f => ({
        path: f.path,
        content: f.content,
        type: f.type ?? 'registry:ui',
    }));
    const integrity = computeRegistryIntegrity(formattedFiles);

    return {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name,
        type: 'registry:ui',
        title: name.toUpperCase(),
        description: `Test component ${name}`,
        category: 'action',
        status: 'stable',
        dependencies,
        registryDependencies,
        files: formattedFiles,
        tailwind: {},
        cssVars: {},
        integrity,
    };
}

export function buildSnapshotA(): TestSnapshotBundle {
    const version = '1.0.0';
    const tag = `v${version}`;
    const gitCommit = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    const button = createTestComponent('button', [
        { path: 'Button.vue', content: '<template><button class="btn-a"><slot /></button></template>' },
    ]);

    const dataTable = createTestComponent(
        'data-table',
        [{ path: 'DataTable.vue', content: '<template><div class="dt-a"><Button>A</Button></div></template>' }],
        ['reka-ui'],
        ['button']
    );

    const items: Record<string, RegistryItem> = {
        button,
        'data-table': dataTable,
    };

    const manifestItems: RegistryBuildManifest['items'] = {
        button: {
            integrity: button.integrity,
            fileCount: button.files.length,
            dependencies: button.dependencies,
            registryDependencies: button.registryDependencies,
            category: button.category,
            examples: [],
            status: button.status,
        },
        'data-table': {
            integrity: dataTable.integrity,
            fileCount: dataTable.files.length,
            dependencies: dataTable.dependencies,
            registryDependencies: dataTable.registryDependencies,
            category: dataTable.category,
            examples: [],
            status: dataTable.status,
        },
    };

    const baseManifest = {
        $schema: 'https://lidaixingchen.github.io/brutxui-vue3/registry-manifest.schema.json',
        name: 'brutx-ui-vue',
        schemaVersion: 1,
        registryVersion: version,
        buildTimestamp: '2026-09-12T00:00:00.000Z',
        gitCommit,
        itemCount: 2,
        items: manifestItems,
    };

    const integrity = computeRegistryManifestIntegrity(baseManifest);
    const signature = signManifestIntegrity(integrity, TEST_KEYPAIR.privateKey);

    const manifest: RegistryBuildManifest = {
        ...baseManifest,
        integrity,
        signature,
        keyId: TEST_KEYPAIR.keyId,
    };

    return {
        version,
        tag,
        gitCommit,
        manifest,
        items,
    };
}

export function buildSnapshotB(): TestSnapshotBundle {
    const version = '1.1.0';
    const tag = `v${version}`;
    const gitCommit = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    // Button 在快照 B 中做了升级（class 改为 btn-b，新增属性等）
    const button = createTestComponent('button', [
        { path: 'Button.vue', content: '<template><button class="btn-b" data-v="b"><slot /></button></template>' },
    ]);

    const dataTable = createTestComponent(
        'data-table',
        [{ path: 'DataTable.vue', content: '<template><div class="dt-b"><Button>B</Button></div></template>' }],
        ['reka-ui'],
        ['button']
    );

    const items: Record<string, RegistryItem> = {
        button,
        'data-table': dataTable,
    };

    const manifestItems: RegistryBuildManifest['items'] = {
        button: {
            integrity: button.integrity,
            fileCount: button.files.length,
            dependencies: button.dependencies,
            registryDependencies: button.registryDependencies,
            category: button.category,
            examples: [],
            status: button.status,
        },
        'data-table': {
            integrity: dataTable.integrity,
            fileCount: dataTable.files.length,
            dependencies: dataTable.dependencies,
            registryDependencies: dataTable.registryDependencies,
            category: dataTable.category,
            examples: [],
            status: dataTable.status,
        },
    };

    const baseManifest = {
        $schema: 'https://lidaixingchen.github.io/brutxui-vue3/registry-manifest.schema.json',
        name: 'brutx-ui-vue',
        schemaVersion: 1,
        registryVersion: version,
        buildTimestamp: '2026-09-12T12:00:00.000Z',
        gitCommit,
        itemCount: 2,
        items: manifestItems,
    };

    const integrity = computeRegistryManifestIntegrity(baseManifest);
    const signature = signManifestIntegrity(integrity, TEST_KEYPAIR.privateKey);

    const manifest: RegistryBuildManifest = {
        ...baseManifest,
        integrity,
        signature,
        keyId: TEST_KEYPAIR.keyId,
    };

    return {
        version,
        tag,
        gitCommit,
        manifest,
        items,
    };
}
