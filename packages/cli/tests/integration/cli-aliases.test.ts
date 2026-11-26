import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import ts from 'typescript';
import { createTestProject, localRegistry, removeTestProject, runCli, type TestProject } from './helpers.js';

describe('CLI tsconfig aliases', { timeout: 20000 }, () => {
    let project: TestProject | undefined;

    afterEach(async () => {
        vi.unstubAllEnvs();
        if (project) await removeTestProject(project);
        project = undefined;
    });

    it('initializes and installs files that TypeScript resolves through #/', async () => {
        vi.stubEnv('BRUTX_OFFLINE', '1');
        project = await createTestProject();
        const { root } = project;
        const configPath = path.join(root, 'tsconfig.json');
        await fs.writeJson(configPath, {
            compilerOptions: { module: 'ESNext', moduleResolution: 'Bundler', paths: { '#/*': ['./src/*'] } },
        });

        const init = await runCli(project, ['init', '--yes']);
        expect(init.code, init.stderr || init.stdout).toBe(0);
        const config = await fs.readJson(path.join(root, 'components.json'));
        expect(config.aliases.components).toBe('#/components');
        const utilsPath = path.join(root, 'src/components/brutx/shared/utils.ts');
        expect(await fs.pathExists(utilsPath)).toBe(true);
        expect(await fs.pathExists(path.join(root, '#'))).toBe(false);

        for (const rule of ['structure.aliases', 'structure.utils-file']) {
            const doctor = await runCli(project, ['doctor', '--rule', rule, '--offline', '--fail-on', 'warn']);
            expect(doctor.code, doctor.stderr || doctor.stdout).toBe(0);
        }

        const add = await runCli(project, ['add', 'button', '--registry', localRegistry, '--overwrite']);
        expect(add.code, add.stderr || add.stdout).toBe(0);
        const buttonPath = path.join(root, 'src/components/ui/button/Button.vue');
        const source = await fs.readFile(buttonPath, 'utf8');
        const utilsSpecifier = '#/components/brutx/shared/utils';
        expect(source).toContain(`from '${utilsSpecifier}'`);

        const tsConfig = ts.readConfigFile(configPath, ts.sys.readFile);
        expect(tsConfig.error).toBeUndefined();
        const parsed = ts.parseJsonConfigFileContent(tsConfig.config, ts.sys, root);
        const resolved = ts.resolveModuleName(utilsSpecifier, buttonPath, parsed.options, ts.sys);
        expect(path.normalize(resolved.resolvedModule?.resolvedFileName ?? '')).toBe(utilsPath);

        const diff = await runCli(project, ['diff', 'button', '--registry', localRegistry]);
        expect(diff.code, diff.stderr || diff.stdout).toBe(0);
        expect(diff.stdout).toContain('1 up-to-date');

        const hooksDir = path.join(root, 'src/components/brutx/shared/hooks');
        const usedHook = 'useGlitchEffect';
        await fs.writeFile(path.join(root, 'src/main.ts'), `import '#/components/brutx/shared/hooks/${usedHook}';\n`);
        const removal = await runCli(project, ['remove', 'button', '--yes']);
        expect(removal.code, removal.stderr || removal.stdout).toBe(0);
        expect(await fs.pathExists(path.join(hooksDir, `${usedHook}.ts`))).toBe(true);
        expect(await fs.pathExists(path.join(hooksDir, 'useReducedMotion.ts'))).toBe(true);
        expect(await fs.pathExists(path.join(hooksDir, 'useLocale.ts'))).toBe(false);
        expect(await fs.pathExists(buttonPath)).toBe(false);
    });

    it('preserves shared files reached by bare imports through baseUrl in remove preview and execution', async () => {
        vi.stubEnv('BRUTX_OFFLINE', '1');
        project = await createTestProject();
        const { root } = project;
        const configPath = path.join(root, 'tsconfig.json');
        await fs.writeJson(configPath, {
            compilerOptions: {
                module: 'ESNext', moduleResolution: 'Bundler', baseUrl: './src', paths: { '@/*': ['./*'] },
            },
        });
        const init = await runCli(project, ['init', '--yes']);
        expect(init.code, init.stderr || init.stdout).toBe(0);
        const add = await runCli(project, ['add', 'button', '--registry', localRegistry, '--overwrite']);
        expect(add.code, add.stderr || add.stdout).toBe(0);

        const importer = path.join(root, 'src/main.ts');
        const specifier = 'components/brutx/shared/hooks/useGlitchEffect';
        const shared = path.join(root, 'src', `${specifier}.ts`);
        const unused = path.join(path.dirname(shared), 'useLocale.ts');
        await fs.writeFile(importer, `import '${specifier}';\n`);
        const config = ts.readConfigFile(configPath, ts.sys.readFile);
        const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
        const resolved = ts.resolveModuleName(specifier, importer, parsed.options, ts.sys).resolvedModule;
        expect(path.normalize(resolved?.resolvedFileName ?? '')).toBe(shared);

        const preview = await runCli(project, ['remove', 'button', '--dry-run']);
        expect(preview.code, preview.stderr || preview.stdout).toBe(0);
        expect(preview.stdout).toContain(path.basename(unused));
        expect(preview.stdout).not.toContain(path.basename(shared));
        const removal = await runCli(project, ['remove', 'button', '--yes']);
        expect(removal.code, removal.stderr || removal.stdout).toBe(0);
        expect(await fs.pathExists(shared)).toBe(true);
        expect(await fs.pathExists(unused)).toBe(false);
    });
});
