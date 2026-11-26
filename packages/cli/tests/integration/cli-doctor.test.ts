import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import fs from 'fs-extra';
import { afterEach, describe, expect, it } from 'vitest';
import { BRUTX_CSS_END_MARKER, BRUTX_CSS_START_MARKER, CURRENT_CONFIG_VERSION, SCHEMA_URL } from '../../src/lib/constants.js';
import { DiskFileSystemAdapter } from '../../src/lib/fs/index.js';
import { CacheStorage } from '../../src/lib/storage/cache-storage.js';
import { MANIFEST_VERSION, type RegistryItem } from '../../src/lib/types.js';
import { cliEntry, localRegistry } from './helpers.js';

const run = promisify(execFile);
const diagnosticFailureExitCode = 1;
const repairPreview = 'Dry-Run Repair Plan Preview';
const warningThreshold = ['--fail-on', 'warn'];

async function writeManifest(cwd: string, item: RegistryItem, registrySource: string) {
    await fs.writeJson(path.join(cwd, '.brutx', 'manifest.json'), {
        version: MANIFEST_VERSION,
        components: {
            [item.name]: {
                name: item.name,
                registrySource,
                integrity: item.integrity,
                installedAt: new Date().toISOString(),
                files: item.files.map(file => file.path),
                dependencies: [],
                registryDependencies: [],
            },
        },
    });
}

async function snapshotTree(root: string, relativePath = '.'): Promise<unknown> {
    const absolutePath = path.join(root, relativePath);
    const { mtimeMs } = await fs.stat(absolutePath);
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    return {
        mtimeMs,
        entries: await Promise.all(entries.sort((a, b) => a.name.localeCompare(b.name)).map(async (entry) => {
            const relativeEntry = path.join(relativePath, entry.name);
            if (entry.isDirectory()) {
                return [entry.name, await snapshotTree(root, relativeEntry)];
            }

            const filePath = path.join(root, relativeEntry);
            return [entry.name, (await fs.stat(filePath)).mtimeMs, await fs.readFile(filePath)];
        })),
    };
}

