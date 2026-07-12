import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { IntegrationTemplate } from './matrix.js';

export interface TestProject {
    root: string;
    workspaceRoot: string;
    cleanupRoot: string;
    fakeBin: string;
    installLog: string;
    template: IntegrationTemplate;
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

export interface CreateTestProjectOptions {
    template?: IntegrationTemplate;
}

export function shouldKeepTestProject(): boolean {
    return process.env.BRUTX_KEEP_INTEGRATION_TMP === '1';
}

export async function createTestProject(options: CreateTestProjectOptions = {}): Promise<TestProject> {
    const template = options.template ?? 'vite-vue';
    const tempDir = path.join(os.homedir(), '.brutx-integration-tmp');
    await fs.ensureDir(tempDir);
    const workspaceRoot = await fs.mkdtemp(path.join(tempDir, 'brutx-cli-'));
    const root = template === 'monorepo-subpackage'
        ? path.join(workspaceRoot, 'apps', 'web')
        : workspaceRoot;
    const fakeBin = path.join(workspaceRoot, '.fake-bin');
    const installLog = path.join(workspaceRoot, 'install-log.jsonl');

    await fs.ensureDir(fakeBin);
    await writeProjectTemplate(workspaceRoot, root, template);
    await writeFakePackageManager(fakeBin);

    return {
        root,
        workspaceRoot,
        cleanupRoot: workspaceRoot,
        fakeBin,
        installLog,
        template,
    };
}

async function writeProjectTemplate(
    workspaceRoot: string,
    root: string,
    template: IntegrationTemplate
): Promise<void> {
    if (template === 'monorepo-subpackage') {
        await fs.ensureDir(root);
        await fs.writeJson(path.join(workspaceRoot, 'package.json'), {
            private: true,
            workspaces: ['apps/*'],
        }, { spaces: 2 });
        await fs.writeFile(path.join(workspaceRoot, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n');
    }

    if (template === 'nuxt') {
        await writeNuxtProject(root);
    } else {
        await writeViteProject(root);
    }

    // Pin pnpm virtual-store-dir to an absolute realpath to prevent
    // ERR_PNPM_UNEXPECTED_VIRTUAL_STORE caused by Windows short/long path aliases
    // (e.g. LIDAIX~1 vs lidaixingchen) resolving differently across subprocess invocations.
    const virtualStoreDir = path.join(workspaceRoot, 'node_modules', '.pnpm').replace(/\\/g, '/');
    await fs.writeFile(path.join(root, '.npmrc'), `virtual-store-dir=${virtualStoreDir}\n`);
}

async function writeViteProject(root: string): Promise<void> {
    await fs.ensureDir(path.join(root, 'src'));
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
}

async function writeNuxtProject(root: string): Promise<void> {
    await fs.ensureDir(path.join(root, 'assets', 'css'));
    await fs.writeJson(path.join(root, 'package.json'), {
        type: 'module',
        dependencies: {
            nuxt: '^3.0.0',
            tailwindcss: '^4.0.0',
            vue: '^3.5.0',
        },
        devDependencies: {},
    }, { spaces: 2 });
    await fs.writeJson(path.join(root, 'tsconfig.json'), {
        compilerOptions: {
            baseUrl: '.',
            paths: {
                '@/*': ['./*'],
            },
        },
    }, { spaces: 2 });
    await fs.writeFile(path.join(root, 'nuxt.config.ts'), 'export default defineNuxtConfig({ css: ["~/assets/css/main.css"] })\n');
    await fs.writeFile(path.join(root, 'app.vue'), '<template><NuxtPage /></template>\n');
    await fs.writeFile(path.join(root, 'assets', 'css', 'main.css'), '@import "tailwindcss";\n');
}

export async function removeTestProject(project: TestProject): Promise<void> {
    if (shouldKeepTestProject()) {
        console.warn(`Keeping integration test project at ${project.root}`);
        return;
    }

    await fs.remove(project.cleanupRoot);
}

export async function runCli(
    project: TestProject,
    args: string[],
    options: { cwd?: string } = {}
): Promise<CliResult> {
    if (!(await fs.pathExists(cliEntry))) {
        throw new Error(`CLI build output does not exist: ${cliEntry}. Run pnpm --filter brutx-vue build first.`);
    }

    const resolvedTemp = path.join(os.homedir(), '.brutx-integration-tmp');
    const pathKey = Object.keys(process.env).find(k => k.toLowerCase() === 'path') || 'PATH';
    const originalPath = process.env[pathKey] || '';

    const env: Record<string, string> = {
        ...process.env,
        TEMP: resolvedTemp,
        TMP: resolvedTemp,
        BRUTX_FAKE_PM_LOG: project.installLog,
        CI: '1',
        NO_COLOR: '1',
    };
    env['PATH'] = `${project.fakeBin}${path.delimiter}${originalPath}`;
    env['Path'] = `${project.fakeBin}${path.delimiter}${originalPath}`;

    return new Promise((resolve) => {
        execFile(
            process.execPath,
            [cliEntry, ...args],
            {
                cwd: options.cwd ?? project.root,
                env,
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
        'try {',
        '  const logPath = process.env.BRUTX_FAKE_PM_LOG;',
        '  if (logPath) {',
        '    fs.appendFileSync(logPath, JSON.stringify({',
        '      command: path.basename(process.argv[1]),',
        '      args: process.argv.slice(2),',
        '      cwd: process.cwd(),',
        '    }) + "\\n");',
        '  }',
        '  const args = process.argv.slice(2);',
        '  const isAdd = args.includes("add") || args.includes("install") || args.includes("i");',
        '  if (isAdd) {',
        '    const pkgPath = path.join(process.cwd(), "package.json");',
        '    if (fs.existsSync(pkgPath)) {',
        '      try {',
        '        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));',
        '        pkg.dependencies = pkg.dependencies || {};',
        '        pkg.devDependencies = pkg.devDependencies || {};',
        '        const isDev = args.includes("-D") || args.includes("--save-dev") || args.includes("-d");',
        '        const target = isDev ? pkg.devDependencies : pkg.dependencies;',
        '        const packages = args.filter(arg => !arg.startsWith("-") && arg !== "add" && arg !== "install" && arg !== "i");',
        '        for (const p of packages) {',
        '          const name = p.startsWith("@") ? p.split("@").slice(0, 2).join("@") : p.split("@")[0];',
        '          if (name) {',
        '            target[name] = "workspace:*";',
        '          }',
        '        }',
        '        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));',
        '      } catch (e) {',
        '        console.error("FAKE_PM_ERROR (catch):", e.message, e.stack);',
        '        if (logPath) {',
        '          fs.appendFileSync(logPath, JSON.stringify({ error: e.message, stack: e.stack }) + "\\n");',
        '        }',
        '      }',
        '    } else {',
        '      console.error("FAKE_PM_ERROR: package.json does not exist at", pkgPath);',
        '    }',
        '  } else {',
        '    console.error("FAKE_PM_ERROR: not an add command", args);',
        '  }',
        '} catch (e) {',
        '  console.error("FAKE_PM_FATAL:", e.message, e.stack);',
        '} finally {',
        '  process.exit(0);',
        '}',
    ].join('\n');

    await fs.writeFile(scriptPath, script);

    // Write a package.json with "type": "commonjs" in fakeBin so that Node.js
    // treats the extensionless shims (npm, pnpm, etc.) as CommonJS modules.
    // Without this, the nearest package.json (the test project's, which has
    // "type": "module") causes Node.js to treat the shims as ESM, where
    // require() is not defined — breaking the fake PM on Linux.
    await fs.writeJson(path.join(fakeBin, 'package.json'), { type: 'commonjs' });

    // Use process.execPath (absolute path to node) in the shebang instead of
    // /usr/bin/env node. On Linux CI, /usr/bin/env may not find node if PATH
    // differs between the test runner and the spawned subprocess environment.
    for (const pm of ['npm', 'pnpm', 'yarn', 'bun']) {
        await fs.writeFile(path.join(fakeBin, pm), `#!${process.execPath}\nrequire(${JSON.stringify(scriptPath)});\n`);
        await fs.writeFile(path.join(fakeBin, `${pm}.cmd`), `@echo off\r\nnode "${scriptPath}" %*\r\n`);
        await fs.writeFile(path.join(fakeBin, `${pm}.ps1`), `node "${scriptPath}" $args\r\n`);
        await fs.chmod(path.join(fakeBin, pm), 0o755);
    }
}
