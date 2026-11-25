import { beforeEach, describe, expect, it, vi } from 'vitest';
import { spawn } from 'node:child_process';
import { EventEmitter, once } from 'node:events';
import os from 'os';
import path from 'path';
import fsExtra from 'fs-extra';
import { FileTransaction } from '../src/lib/file-transaction.js';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';

describe('FileTransaction project lock with DiskFS', () => {
    const lockFilename = '.brutx-write.lock';
    const manifestRelativePath = '.brutx/manifest.json';
    const crossProcessTestTimeoutMs = 25_000;
    const transactionScript = `
        import assert from 'node:assert/strict';
        import { once } from 'node:events';
        import fs from 'node:fs';
        import { join } from 'node:path';
        import { FileTransaction } from ${JSON.stringify(new URL('../src/lib/file-transaction.ts', import.meta.url).href)};
        import { updateInstalledComponents } from ${JSON.stringify(new URL('../src/lib/manifest.ts', import.meta.url).href)};
        const [cwd, name, action] = process.argv.slice(1);
        const transaction = new FileTransaction(undefined, cwd);
        const start = once(process, 'message');
        process.send('ready');
        assert.equal((await start)[0], 'start');
        const continueTransaction = name === 'alpha' ? once(process, 'message') : null;
        const lockPath = join(fs.realpathSync(cwd), ${JSON.stringify(lockFilename)});
        const openSync = fs.openSync;
        if (name === 'beta') {
            let reportedContention = false;
            fs.openSync = function (file, flags, ...options) {
                try {
                    return openSync.call(this, file, flags, ...options);
                } catch (error) {
                    if (file === lockPath && flags === 'wx' && error.code === 'EEXIST' && !reportedContention) {
                        reportedContention = true;
                        process.send('contended');
                    }
                    throw error;
                }
            };
        }
        try {
            await transaction.lockProjectWrites();
        } finally {
            fs.openSync = openSync;
        }
        assert.equal(JSON.parse(fs.readFileSync(lockPath, 'utf8')).pid, process.pid);
        const source = join(cwd, name + '.vue');
        await transaction.writeFile(source, name);
        await updateInstalledComponents(cwd, [{
            item: {
                name,
                type: 'registry:ui',
                integrity: 'registry-' + name,
                dependencies: [],
                registryDependencies: [],
            },
            files: [source],
            registrySource: 'test',
        }], { transaction });
        process.send('staged');
        if (continueTransaction) assert.equal((await continueTransaction)[0], 'finish');
        if (action === 'rollback') assert.deepEqual(await transaction.rollback(), []);
        else await transaction.commit();
        process.disconnect();
    `;

    function startTransaction(cwd: string, name: string, action: 'commit' | 'rollback') {
        const processHandle = spawn(
            process.execPath,
            ['--import', 'tsx', '--input-type=module', '--eval', transactionScript, cwd, name, action],
            { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] },
        );
        const messages = new Set<string>();
        const received = new EventEmitter();
        let stderr = '';
        processHandle.stderr.on('data', chunk => { stderr += chunk.toString(); });
        processHandle.on('message', message => {
            if (typeof message !== 'string') return;
            messages.add(message);
            received.emit(message);
        });
        const exit = once(processHandle, 'exit');
        return {
            processHandle,
            messages,
            exit,
            async waitForMessage(message: string) {
                if (messages.has(message)) return;
                await Promise.race([
                    once(received, message),
                    exit.then(([code, signal]) => {
                        throw new Error(`${name} exited (${code ?? signal}) before ${message}\n${stderr}`);
                    }),
                ]);
            },
            async expectSuccess() {
                expect(await exit, stderr).toEqual([0, null]);
            },
        };
    }

    it.each(['commit', 'rollback'] as const)('coordinates manifest writes across Node processes until %s', async (action) => {
        const cwd = await fsExtra.mkdtemp(path.join(os.tmpdir(), 'brutx-file-transaction-'));
        const first = startTransaction(cwd, 'alpha', action);
        const second = startTransaction(cwd, 'beta', 'commit');
        try {
            await Promise.all([first.waitForMessage('ready'), second.waitForMessage('ready')]);
            first.processHandle.send('start');
            await first.waitForMessage('staged');
            const lockPath = path.join(cwd, lockFilename);
            expect((await fsExtra.readJson(lockPath)).pid).toBe(first.processHandle.pid);
            second.processHandle.send('start');
            await second.waitForMessage('contended');
            expect(second.messages.has('staged')).toBe(false);
            expect((await fsExtra.readJson(lockPath)).pid).toBe(first.processHandle.pid);
            expect(await fsExtra.pathExists(path.join(cwd, 'beta.vue'))).toBe(false);

            first.processHandle.send('finish');
            await first.expectSuccess();
            await second.expectSuccess();

            const projectManifest = await fsExtra.readJson(path.join(cwd, manifestRelativePath));
            expect(Object.keys(projectManifest.components).sort()).toEqual(action === 'commit' ? ['alpha', 'beta'] : ['beta']);
            expect(await fsExtra.readFile(path.join(cwd, 'beta.vue'), 'utf-8')).toBe('beta');
            expect(await fsExtra.pathExists(path.join(cwd, 'alpha.vue'))).toBe(action === 'commit');
            expect(await fsExtra.pathExists(lockPath)).toBe(false);
        } finally {
            for (const child of [first, second]) {
                child.processHandle.kill();
                await child.exit;
            }
            await fsExtra.remove(cwd);
        }
    }, crossProcessTestTimeoutMs);

    it('can roll back a lock acquisition error without creating a missing project', async () => {
        const root = await fsExtra.mkdtemp(path.join(os.tmpdir(), 'brutx-file-transaction-'));
        const cwd = path.join(root, 'missing');
        const transaction = new FileTransaction(undefined, cwd);
        try {
            await expect(transaction.lockProjectWrites()).rejects.toMatchObject({ code: 'ENOENT' });
            await expect(transaction.rollback()).resolves.toEqual([]);
            expect(await fsExtra.readdir(root)).toEqual([]);
        } finally {
            await fsExtra.remove(root);
        }
    });
});

