import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { BrutalistConfig, RegistryItem } from '../src/lib/types.js';
import { RegistryClient } from '../src/lib/registry-client.js';
import { readManifest, updateInstalledComponents } from '../src/lib/manifest.js';
import {
    prepareRemoveComponents,
    removeComponents,
} from '../src/lib/services/remove-service.js';
import { ProjectContext } from '../src/lib/project-context.js';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';

const defaultConfig: BrutalistConfig = {
    $schema: 'https://example.com/schema.json',
    style: 'brutalism',
    tailwind: { config: 'tailwind.config.js', css: 'src/index.css' },
    aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        composables: '@/composables',
    },
};

function makeRegistryItem(name: string, registryDependencies: string[] = []): RegistryItem {
    return {
        name,
        type: 'registry:ui',
        title: name,
        description: `${name} component`,
        category: 'action',
        examples: [],
        dependencies: [],
        registryDependencies,
        files: [],
        tailwind: {},
        cssVars: {},
        integrity: `sha256-${name}`,
    };
}

async function createTmpProject(): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-remove-service-'));
    await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), {
        compilerOptions: {
            baseUrl: '.',
            paths: { '@/*': ['./src/*'] },
        },
    });
    return tmpDir;
}

async function writeComponent(
    cwd: string,
    componentName: string,
    files: Record<string, string>
): Promise<string[]> {
    const componentDir = path.join(cwd, 'src', 'components', componentName);
    await fs.ensureDir(componentDir);

    const writtenFiles: string[] = [];
    for (const [fileName, content] of Object.entries(files)) {
        const filePath = path.join(componentDir, fileName);
        await fs.writeFile(filePath, content, 'utf-8');
        writtenFiles.push(filePath);
    }

    return writtenFiles;
}

async function seedProject(cwd: string): Promise<{ buttonFiles: string[]; cardFiles: string[]; orphanFile: string }> {
    const buttonFiles = await writeComponent(cwd, 'button', {
        'Button.vue': "import { useButton } from '@/composables/useButton';\n<template><button /></template>",
        'button-variants.ts': 'export const buttonVariants = {};',
    });
    const cardFiles = await writeComponent(cwd, 'card', {
        'Card.vue': '<template><div /></template>',
    });
    const orphanFile = path.join(cwd, 'src', 'composables', 'useButton.ts');
    await fs.ensureDir(path.dirname(orphanFile));
    await fs.writeFile(orphanFile, 'export function useButton() {}', 'utf-8');

    await updateInstalledComponents(cwd, [
        {
            item: makeRegistryItem('button'),
            registrySource: 'https://example.test/registry',
            files: [...buttonFiles, orphanFile],
        },
        {
            item: makeRegistryItem('card', ['button']),
            registrySource: 'https://example.test/registry',
            files: cardFiles,
        },
    ]);

    return { buttonFiles, cardFiles, orphanFile };
}

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

class DeferredRemovalFailureFileSystemAdapter extends MemoryFileSystemAdapter {
    readonly failure = new Error('injected removal failure');
    readonly failedRemovalStarted = deferred();
    readonly pendingRemovalStarted = deferred();
    readonly allowFailure = deferred();
    readonly allowPendingRemoval = deferred();
    pendingRemovalFinished = false;
    rollbackStartedWhilePending = false;
    private failedRemovalStartedOnce = false;
    private pendingRemovalStartedOnce = false;

    constructor(
        private readonly failedPath: string,
        private readonly pendingPath: string,
    ) {
        super();
    }

