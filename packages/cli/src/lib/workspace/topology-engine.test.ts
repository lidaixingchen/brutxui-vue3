import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { WorkspaceTopologyEngine } from './topology-engine.js';

describe('WorkspaceTopologyEngine', () => {
    it('returns non-monorepo topology when no workspace root is detected', async () => {
        const fs = new MemoryFileSystemAdapter({
            '/my-app/package.json': JSON.stringify({ name: 'my-app', dependencies: { vue: '^3.5.0' } }),
            '/my-app/src/App.vue': '<template><div/></template>',
        });

        const topology = await WorkspaceTopologyEngine.resolveTopology('/my-app', fs);
        expect(topology.isMonorepo).toBe(false);
        expect(topology.workspaceRoot).toBe(path.resolve('/my-app'));
        expect(topology.packages.size).toBe(0);
        expect(topology.sharedUiPackage).toBeUndefined();
    });

    it('detects pnpm workspace and correctly identifies packages and roles', async () => {
        const root = '/repo';
        const fs = new MemoryFileSystemAdapter({
            '/repo/pnpm-workspace.yaml': 'packages:\n  - "packages/*"\n  - "apps/*"\n',
            '/repo/pnpm-lock.yaml': 'lockfileVersion: 9.0',
            '/repo/package.json': JSON.stringify({ name: 'my-repo', private: true }),
            '/repo/packages/ui/package.json': JSON.stringify({ name: '@myrepo/ui', version: '0.1.0' }),
            '/repo/packages/ui/components.json': JSON.stringify({ style: 'default', aliases: { components: '@/components', utils: '@/lib/utils' } }),
            '/repo/packages/utils/package.json': JSON.stringify({ name: '@myrepo/utils', version: '0.1.0' }),
            '/repo/apps/web/package.json': JSON.stringify({ name: 'web-app', dependencies: { vue: '^3.5.0' } }),
            '/repo/apps/docs/package.json': JSON.stringify({ name: 'docs-app' }),
        });

        const topology = await WorkspaceTopologyEngine.resolveTopology('/repo/apps/web', fs);
        expect(topology.isMonorepo).toBe(true);
        expect(topology.workspaceRoot).toBe(path.resolve(root));
        expect(topology.packageManager).toBe('pnpm');

        expect(topology.packages.has('@myrepo/ui')).toBe(true);
        expect(topology.packages.has('packages/ui')).toBe(true);
        expect(topology.packages.has('web-app')).toBe(true);

        const uiPkg = topology.sharedUiPackage;
        expect(uiPkg).toBeDefined();
        expect(uiPkg?.name).toBe('@myrepo/ui');
        expect(uiPkg?.role).toBe('shared-ui');
        expect(uiPkg?.hasComponentsConfig).toBe(true);

        const utilsPkg = topology.sharedUtilsPackage;
        expect(utilsPkg).toBeDefined();
        expect(utilsPkg?.name).toBe('@myrepo/utils');
        expect(utilsPkg?.role).toBe('shared-utils');

        const webPkg = topology.packages.get('web-app');
        expect(webPkg?.role).toBe('app');
    });

    it('detects npm/yarn package.json workspaces array', async () => {
        const root = '/yarn-repo';
        const fs = new MemoryFileSystemAdapter({
            '/yarn-repo/yarn.lock': '',
            '/yarn-repo/package.json': JSON.stringify({
                name: 'yarn-monorepo',
                private: true,
                workspaces: ['packages/*', 'apps/*'],
            }),
            '/yarn-repo/packages/design-system/package.json': JSON.stringify({ name: '@acme/ui' }),
            '/yarn-repo/apps/dashboard/package.json': JSON.stringify({ name: 'dashboard' }),
        });

        const topology = await WorkspaceTopologyEngine.resolveTopology(root, fs);
        expect(topology.isMonorepo).toBe(true);
        expect(topology.workspaceRoot).toBe(path.resolve(root));
        expect(topology.packageManager).toBe('yarn');
        expect(topology.packages.has('@acme/ui')).toBe(true);
        expect(topology.packages.get('@acme/ui')?.role).toBe('shared-ui');
    });

    it('reuses cached topology when workspace root mtime has not changed', async () => {
        const root = '/cache-repo';
        const fs = new MemoryFileSystemAdapter({
            '/cache-repo/pnpm-workspace.yaml': 'packages:\n  - "packages/*"\n',
            '/cache-repo/packages/ui/package.json': JSON.stringify({ name: '@cached/ui' }),
        });

        const top1 = await WorkspaceTopologyEngine.resolveTopology(root, fs);
        const top2 = await WorkspaceTopologyEngine.resolveTopology(root, fs);
        expect(top1).toBe(top2);
    });
});
