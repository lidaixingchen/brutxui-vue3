import fs from 'fs-extra';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
    createTestProject,
    localRegistry,
    runCli,
    shouldKeepTestProject,
} from './helpers.js';

describe('Monorepo E2E Integration Suite', () => {
    it('installs component into shared-ui package with --filter option in a pnpm monorepo', async () => {
        const project = await createTestProject({ template: 'monorepo-subpackage' });

        try {
            // 构建 Monorepo: packages/ui (shared-ui) + apps/web (app)
            const uiPkgDir = path.join(project.workspaceRoot, 'packages', 'ui');
            await fs.ensureDir(path.join(uiPkgDir, 'src'));
            await fs.writeJson(path.join(uiPkgDir, 'package.json'), {
                name: '@myrepo/ui',
                type: 'module',
                dependencies: { vue: '^3.5.0' },
            });
            await fs.writeFile(path.join(uiPkgDir, 'src', 'index.css'), '@import "tailwindcss";\n');

            // 根目录 pnpm-workspace.yaml 包含 packages/* 和 apps/*
            await fs.writeFile(
                path.join(project.workspaceRoot, 'pnpm-workspace.yaml'),
                'packages:\n  - "packages/*"\n  - "apps/*"\n'
            );

            // 在根目录执行 init
            const initResult = await runCli(
                project,
                ['init', '--yes', '--defaults', '--force'],
                { cwd: project.workspaceRoot }
            );
            expect(initResult.code).toBe(0);

            // 在根目录执行 add button --filter packages/ui
            const addResult = await runCli(
                project,
                ['add', 'button', '--filter', 'packages/ui', '--registry', localRegistry, '--yes'],
                { cwd: project.workspaceRoot }
            );
            expect(addResult.code, addResult.stderr || addResult.stdout).toBe(0);

            // 验证组件落入 packages/ui/src/components/ui/button/
            const buttonVuePath = path.join(uiPkgDir, 'src', 'components', 'ui', 'button', 'Button.vue');
            const buttonExists = await fs.pathExists(buttonVuePath);
            expect(buttonExists).toBe(true);

            // 验证 AST 别名与保真转换
            const buttonContent = await fs.readFile(buttonVuePath, 'utf-8');
            expect(buttonContent).toContain('<template>');
            expect(buttonContent).toContain('buttonVariants');
        } finally {
            if (!shouldKeepTestProject()) {
                await fs.remove(project.cleanupRoot);
            }
        }
    }, 30000);
});