    override async remove(targetPath: string, options = {}): Promise<void> {
        const resolvedPath = path.resolve(targetPath);

        if (resolvedPath === this.failedPath && !this.failedRemovalStartedOnce) {
            this.failedRemovalStartedOnce = true;
            this.failedRemovalStarted.resolve();
            await this.allowFailure.promise;
            throw this.failure;
        }

        if (resolvedPath === this.pendingPath && !this.pendingRemovalStartedOnce) {
            this.pendingRemovalStartedOnce = true;
            this.pendingRemovalStarted.resolve();
            await this.allowPendingRemoval.promise;
            try {
                await super.remove(targetPath, options);
            } finally {
                this.pendingRemovalFinished = true;
            }
            return;
        }

        if (
            (resolvedPath === this.failedPath || resolvedPath === this.pendingPath) &&
            !this.pendingRemovalFinished
        ) {
            this.rollbackStartedWhilePending = true;
        }

        await super.remove(targetPath, options);
    }
}

class RollbackFailureFileSystemAdapter extends MemoryFileSystemAdapter {
    readonly failure = new Error('injected removal failure');
    private removals = 0;

    constructor(private readonly failedPath: string) {
        super();
    }

    override async remove(targetPath: string, options = {}): Promise<void> {
        if (path.resolve(targetPath) === this.failedPath) {
            this.removals += 1;
            if (this.removals === 1) {
                throw this.failure;
            }
            throw new Error('injected rollback failure');
        }

        await super.remove(targetPath, options);
    }
}

class ConcurrentSuccessfulRemovalFileSystemAdapter extends MemoryFileSystemAdapter {
    readonly allRemovalsStarted = deferred();
    readonly allowRemovals = deferred();
    private readonly startedPaths = new Set<string>();

    constructor(private readonly componentPaths: string[]) {
        super();
    }

    override async remove(targetPath: string, options = {}): Promise<void> {
        const resolvedPath = path.resolve(targetPath);
        if (this.componentPaths.includes(resolvedPath) && !this.startedPaths.has(resolvedPath)) {
            this.startedPaths.add(resolvedPath);
            if (this.startedPaths.size === this.componentPaths.length) {
                this.allRemovalsStarted.resolve();
            }
            await this.allowRemovals.promise;
        }

        await super.remove(targetPath, options);
    }
}

async function createMemoryProject(
    fsAdapter: MemoryFileSystemAdapter,
    componentNames: string[],
    orphanNames: string[] = [],
): Promise<{
    context: ProjectContext;
    cwd: string;
    componentFiles: Map<string, string>;
    orphanFiles: Map<string, string>;
}> {
    const cwd = path.join(os.tmpdir(), 'brutx-remove-service-memory');
    await fsAdapter.writeFile(path.join(cwd, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
            baseUrl: '.',
            paths: { '@/*': ['./src/*'] },
        },
    }));

    const componentFiles = new Map<string, string>();
    const manifestEntries = [];
    for (const componentName of componentNames) {
        const filePath = path.join(cwd, 'src', 'components', componentName, `${componentName}.vue`);
        await fsAdapter.writeFile(filePath, `<template>${componentName}</template>`);
        componentFiles.set(componentName, filePath);
        manifestEntries.push({
            item: makeRegistryItem(componentName),
            registrySource: 'https://example.test/registry',
            files: [filePath],
        });
    }

    await updateInstalledComponents(cwd, manifestEntries, {}, fsAdapter);

    const orphanFiles = new Map<string, string>();
    for (const orphanName of orphanNames) {
        const filePath = path.join(cwd, 'src', 'composables', `${orphanName}.ts`);
        await fsAdapter.writeFile(filePath, `export const ${orphanName} = true;`);
        orphanFiles.set(orphanName, filePath);
    }

    const context = await ProjectContext.loadUninitialized(cwd, {
        fs: fsAdapter,
        configOverride: defaultConfig,
    });
    return { context, cwd, componentFiles, orphanFiles };
}

async function waitForCurrentTurn(): Promise<void> {
    await new Promise<void>((resolve) => setImmediate(resolve));
}

