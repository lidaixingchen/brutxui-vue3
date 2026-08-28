import { describe, expect, it } from 'vitest';
import { PackageManagerAdapter } from './package-manager-adapter.js';

describe('PackageManagerAdapter', () => {
    const deps = ['reka-ui', 'clsx'];

    describe('Standalone projects', () => {
        it('builds pnpm add command', () => {
            const cmd = PackageManagerAdapter.getManualInstallCommand('pnpm', deps);
            expect(cmd).toBe('pnpm add reka-ui clsx');
        });

        it('builds yarn add command', () => {
            const cmd = PackageManagerAdapter.getManualInstallCommand('yarn', deps);
            expect(cmd).toBe('yarn add reka-ui clsx');
        });

        it('builds bun add command', () => {
            const cmd = PackageManagerAdapter.getManualInstallCommand('bun', deps);
            expect(cmd).toBe('bun add reka-ui clsx');
        });

        it('builds npm install command', () => {
            const cmd = PackageManagerAdapter.getManualInstallCommand('npm', deps);
            expect(cmd).toBe('npm install reka-ui clsx');
        });
    });

    describe('Monorepo cross-package routing', () => {
        const targetPackage = '@myrepo/ui';

        it('builds pnpm filtered add command', () => {
            const cmd = PackageManagerAdapter.getManualInstallCommand('pnpm', deps, targetPackage, true);
            expect(cmd).toBe('pnpm --filter @myrepo/ui add reka-ui clsx');
        });

        it('builds yarn workspace add command', () => {
            const cmd = PackageManagerAdapter.getManualInstallCommand('yarn', deps, targetPackage, true);
            expect(cmd).toBe('yarn workspace @myrepo/ui add reka-ui clsx');
        });

        it('builds bun filter add command', () => {
            const cmd = PackageManagerAdapter.getManualInstallCommand('bun', deps, targetPackage, true);
            expect(cmd).toBe('bun --filter @myrepo/ui add reka-ui clsx');
        });

        it('builds npm workspace install command', () => {
            const cmd = PackageManagerAdapter.getManualInstallCommand('npm', deps, targetPackage, true);
            expect(cmd).toBe('npm --workspace @myrepo/ui install reka-ui clsx');
        });
    });
});