describe('CLI doctor repair preview', { timeout: 20000 }, () => {
    let fixtureDir: string | undefined;

    afterEach(async () => {
        if (fixtureDir) {
            await fs.remove(fixtureDir);
            fixtureDir = undefined;
        }
    });

    async function createFixture() {
        fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-doctor-cli-'));
        const cwd = path.join(fixtureDir, 'project');
        const cacheDir = path.join(fixtureDir, 'cache');
        await fs.outputJson(path.join(cwd, 'package.json'), { private: true, dependencies: { vue: '^3.5.0' } });
        await fs.outputFile(path.join(cwd, '.brutx', 'audit.log'), '');
        await fs.ensureDir(cacheDir);
        const env = { ...process.env, BRUTX_CACHE_DIR: cacheDir, BRUTX_DRY_RUN: '', BRUTX_OFFLINE: '', NO_COLOR: '1' };

        return {
            cwd,
            cacheDir,
            async cli(args: string[], overrides?: NodeJS.ProcessEnv) {
                try {
                    return { code: 0, ...await run(process.execPath, [cliEntry, ...args], { cwd, env: { ...env, ...overrides } }) };
                } catch (error) {
                    const result = error as { code?: number | string; stdout?: string; stderr?: string };
                    if (typeof result.code !== 'number') throw error;
                    return { code: result.code, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
                }
            },
        };
    }

    const previews = [
        { before: ['--dry-run'], after: [], env: {} },
        { before: [], after: ['--dry-run'], env: {} },
        { before: [], after: [], env: { BRUTX_DRY_RUN: '1' } },
    ];

    it.each(['legacy config', 'split tokens'] as const)('previews %s through every dry-run entry before applying once', async (scenario) => {
        const { cwd, cacheDir, cli } = await createFixture();
        const configPath = path.join(cwd, 'components.json');
        const entry = 'src/index.css';
        const tokensFile = 'src/theme/project.css';
        const userCss = 'body { margin: 0; }';
        const userTokens = ':root { --project-accent: red; }';
        const markedCss = `${BRUTX_CSS_START_MARKER}\n:root { --color-brutal-bg: white; }\n${BRUTX_CSS_END_MARKER}`;
        const projectExtension = { enabled: true };
        const isLegacy = scenario === 'legacy config';
        const config = {
            ...(isLegacy ? {} : { $schema: SCHEMA_URL, $version: CURRENT_CONFIG_VERSION, style: 'brutalism' }),
            tailwind: { css: entry, ...(isLegacy ? {} : { tokensFile }) },
            projectExtension,
        };
        await fs.writeJson(configPath, config);
        await fs.outputFile(path.join(cwd, entry), `@import "tailwindcss";\n${userCss}\n${markedCss}\n`);
        await fs.outputFile(path.join(cwd, tokensFile), userTokens);

        const filter = isLegacy ? ['--category', 'config'] : ['--rule', 'tailwind.tokens'];
        const args = ['doctor', '--offline', '--fix', '--yes', ...warningThreshold, ...filter];
        const projectBefore = await snapshotTree(cwd);
        const cacheBefore = await snapshotTree(cacheDir);

        for (const { before, after, env } of previews) {
            const result = await cli([...before, ...args, ...after], env);
            expect(result.code, result.stderr || result.stdout).toBe(diagnosticFailureExitCode);
            expect(result.stdout).toContain(repairPreview);
            expect(result.stdout).toContain(isLegacy ? '[config.version]' : '[tailwind.tokens]');
            expect(await snapshotTree(cwd)).toEqual(projectBefore);
            expect(await snapshotTree(cacheDir)).toEqual(cacheBefore);
        }

        const applied = await cli(args);
        expect(applied.code, applied.stderr || applied.stdout).toBe(0);
        if (isLegacy) {
            expect(applied.stdout).toContain('Applied 3/3 fixes.');
            expect(await fs.readJson(configPath)).toEqual({
                ...config,
                $schema: SCHEMA_URL,
                $version: CURRENT_CONFIG_VERSION,
                style: 'brutalism',
            });
        } else {
            expect(applied.stdout).toContain('Applied 1/1 fixes.');
            const mainCss = await fs.readFile(path.join(cwd, entry), 'utf8');
            expect(mainCss).toContain('@import "./theme/project.css";');
            expect(mainCss).toContain(userCss);
            expect(mainCss).not.toContain(BRUTX_CSS_START_MARKER);
            const tokens = await fs.readFile(path.join(cwd, tokensFile), 'utf8');
            expect(tokens).toContain(userTokens);
            expect(tokens).toContain(BRUTX_CSS_START_MARKER);
        }

        const projectAfter = await snapshotTree(cwd);
        const repeated = await cli(args);
        expect(repeated.code, repeated.stderr || repeated.stdout).toBe(0);
        expect(repeated.stdout).toContain('Applied 0/0 fixes.');
        expect(await snapshotTree(cwd)).toEqual(projectAfter);
        expect(await snapshotTree(cacheDir)).toEqual(cacheBefore);
    });

    it('reuses existing CSS imports resolved through an explicit tsconfig alias', async () => {
        const { cwd, cli } = await createFixture();
        const mainCss = 'src/index.css';
        const tokensCss = 'src/theme/tokens.css';
        const tokensAlias = '@styles/tokens.css';
        const importLine = `@import "${tokensAlias}";`;
        const cleanMain = `${importLine}\nbody { margin: 0; }\n`;
        const markedCss = `${BRUTX_CSS_START_MARKER}\n:root { --color-brutal-bg: white; }\n${BRUTX_CSS_END_MARKER}`;
        await fs.writeJson(path.join(cwd, 'tsconfig.json'), {
            compilerOptions: { paths: { '@styles/*': ['./src/theme/*'] } },
        });
        await fs.writeFile(path.join(cwd, 'vite.config.mjs'), `
            import { fileURLToPath } from 'node:url';
            export default { resolve: { alias: { '@styles': fileURLToPath(new URL('./src/theme', import.meta.url)) } } };
        `);
        await fs.writeJson(path.join(cwd, 'components.json'), { tailwind: { css: mainCss, tokensFile: tokensAlias } });
        await fs.outputFile(path.join(cwd, mainCss), cleanMain);
        await fs.outputFile(path.join(cwd, tokensCss), markedCss);
        const args = ['doctor', '--rule', 'tailwind.tokens', '--offline', '--fix', '--yes', ...warningThreshold];
        const healthy = await cli(args);
        expect(healthy.code, healthy.stderr || healthy.stdout).toBe(0);
        expect(healthy.stdout).toContain('Applied 0/0 fixes.');
        expect(await fs.readFile(path.join(cwd, mainCss), 'utf8')).toBe(cleanMain);

        await fs.writeFile(path.join(cwd, mainCss), `${cleanMain}${markedCss}\n`);
        await fs.remove(path.join(cwd, tokensCss));
        const projectBefore = await snapshotTree(cwd);
        const preview = await cli([...args, '--dry-run']);
        expect(preview.code, preview.stderr || preview.stdout).toBe(diagnosticFailureExitCode);
        expect(preview.stdout).toContain(repairPreview);
        expect(preview.stdout).toContain('[tailwind.tokens]');
        expect(await snapshotTree(cwd)).toEqual(projectBefore);

        const fixed = await cli(args);
        expect(fixed.code, fixed.stderr || fixed.stdout).toBe(0);
        expect(fixed.stdout).toContain('Applied 1/1 fixes.');
        expect(await fs.readFile(path.join(cwd, mainCss), 'utf8')).toBe(cleanMain.trimEnd());
        expect(await fs.readFile(path.join(cwd, tokensCss), 'utf8')).toContain(BRUTX_CSS_START_MARKER);
        const repeated = await cli(args);
        expect(repeated.code, repeated.stderr || repeated.stdout).toBe(0);
        expect(repeated.stdout).toContain('Applied 0/0 fixes.');
    });

    it('previews the SBOM destination and writes it only on an actual invocation', async () => {
        const { cwd, cacheDir, cli } = await createFixture();
        const item = await fs.readJson(path.join(localRegistry, 'button.json')) as RegistryItem;
        await writeManifest(cwd, item, localRegistry);
        const target = path.join('reports', 'side-effect.json');
        const absoluteTarget = path.join(await fs.realpath(cwd), target);
        const args = ['doctor', '--sbom', '--sbom-output', target];
        const projectBefore = await snapshotTree(cwd);
        const cacheBefore = await snapshotTree(cacheDir);

        for (const { before, after, env } of previews) {
            const preview = await cli([...before, ...args, ...after], env);
            expect(preview.code, preview.stderr || preview.stdout).toBe(0);
            expect(preview.stdout).toContain(`[Dry Run] Would write SBOM: ${absoluteTarget}`);
            expect(preview.stdout).toContain('CycloneDX');
            expect(await snapshotTree(cwd)).toEqual(projectBefore);
            expect(await snapshotTree(cacheDir)).toEqual(cacheBefore);
        }

        const applied = await cli(args);
        expect(applied.code, applied.stderr || applied.stdout).toBe(0);
        expect(await fs.readJson(path.join(cwd, target))).toMatchObject({
            bomFormat: 'CycloneDX',
            components: expect.arrayContaining([expect.objectContaining({ name: item.name })]),
        });
    });

    it('reads a warm offline cache and revalidates it online without touching cache or project files', async () => {
        const { cwd, cacheDir, cli } = await createFixture();
        const item = await fs.readJson(path.join(localRegistry, 'button.json')) as RegistryItem;
        const etag = '"button-revision"';
        const conditionalRequests: Array<string | undefined> = [];
        const server = createServer((request, response) => {
            if (request.url === `/${item.name}.json`) {
                conditionalRequests.push(request.headers['if-none-match']);
                response.writeHead(304).end();
            } else {
                response.writeHead(404).end();
            }
        });
        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', resolve);
        });
        try {
            const address = server.address();
            if (!address || typeof address === 'string') throw new Error('HTTP registry fixture has no port');
            const source = `http://127.0.0.1:${address.port}`;
            await fs.writeJson(path.join(cwd, 'components.json'), { registries: [source] });
            await writeManifest(cwd, item, source);
            const cache = new CacheStorage({ fs: new DiskFileSystemAdapter(), cacheDir });
            await cache.set(item.name, source, item, { etag });
            const [cacheEntry] = await fs.readdir(cacheDir);
            const cachePath = path.join(cacheDir, cacheEntry);
            await fs.writeJson(cachePath, { ...await fs.readJson(cachePath), timestamp: 0 });
            const projectBefore = await snapshotTree(cwd);
            const cacheBefore = await snapshotTree(cacheDir);
            const args = ['doctor', '--rule', 'integrity.manifest-files', '--fix', '--yes', ...warningThreshold];

            const offline = await cli(['--dry-run', ...args, '--offline']);
            expect(offline.code, offline.stderr || offline.stdout).toBe(diagnosticFailureExitCode);
            expect(offline.stdout).toContain('[OFFLINE CACHE HIT]');
            expect(offline.stdout).toContain('[integrity.manifest-files] Restore button from registry.');
            expect(conditionalRequests).toEqual([]);
            expect(await snapshotTree(cwd)).toEqual(projectBefore);
            expect(await snapshotTree(cacheDir)).toEqual(cacheBefore);

            const reportPath = path.join('reports', 'doctor.json');
            const online = await cli([...args, '--dry-run', '--reporter', 'json', '--output-file', reportPath]);
            expect(online.code, online.stderr || online.stdout).toBe(diagnosticFailureExitCode);
            expect(online.stdout).toContain('[integrity.manifest-files] Restore button from registry.');
            expect(conditionalRequests).toEqual([etag]);
            expect(await snapshotTree(cwd)).toEqual(projectBefore);
            expect(await snapshotTree(cacheDir)).toEqual(cacheBefore);
        } finally {
            await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        }
    });
});