describe('FileTransaction with MemoryFS', () => {
    let fs: MemoryFileSystemAdapter;
    const projectCwd = process.platform === 'win32' ? 'C:/workspace/my-app' : '/workspace/my-app';

    beforeEach(async () => {
        fs = new MemoryFileSystemAdapter();
        await fs.ensureDir(projectCwd);
    });

    it('isolates write locks by adapter for the same virtual project path', async () => {
        const otherFs = new MemoryFileSystemAdapter();
        await otherFs.ensureDir(projectCwd);
        const first = new FileTransaction(fs, projectCwd);
        const second = new FileTransaction(otherFs, projectCwd);

        await first.lockProjectWrites();
        await second.lockProjectWrites();
        await first.rollback();
        await second.commit();
        expect(await fs.readdir(projectCwd)).toEqual([]);
        expect(await otherFs.readdir(projectCwd)).toEqual([]);
    });

    it('restores overwritten files and removes created files on rollback', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const existingPath = path.join(projectCwd, 'src', 'existing.ts');
        const createdPath = path.join(projectCwd, 'src', 'created.ts');

        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'original', 'utf-8');

        await transaction.writeFile(existingPath, 'changed');
        await transaction.writeFile(createdPath, 'created');

        expect(await fs.readFile(existingPath, 'utf-8')).toBe('changed');
        expect(await fs.pathExists(createdPath)).toBe(true);

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.readFile(existingPath, 'utf-8')).toBe('original');
        expect(await fs.pathExists(createdPath)).toBe(false);
    });

    it('restores removed directories on rollback', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const targetDir = path.join(projectCwd, 'components', 'button');
        const targetFile = path.join(targetDir, 'Button.vue');

        await fs.ensureDir(targetDir);
        await fs.writeFile(targetFile, '<template>Button</template>', 'utf-8');

        await transaction.remove(targetDir);

        expect(await fs.pathExists(targetDir)).toBe(false);

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.readFile(targetFile, 'utf-8')).toBe('<template>Button</template>');
    });

    it('removes directories created through ensureDir on rollback', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const createdDir = path.join(projectCwd, 'src', 'components', 'ui');

        await transaction.ensureDir(createdDir);

        expect(await fs.pathExists(createdDir)).toBe(true);

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.pathExists(createdDir)).toBe(false);
    });

    it('keeps changes after commit and makes rollback a no-op', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const targetPath = path.join(projectCwd, 'components.json');

        await transaction.writeJson(targetPath, { style: 'brutalism' }, { spaces: 2 });
        await transaction.commit();

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.readJson(targetPath)).toEqual({ style: 'brutalism' });
    });

    it('forbids commit after a successful rollback', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const targetPath = path.join(projectCwd, 'components.json');

        await transaction.writeJson(targetPath, { style: 'brutalism' }, { spaces: 2 });
        await expect(transaction.rollback()).resolves.toEqual([]);

        await expect(transaction.commit()).rejects.toThrow(/not active/);
    });

    it('forbids commit after a partial rollback with failures', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const existingPath = path.join(projectCwd, 'src', 'a.ts');
        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'original', 'utf-8');

        await transaction.writeFile(existingPath, 'changed');

        const copySpy = vi.spyOn(fs, 'copy').mockRejectedValue(new Error('memory copy error'));
        const failures = await transaction.rollback();
        copySpy.mockRestore();
        expect(failures.length).toBeGreaterThan(0);

        await expect(transaction.commit()).rejects.toThrow(/not active/);
    });

    it('forbids further writes after a partial rollback with failures', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const existingPath = path.join(projectCwd, 'src', 'a.ts');
        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'original', 'utf-8');

        await transaction.writeFile(existingPath, 'changed');

        const copySpy = vi.spyOn(fs, 'copy').mockRejectedValue(new Error('memory copy error'));
        const failures = await transaction.rollback();
        copySpy.mockRestore();
        expect(failures.length).toBeGreaterThan(0);

        await expect(
            transaction.writeJson(path.join(projectCwd, 'other.json'), { a: 1 }),
        ).rejects.toThrow(/not active/);
    });

    it('retains prior backups when a later snapshot copy fails', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const existingPath = path.join(projectCwd, 'src', 'a.ts');
        const secondPath = path.join(projectCwd, 'src', 'b.ts');
        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'a', 'utf-8');
        await fs.writeFile(secondPath, 'b', 'utf-8');

        await transaction.writeFile(existingPath, 'a1');

        const copySpy = vi.spyOn(fs, 'copy').mockRejectedValue(new Error('disk error'));
        await expect(transaction.writeFile(secondPath, 'b1')).rejects.toThrow('disk error');
        copySpy.mockRestore();

        await expect(transaction.rollback()).resolves.toEqual([]);
        expect(await fs.readFile(existingPath, 'utf-8')).toBe('a');
    });

    it('rejects ensureDir and remove outside project directory', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const outsidePath = path.join(projectCwd, '..', 'evil-dir');

        await expect(transaction.ensureDir(outsidePath)).rejects.toThrow(/outside the project directory/);
        await expect(transaction.remove(outsidePath)).rejects.toThrow(/outside the project directory/);
    });
});
