import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import {
    createTestProject,
    localRegistry,
    readInstallLog,
    removeTestProject,
    resetInstallLog,
    runCli,
    type TestProject,
} from './helpers.js';

describe('brutx-vue CLI integration', () => {
    let project: TestProject | undefined;

    afterEach(async () => {
        if (project) {
            await removeTestProject(project);
            project = undefined;
        }
    });

    async function setupInitializedProject(): Promise<TestProject> {
        project = await createTestProject();
        const result = await runCli(project, ['init', '--yes', '--force', '--cwd', project.root]);

        expect(result.code, result.stderr || result.stdout).toBe(0);
        return project;
    }

    it('initializes a Vue project without duplicating Brutx styles', async () => {
        project = await createTestProject();

        const firstRun = await runCli(project, ['init', '--yes', '--force', '--cwd', project.root]);
        expect(firstRun.code, firstRun.stderr || firstRun.stdout).toBe(0);

        const config = await fs.readJson(path.join(project.root, 'components.json'));
        expect(config.tailwind.css).toBe('src/index.css');
        expect(config.aliases).toEqual({
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables',
        });
        expect(await fs.pathExists(path.join(project.root, 'src', 'lib', 'utils.ts'))).toBe(true);
        expect(await fs.pathExists(path.join(project.root, 'src', 'components', 'ui'))).toBe(true);

        const cssPath = path.join(project.root, 'src', 'index.css');
        const firstCss = await fs.readFile(cssPath, 'utf-8');
        expect(firstCss).toContain('--color-brutal-bg');
        expect(firstCss).toContain('.bg-brutal-primary');
        expect(firstCss).toContain('.animate-in');

        const secondRun = await runCli(project, ['init', '--yes', '--force', '--cwd', project.root]);
        expect(secondRun.code, secondRun.stderr || secondRun.stdout).toBe(0);

        const secondCss = await fs.readFile(cssPath, 'utf-8');
        expect(secondCss.match(/--color-brutal-bg/g)).toHaveLength(1);

        const installLog = await readInstallLog(project);
        if (installLog.length > 0) {
            expect(installLog).toHaveLength(2);
            expect(installLog.every((entry) => entry.cwd === project?.root)).toBe(true);
        } else {
            expect(`${firstRun.stdout}\n${secondRun.stdout}`).toContain('Run manually: npm install');
        }
    });

    it('adds registry components, rewrites imports, and records dependency installation', async () => {
        project = await setupInitializedProject();
        await resetInstallLog(project);

        const result = await runCli(project, [
            'add',
            'button',
            'card',
            '--cwd',
            project.root,
            '--registry',
            localRegistry,
            '--overwrite',
        ]);

        expect(result.code, result.stderr || result.stdout).toBe(0);

        const buttonPath = path.join(project.root, 'src', 'components', 'ui', 'button', 'Button.vue');
        const cardPath = path.join(project.root, 'src', 'components', 'ui', 'card', 'Card.vue');
        expect(await fs.pathExists(buttonPath)).toBe(true);
        expect(await fs.pathExists(cardPath)).toBe(true);

        const buttonContent = await fs.readFile(buttonPath, 'utf-8');
        expect(buttonContent).toContain("from '@/lib/utils'");
        expect(buttonContent).toContain("from '@/components/ui/button/button-variants'");
        expect(buttonContent).not.toContain("from '@/components/button");

        const installLog = await readInstallLog(project);
        if (installLog.length > 0) {
            expect(installLog).toHaveLength(1);
            expect(installLog[0].args).toEqual(expect.arrayContaining(['reka-ui', '@lucide/vue']));
        } else {
            expect(result.stdout).toContain('Run manually: npm install');
            expect(result.stdout).toContain('reka-ui');
            expect(result.stdout).toContain('@lucide/vue');
        }
    });

    it('skips existing files unless overwrite is enabled', async () => {
        project = await setupInitializedProject();
        const buttonPath = path.join(project.root, 'src', 'components', 'ui', 'button', 'Button.vue');

        const firstAdd = await runCli(project, [
            'add',
            'button',
            '--cwd',
            project.root,
            '--registry',
            localRegistry,
            '--overwrite',
        ]);
        expect(firstAdd.code, firstAdd.stderr || firstAdd.stdout).toBe(0);

        await fs.writeFile(buttonPath, 'CUSTOM BUTTON');

        const skippedAdd = await runCli(project, [
            'add',
            'button',
            '--cwd',
            project.root,
            '--registry',
            localRegistry,
        ]);
        expect(skippedAdd.code, skippedAdd.stderr || skippedAdd.stdout).toBe(0);
        expect(await fs.readFile(buttonPath, 'utf-8')).toBe('CUSTOM BUTTON');

        const overwriteAdd = await runCli(project, [
            'add',
            'button',
            '--cwd',
            project.root,
            '--registry',
            localRegistry,
            '--overwrite',
        ]);
        expect(overwriteAdd.code, overwriteAdd.stderr || overwriteAdd.stdout).toBe(0);
        expect(await fs.readFile(buttonPath, 'utf-8')).toContain('<script setup lang="ts">');
    });

    it('dry-runs the full local registry without writing component files', async () => {
        project = await setupInitializedProject();
        await resetInstallLog(project);

        const result = await runCli(project, [
            'add',
            '--all',
            '--cwd',
            project.root,
            '--registry',
            localRegistry,
            '--dry-run',
        ]);

        expect(result.code, result.stderr || result.stdout).toBe(0);
        expect(result.stdout).toContain('[Dry Run]');
        expect(await fs.pathExists(path.join(project.root, 'src', 'components', 'ui', 'button'))).toBe(false);
        expect(await fs.pathExists(path.join(project.root, 'src', 'composables'))).toBe(false);
        expect(await readInstallLog(project)).toHaveLength(0);
    });

    it('rejects add paths that escape the target project', async () => {
        project = await setupInitializedProject();
        const outsideFile = path.join(path.dirname(project.root), 'outside-button.vue');
        await fs.remove(outsideFile);

        const result = await runCli(project, [
            'add',
            'button',
            '--cwd',
            project.root,
            '--registry',
            localRegistry,
            '--path',
            '..',
        ]);

        expect(result.code).not.toBe(0);
        expect(`${result.stdout}\n${result.stderr}`).toMatch(/Security Error|Path traversal/);
        expect(await fs.pathExists(outsideFile)).toBe(false);
    });

    it('rejects registry files whose paths escape the target project', async () => {
        project = await setupInitializedProject();
        const maliciousRegistry = path.join(project.root, 'malicious-registry');
        const outsideFile = path.join(path.dirname(project.root), 'escape.vue');

        await fs.ensureDir(maliciousRegistry);
        await fs.remove(outsideFile);
        await fs.writeJson(path.join(maliciousRegistry, 'button.json'), {
            name: 'button',
            type: 'registry:ui',
            dependencies: [],
            registryDependencies: [],
            files: [
                {
                    path: '../escape.vue',
                    content: 'malicious',
                },
            ],
        });

        const result = await runCli(project, [
            'add',
            'button',
            '--cwd',
            project.root,
            '--registry',
            maliciousRegistry,
        ]);

        expect(result.code).not.toBe(0);
        expect(`${result.stdout}\n${result.stderr}`).toMatch(/Security Error|Malicious component file path/);
        expect(await fs.pathExists(outsideFile)).toBe(false);
    });

    it('installs a large component with composables, locales, and transitive registry deps', async () => {
        project = await setupInitializedProject();
        await resetInstallLog(project);

        const result = await runCli(project, [
            'add',
            'color-picker',
            '--cwd',
            project.root,
            '--registry',
            localRegistry,
            '--overwrite',
        ]);

        expect(result.code, result.stderr || result.stdout).toBe(0);

        const colorPickerFile = path.join(
            project.root, 'src', 'components', 'ui', 'color-picker', 'ColorPicker.vue'
        );
        const variantsFile = path.join(
            project.root, 'src', 'components', 'ui', 'color-picker', 'color-picker-variants.ts'
        );
        const composableFile = path.join(project.root, 'src', 'composables', 'useColorPicker.ts');
        const localeFile = path.join(project.root, 'src', 'locales', 'zh-CN.ts');
        const libFile = path.join(project.root, 'src', 'lib', 'color.ts');

        expect(await fs.pathExists(colorPickerFile)).toBe(true);
        expect(await fs.pathExists(variantsFile)).toBe(true);
        expect(await fs.pathExists(composableFile)).toBe(true);
        expect(await fs.pathExists(localeFile)).toBe(true);
        expect(await fs.pathExists(libFile)).toBe(true);

        const colorPickerContent = await fs.readFile(colorPickerFile, 'utf-8');
        expect(colorPickerContent).toContain("from '@/lib/utils'");
        expect(colorPickerContent).toContain("from '@/composables/useLocale'");

        const popoverFile = path.join(
            project.root, 'src', 'components', 'ui', 'popover', 'PopoverContent.vue'
        );
        const buttonFile = path.join(
            project.root, 'src', 'components', 'ui', 'button', 'Button.vue'
        );
        expect(await fs.pathExists(popoverFile)).toBe(true);
        expect(await fs.pathExists(buttonFile)).toBe(true);

        const installLog = await readInstallLog(project);
        if (installLog.length > 0) {
            const allArgs = installLog.flatMap((entry) => entry.args);
            expect(allArgs).toEqual(expect.arrayContaining(['reka-ui', '@lucide/vue']));
        }
    });

    it('installs files to a custom --path subdirectory', async () => {
        project = await setupInitializedProject();

        const subDir = path.join(project.root, 'sub-app');
        await fs.ensureDir(subDir);
        await fs.writeJson(path.join(subDir, 'tsconfig.json'), {
            compilerOptions: {
                baseUrl: '.',
                paths: { '@/*': ['src/*'] },
            },
        }, { spaces: 2 });

        const result = await runCli(project, [
            'add',
            'badge',
            '--cwd',
            project.root,
            '--registry',
            localRegistry,
            '--path',
            'sub-app',
            '--overwrite',
        ]);

        expect(result.code, result.stderr || result.stdout).toBe(0);

        const badgeInSubDir = path.join(
            subDir, 'src', 'components', 'ui', 'badge', 'Badge.vue'
        );
        expect(await fs.pathExists(badgeInSubDir)).toBe(true);

        const badgeInRoot = path.join(
            project.root, 'src', 'components', 'ui', 'badge', 'Badge.vue'
        );
        expect(await fs.pathExists(badgeInRoot)).toBe(false);
    });

    it('automatically installs registryDependencies when adding a component', async () => {
        project = await setupInitializedProject();
        await resetInstallLog(project);

        const result = await runCli(project, [
            'add',
            'alert-dialog',
            '--cwd',
            project.root,
            '--registry',
            localRegistry,
            '--overwrite',
        ]);

        expect(result.code, result.stderr || result.stdout).toBe(0);

        const alertDialogFile = path.join(
            project.root, 'src', 'components', 'ui', 'alert-dialog', 'AlertDialogContent.vue'
        );
        expect(await fs.pathExists(alertDialogFile)).toBe(true);

        const buttonFile = path.join(
            project.root, 'src', 'components', 'ui', 'button', 'Button.vue'
        );
        const buttonVariantsFile = path.join(
            project.root, 'src', 'components', 'ui', 'button', 'button-variants.ts'
        );
        expect(await fs.pathExists(buttonFile)).toBe(true);
        expect(await fs.pathExists(buttonVariantsFile)).toBe(true);

        const actionContent = await fs.readFile(
            path.join(
                project.root, 'src', 'components', 'ui', 'alert-dialog', 'AlertDialogAction.vue'
            ),
            'utf-8'
        );
        expect(actionContent).toContain("from '@/components/ui/button/button-variants'");
    });

    it('rolls back newly written files when a subsequent write fails', async () => {
        project = await setupInitializedProject();

        const rollbackRegistry = path.join(project.root, 'rollback-registry');
        await fs.ensureDir(rollbackRegistry);
        await fs.writeJson(path.join(rollbackRegistry, 'kbd.json'), {
            name: 'kbd',
            type: 'registry:ui',
            dependencies: [],
            registryDependencies: [],
            files: [
                {
                    path: 'components/ui/kbd/Kbd.vue',
                    content: '<template><div>First</div></template>\n',
                },
                {
                    path: 'components/ui/kbd/blocked/Extra.vue',
                    content: '<template><div>Second</div></template>\n',
                },
            ],
        });

        const blockingFile = path.join(
            project.root, 'src', 'components', 'ui', 'kbd', 'blocked'
        );
        await fs.ensureDir(path.dirname(blockingFile));
        await fs.writeFile(blockingFile, 'this-is-a-file-not-a-directory');

        const firstVuePath = path.join(
            project.root, 'src', 'components', 'ui', 'kbd', 'Kbd.vue'
        );
        expect(await fs.pathExists(firstVuePath)).toBe(false);

        const result = await runCli(project, [
            'add',
            'kbd',
            '--cwd',
            project.root,
            '--registry',
            rollbackRegistry,
            '--overwrite',
        ]);

        expect(result.code).not.toBe(0);

        expect(await fs.pathExists(firstVuePath)).toBe(false);
    });

    it('accepts --no-cache and completes successfully with a local registry', async () => {
        project = await setupInitializedProject();

        const result = await runCli(project, [
            'add',
            'separator',
            '--cwd',
            project.root,
            '--registry',
            localRegistry,
            '--no-cache',
            '--overwrite',
        ]);

        expect(result.code, result.stderr || result.stdout).toBe(0);

        const separatorFile = path.join(
            project.root, 'src', 'components', 'ui', 'separator', 'Separator.vue'
        );
        expect(await fs.pathExists(separatorFile)).toBe(true);
    });
});
