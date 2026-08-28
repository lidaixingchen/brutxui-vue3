import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { WorkspaceTopology, BrutalistConfig } from '../types.js';
import { TargetResolver } from './target-resolver.js';

describe('TargetResolver', () => {
    const rootDir = '/repo';
    const mockTopology: WorkspaceTopology = {
        isMonorepo: true,
        workspaceRoot: path.resolve(rootDir),
        packageManager: 'pnpm',
        packages: new Map([
            ['@myrepo/ui', {
                name: '@myrepo/ui',
                rootDir: path.resolve('/repo/packages/ui'),
                relativeDir: 'packages/ui',
                isRoot: false,
                role: 'shared-ui',
                hasComponentsConfig: true,
                packageJson: { name: '@myrepo/ui' },
            }],
            ['packages/ui', {
                name: '@myrepo/ui',
                rootDir: path.resolve('/repo/packages/ui'),
                relativeDir: 'packages/ui',
                isRoot: false,
                role: 'shared-ui',
                hasComponentsConfig: true,
                packageJson: { name: '@myrepo/ui' },
            }],
            ['web-app', {
                name: 'web-app',
                rootDir: path.resolve('/repo/apps/web'),
                relativeDir: 'apps/web',
                isRoot: false,
                role: 'app',
                hasComponentsConfig: false,
                packageJson: { name: 'web-app' },
            }],
            ['apps/web', {
                name: 'web-app',
                rootDir: path.resolve('/repo/apps/web'),
                relativeDir: 'apps/web',
                isRoot: false,
                role: 'app',
                hasComponentsConfig: false,
                packageJson: { name: 'web-app' },
            }],
        ]),
        sharedUiPackage: {
            name: '@myrepo/ui',
            rootDir: path.resolve('/repo/packages/ui'),
            relativeDir: 'packages/ui',
            isRoot: false,
            role: 'shared-ui',
            hasComponentsConfig: true,
            packageJson: { name: '@myrepo/ui' },
        },
    };

    const rootConfig: BrutalistConfig = {
        style: 'default',
        tailwind: { config: 'tailwind.config.js', css: 'src/styles.css' },
        aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
        workspace: {
            mode: 'shared-package',
            targetPackage: '@myrepo/ui',
            installDependenciesTo: 'targetPackage',
        },
    };

    it('resolves to standalone directory in non-monorepo', () => {
        const standaloneTopology: WorkspaceTopology = {
            isMonorepo: false,
            workspaceRoot: path.resolve('/my-app'),
            packageManager: 'npm',
            packages: new Map(),
        };

        const plan = TargetResolver.resolvePlan('/my-app', undefined, standaloneTopology);
        expect(plan.targetPackageName).toBe('standalone');
        expect(plan.targetDir).toBe(path.join(path.resolve('/my-app'), 'src/components/ui'));
    });

    it('prioritizes P1 explicit --filter option over root config and topology', () => {
        const plan = TargetResolver.resolvePlan('/repo', 'apps/web', mockTopology, rootConfig);
        expect(plan.targetPackageName).toBe('web-app');
        expect(plan.targetPackageRoot).toBe(path.resolve('/repo/apps/web'));
        expect(plan.targetDir).toBe(path.join(path.resolve('/repo/apps/web'), 'src/components/ui'));
        expect(plan.depInstallTarget.packageName).toBe('web-app');
    });

    it('throws error when --filter package cannot be found', () => {
        expect(() => {
            TargetResolver.resolvePlan('/repo', 'non-existent-pkg', mockTopology, rootConfig);
        }).toThrow(/not found in monorepo/);
    });

    it('prioritizes P2 explicit workspace.targetPackage from root config', () => {
        const customConfig: BrutalistConfig = {
            ...rootConfig,
            workspace: { targetPackage: 'web-app' },
        };
        const plan = TargetResolver.resolvePlan('/repo', undefined, mockTopology, customConfig);
        expect(plan.targetPackageName).toBe('web-app');
    });

    it('falls back to P3 auto-inferred sharedUiPackage when no explicit filter/targetPackage', () => {
        const topologyWithoutTargetConfig: BrutalistConfig = {
            style: 'default',
            tailwind: { config: 'tailwind.config.js', css: 'src/styles.css' },
            aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
        };

        const plan = TargetResolver.resolvePlan('/repo', undefined, mockTopology, topologyWithoutTargetConfig);
        expect(plan.targetPackageName).toBe('@myrepo/ui');
        expect(plan.targetPackageRoot).toBe(path.resolve('/repo/packages/ui'));
    });

    it('falls back to caller cwd if running inside a specific workspace package', () => {
        const topologyNoSharedUi: WorkspaceTopology = {
            ...mockTopology,
            sharedUiPackage: undefined,
        };

        const plan = TargetResolver.resolvePlan(path.resolve('/repo/apps/web'), undefined, topologyNoSharedUi);
        expect(plan.targetPackageName).toBe('web-app');
        expect(plan.targetPackageRoot).toBe(path.resolve('/repo/apps/web'));
    });
});