describe('remove service', () => {
    let tmpDir: string;

    beforeEach(async () => {
        vi.clearAllMocks();
        tmpDir = await createTmpProject();
        vi.spyOn(RegistryClient.prototype, 'fetchItem').mockImplementation(async (name: string) => {
            if (name === 'card') return makeRegistryItem('card', ['button']);
            if (name === 'button') return makeRegistryItem('button');
            throw new Error(`Unknown component: ${name}`);
        });
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.remove(tmpDir);
    });

    it('prepares installed, missing, dependent, and orphaned component state', async () => {
        const { orphanFile } = await seedProject(tmpDir);
        const manifest = await readManifest(tmpDir);
        const context = await ProjectContext.loadUninitialized(tmpDir, { configOverride: defaultConfig });

        const removal = await prepareRemoveComponents(
            context,
            ['button', 'missing'],
            manifest
        );

        expect(removal.toRemove).toEqual(['button']);
        expect(removal.notFound).toEqual(['missing']);
        expect(removal.remaining).toEqual(['card']);
        expect(removal.dependents.get('button')).toEqual(['card']);
        expect(removal.orphanedFiles).toEqual([orphanFile]);
    });

    it('waits for concurrent component removals to settle before rolling back', async () => {
        const cwd = path.join(os.tmpdir(), 'brutx-remove-service-memory');
        const failedPath = path.join(cwd, 'src', 'components', 'alpha');
        const pendingPath = path.join(cwd, 'src', 'components', 'beta');
        const fsAdapter = new DeferredRemovalFailureFileSystemAdapter(failedPath, pendingPath);
        const { context, componentFiles } = await createMemoryProject(fsAdapter, ['alpha', 'beta']);

        let settledWhilePending = false;
        const removalOutcome = removeComponents(
            context,
            ['alpha', 'beta'],
            [],
            { removeOrphaned: false },
        ).then(
            () => ({ error: null }),
            (error: unknown) => ({ error }),
        );
        void removalOutcome.then(() => {
            settledWhilePending = true;
        });

        await Promise.all([
            fsAdapter.failedRemovalStarted.promise,
            fsAdapter.pendingRemovalStarted.promise,
        ]);
        fsAdapter.allowFailure.resolve();
        await waitForCurrentTurn();

        const rolledBackWhilePending = fsAdapter.rollbackStartedWhilePending;
        const completedWhilePending = settledWhilePending;
        fsAdapter.allowPendingRemoval.resolve();

        const { error } = await removalOutcome;
        expect(rolledBackWhilePending).toBe(false);
        expect(completedWhilePending).toBe(false);
        expect(error).toBe(fsAdapter.failure);
        expect(error).toHaveProperty('rollbackFailures', []);
        expect(await fsAdapter.readFile(componentFiles.get('alpha')!, 'utf-8')).toBe('<template>alpha</template>');
        expect(await fsAdapter.readFile(componentFiles.get('beta')!, 'utf-8')).toBe('<template>beta</template>');
    });

    it('waits for concurrent orphan removals to settle before rolling back', async () => {
        const cwd = path.join(os.tmpdir(), 'brutx-remove-service-memory');
        const failedPath = path.join(cwd, 'src', 'composables', 'orphan-alpha.ts');
        const pendingPath = path.join(cwd, 'src', 'composables', 'orphan-beta.ts');
        const fsAdapter = new DeferredRemovalFailureFileSystemAdapter(failedPath, pendingPath);
        const { context, componentFiles, orphanFiles } = await createMemoryProject(
            fsAdapter,
            ['alpha'],
            ['orphan-alpha', 'orphan-beta'],
        );

        let settledWhilePending = false;
        const removalOutcome = removeComponents(
            context,
            ['alpha'],
            [...orphanFiles.values()],
            { removeOrphaned: true },
        ).then(
            () => ({ error: null }),
            (error: unknown) => ({ error }),
        );
        void removalOutcome.then(() => {
            settledWhilePending = true;
        });

        await Promise.all([
            fsAdapter.failedRemovalStarted.promise,
            fsAdapter.pendingRemovalStarted.promise,
        ]);
        fsAdapter.allowFailure.resolve();
        await waitForCurrentTurn();

        const rolledBackWhilePending = fsAdapter.rollbackStartedWhilePending;
        const completedWhilePending = settledWhilePending;
        fsAdapter.allowPendingRemoval.resolve();

        const { error } = await removalOutcome;
        expect(rolledBackWhilePending).toBe(false);
        expect(completedWhilePending).toBe(false);
        expect(error).toBe(fsAdapter.failure);
        expect(error).toHaveProperty('rollbackFailures', []);
        expect(await fsAdapter.readFile(componentFiles.get('alpha')!, 'utf-8')).toBe('<template>alpha</template>');
        expect(await fsAdapter.readFile(orphanFiles.get('orphan-alpha')!, 'utf-8')).toBe('export const orphan-alpha = true;');
        expect(await fsAdapter.readFile(orphanFiles.get('orphan-beta')!, 'utf-8')).toBe('export const orphan-beta = true;');
    });

    it('removes multiple components successfully in one batch', async () => {
        const cwd = path.join(os.tmpdir(), 'brutx-remove-service-memory');
        const componentPaths = ['alpha', 'beta'].map((name) => path.join(cwd, 'src', 'components', name));
        const fsAdapter = new ConcurrentSuccessfulRemovalFileSystemAdapter(componentPaths);
        const { context, cwd: projectCwd, componentFiles } = await createMemoryProject(fsAdapter, ['alpha', 'beta']);

        const removal = removeComponents(
            context,
            ['alpha', 'beta'],
            [],
            { removeOrphaned: false },
        );
        await fsAdapter.allRemovalsStarted.promise;
        fsAdapter.allowRemovals.resolve();
        const result = await removal;

        expect(result).toEqual({ totalRemoved: 2, orphanedRemoved: 0 });
        expect(await fsAdapter.pathExists(path.dirname(componentFiles.get('alpha')!))).toBe(false);
        expect(await fsAdapter.pathExists(path.dirname(componentFiles.get('beta')!))).toBe(false);
        expect((await readManifest(projectCwd, fsAdapter))?.components).toEqual({});
    });

    it('preserves the original removal error and rollback failure paths', async () => {
        const cwd = path.join(os.tmpdir(), 'brutx-remove-service-memory');
        const componentPath = path.join(cwd, 'src', 'components', 'alpha');
        const fsAdapter = new RollbackFailureFileSystemAdapter(componentPath);
        const { context, componentFiles } = await createMemoryProject(fsAdapter, ['alpha']);

        const error = await removeComponents(
            context,
            ['alpha'],
            [],
            { removeOrphaned: false },
        ).then(
            () => null,
            (caught: unknown) => caught,
        );

        expect(error).toBe(fsAdapter.failure);
        expect(error).toHaveProperty('rollbackFailures', [componentPath]);
        expect(await fsAdapter.pathExists(componentFiles.get('alpha')!)).toBe(true);
    });

    it('removes component files and keeps orphaned files when requested', async () => {
        const { orphanFile } = await seedProject(tmpDir);
        const componentDir = path.join(tmpDir, 'src', 'components', 'button');
        const context = await ProjectContext.loadUninitialized(tmpDir, { configOverride: defaultConfig });

        const result = await removeComponents(
            context,
            ['button'],
            [orphanFile],
            { removeOrphaned: false }
        );

        expect(result).toEqual({ totalRemoved: 2, orphanedRemoved: 0 });
        expect(await fs.pathExists(componentDir)).toBe(false);
        expect(await fs.pathExists(orphanFile)).toBe(true);

        const manifest = await readManifest(tmpDir);
        expect(manifest?.components.button).toBeUndefined();
        expect(manifest?.components.card).toBeDefined();
    });

    it('removes orphaned files when requested', async () => {
        const { orphanFile } = await seedProject(tmpDir);
        const context = await ProjectContext.loadUninitialized(tmpDir, { configOverride: defaultConfig });

        const result = await removeComponents(
            context,
            ['button'],
            [orphanFile],
            { removeOrphaned: true }
        );

        expect(result).toEqual({ totalRemoved: 2, orphanedRemoved: 1 });
        expect(await fs.pathExists(orphanFile)).toBe(false);
    });
});
