import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

export interface TestProject {
    root: string;
    fakeBin: string;
    installLog: string;
}

export interface CliResult {
    code: number | null;
    stdout: string;
    stderr: string;
}

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = path.resolve(cliRoot, '../..');

export const cliEntry = path.join(cliRoot, 'dist', 'index.js');
export const localRegistry = path.join(repoRoot, 'packages', 'registry', 'registry');

export async function createTestProject(): Promise<TestProject> {
    const tempDir = await fs.realpath(os.tmpdir());
    const root = await fs.mkdtemp(path.join(tempDir, 'brutx-cli-'));
    const fakeBin = path.join(root, '.fake-bin');
    const installLog = path.join(root, 'install-log.jsonl');

    await fs.ensureDir(path.join(root, 'src'));
    await fs.ensureDir(fakeBin);
    await fs.writeJson(path.join(root, 'package.json'), {
        type: 'module',
        dependencies: {
            '@vitejs/plugin-vue': '^6.0.0',
            tailwindcss: '^4.0.0',
            vite: '^8.0.0',
            vue: '^3.5.0',
        },
        devDependencies: {},
    }, { spaces: 2 });
    await fs.writeJson(path.join(root, 'tsconfig.json'), {
        compilerOptions: {
            baseUrl: '.',
            paths: {
                '@/*': ['src/*'],
            },
        },
    }, { spaces: 2 });
    await fs.writeFile(path.join(root, 'src', 'main.ts'), 'import { createApp } from "vue"\n');
    await fs.writeFile(path.join(root, 'src', 'index.css'), '@import "tailwindcss";\n');
    // Pin pnpm virtual-store-dir to an absolute realpath to prevent
    // ERR_PNPM_UNEXPECTED_VIRTUAL_STORE caused by Windows short/long path aliases
    // (e.g. LIDAIX~1 vs lidaixingchen) resolving differently across subprocess invocations.
    const virtualStoreDir = path.join(root, 'node_modules', '.pnpm').replace(/\\/g, '/');
    await fs.writeFile(path.join(root, '.npmrc'), `virtual-store-dir=${virtualStoreDir}\n`);
    await writeFakePackageManager(fakeBin);

    return { root, fakeBin, installLog };
}

export async function removeTestProject(project: TestProject): Promise<void> {
    await fs.remove(project.root);
}

export async function runCli(
    project: TestProject,
    args: string[],
    options: { cwd?: string } = {}
): Promise<CliResult> {
    if (!(await fs.pathExists(cliEntry))) {
        throw new Error(`CLI build output does not exist: ${cliEntry}. Run pnpm --filter brutx-vue build first.`);
    }

    const resolvedTemp = await fs.realpath(os.tmpdir());

    return new Promise((resolve) => {
        execFile(
            process.execPath,
            [cliEntry, ...args],
            {
                cwd: options.cwd ?? project.root,
                env: {
                    ...process.env,
                    TEMP: resolvedTemp,
                    TMP: resolvedTemp,
                    BRUTX_FAKE_PM_LOG: project.installLog,
                    CI: '1',
                    NO_COLOR: '1',
                    PATH: `${project.fakeBin}${path.delimiter}${process.env.PATH ?? ''}`,
                },
                windowsHide: true,
            },
            (error, stdout, stderr) => {
                const rawCode = (error as NodeJS.ErrnoException | null)?.code;
                const code = typeof rawCode === 'number' ? rawCode : (error ? 1 : 0);
                resolve({ code, stdout, stderr });
            }
        );
    });
}

export async function readInstallLog(project: TestProject): Promise<Array<{ command: string; args: string[]; cwd: string }>> {
    if (!(await fs.pathExists(project.installLog))) {
        return [];
    }

    const content = await fs.readFile(project.installLog, 'utf-8');
    return content
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line));
}

export async function resetInstallLog(project: TestProject): Promise<void> {
    await fs.remove(project.installLog);
}

async function writeFakePackageManager(fakeBin: string): Promise<void> {
    const scriptPath = path.join(fakeBin, 'fake-package-manager.cjs');
    const script = [
        'const fs = require("fs");',
        'const path = require("path");',
        'const logPath = process.env.BRUTX_FAKE_PM_LOG;',
        'if (logPath) {',
        '  fs.appendFileSync(logPath, JSON.stringify({',
        '    command: path.basename(process.argv[1]),',
        '    args: process.argv.slice(2),',
        '    cwd: process.cwd(),',
        '  }) + "\\n");',
        '}',
    ].join('\n');

    await fs.writeFile(scriptPath, script);

    // Create fake shims for all supported package managers so the CLI picks up
    // the fake instead of any real pm found later in PATH. Prevents real installs
    // (and Windows short/long path issues with pnpm) from affecting tests.
    for (const pm of ['npm', 'pnpm', 'yarn', 'bun']) {
        await fs.writeFile(path.join(fakeBin, pm), `#!/usr/bin/env node\nrequire(${JSON.stringify(scriptPath)});\n`);
        await fs.writeFile(path.join(fakeBin, `${pm}.cmd`), `@echo off\r\nnode "${scriptPath}" %*\r\n`);
        await fs.chmod(path.join(fakeBin, pm), 0o755);
    }
}
