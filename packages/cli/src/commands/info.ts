import path from 'path';
import chalk from 'chalk';
import type { InfoOptions, InstalledComponentManifest, RegistryItem } from '../lib/types.js';
import { assertSafeComponentName, isComponentNotFoundError, parseComponentSpecifier } from '../lib/registry-client.js';
import { readConfigSafe, CliError, resolveRegistrySources, withOfflineScope } from '../lib/index.js';
import { resolveInstalledFile } from '../lib/component-files.js';
import { readManifest } from '../lib/manifest.js';
import { ProjectContext } from '../lib/project-context.js';
import { getUpdateRegistrySource } from '../lib/registry-source.js';
import { logger } from '../lib/logger.js';

interface ComponentInfoResult {
    name: string;
    registryItem: RegistryItem | null;
    localFiles: string[];
    source: string;
    status: 'installed' | 'not-installed' | 'not-found' | 'registry-unreachable';
}

async function getLocalFiles(
    context: ProjectContext,
    componentName: string,
    manifestEntry: InstalledComponentManifest | undefined,
): Promise<string[]> {
    try {
        const { fs } = context;
        const componentsDir = await context.resolveComponentsDir();
        const legacyPath = path.resolve(componentsDir, componentName);
        await context.assertSafePath(legacyPath, componentsDir);
        let componentPath = legacyPath;
        const files = new Set<string>();
        const stat = (filePath: string) => fs.stat(filePath).catch(() => undefined);

        async function walk(dir: string, base: string): Promise<void> {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relative = base ? `${base}/${entry.name}` : entry.name;

                if (entry.isDirectory()) {
                    await walk(fullPath, relative);
                } else if (entry.isFile() || (entry.isSymbolicLink() && (await stat(fullPath))?.isFile())) {
                    files.add(relative);
                }
            }
        }

        if ((await stat(legacyPath))?.isDirectory()) {
            await walk(legacyPath, '');
        }
        if (files.size === 0) {
            componentPath = await context.resolveComponentDir(componentName);
            if (componentPath !== legacyPath && (await stat(componentPath))?.isDirectory()) {
                await walk(componentPath, '');
            }
        }
        for (const recordedPath of manifestEntry?.files ?? []) {
            const absolutePath = resolveInstalledFile(context, recordedPath);
            if (absolutePath.startsWith(componentPath + path.sep)) continue;
            if (await context.isSafePath(absolutePath) && (await stat(absolutePath))?.isFile()) {
                files.add(context.toRelativePosixPath(absolutePath));
            }
        }
        return [...files];
    } catch (error) {
        // PATH_UNSAFE 是安全错误，必须向上传播，不能降级为空列表
        if (error instanceof CliError && error.code === 'PATH_UNSAFE') {
            throw error;
        }
        // 其余本地扫描失败（别名越界/目录无权限等）不中断 info 命令：返回空列表并告警，
        // 与 registry 获取错误的降级处理保持一致
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to scan local files for "${componentName}": ${message}`);
        return [];
    }
}

async function getComponentInfo(
    context: ProjectContext,
    componentSpecifier: string,
    registryOverride?: string
): Promise<ComponentInfoResult> {
    const { name: componentName, version } = parseComponentSpecifier(componentSpecifier);
    assertSafeComponentName(componentName);

    const manifest = await readManifest(context.cwd, context.fs).catch(error => {
        logger.warn(error instanceof Error ? error.message : String(error));
        return null;
    });
    const manifestEntry = manifest?.components[componentName];
    const registry = getUpdateRegistrySource(manifestEntry, registryOverride, version !== undefined);
    const sources = resolveRegistrySources(context.requireConfig(), registry);
    let source = sources[0];
    let registryItem: RegistryItem | null;
    let registryFetchError: Error | null = null;

    const client = context.getRegistryClient({ sources });

    try {
        const snapshot = await client.fetchItemWithMeta(componentSpecifier);
        registryItem = snapshot.item;
        source = snapshot.source;
    } catch (error) {
        registryItem = null;
        registryFetchError = error instanceof Error ? error : new Error(String(error));
    }

    const localFiles = await getLocalFiles(context, componentName, manifestEntry);

    let status: ComponentInfoResult['status'];
    if (registryItem && localFiles.length > 0) {
        status = 'installed';
    } else if (registryItem) {
        status = 'not-installed';
    } else if (isComponentNotFoundError(registryFetchError)) {
        // 组件在 registry 中不存在（404/本地文件缺失）：判定 not-found，而非 registry-unreachable
        status = 'not-found';
    } else {
        status = 'registry-unreachable';
    }

    return {
        name: componentName,
        registryItem,
        localFiles,
        source,
        status,
    };
}

function printInfo(result: ComponentInfoResult): void {
    logger.newLine();

    logger.bold(`Component: ${result.name}`);
    logger.log(`  Source: ${result.source}`);

    if (result.registryItem) {
        const files = result.registryItem.files.map(f => f.path.split('/').pop() ?? f.path);
        logger.log(`  Registry Files: ${files.join(', ')} (${files.length} file${files.length !== 1 ? 's' : ''})`);

        const deps = result.registryItem.dependencies;
        logger.log(`  Dependencies: ${deps && deps.length > 0 ? deps.join(', ') : chalk.dim('none')}`);

        const regDeps = result.registryItem.registryDependencies;
        logger.log(`  Registry Dependencies: ${regDeps && regDeps.length > 0 ? regDeps.join(', ') : chalk.dim('none')}`);
    } else {
        logger.log(`  Registry: ${chalk.dim('not available')}`);
    }

    if (result.localFiles.length > 0) {
        logger.log(`  Local Files: ${result.localFiles.join(', ')} (${result.localFiles.length} file${result.localFiles.length !== 1 ? 's' : ''})`);
    }

    const STATUS_COLORS: Record<ComponentInfoResult['status'], typeof chalk.green> = {
        installed: chalk.green,
        'not-installed': chalk.yellow,
        'registry-unreachable': chalk.red,
        'not-found': chalk.dim,
    };
    logger.log(`  Status: ${STATUS_COLORS[result.status](result.status)}`);

    logger.newLine();
}

export async function info(component: string, options: InfoOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    logger.setSilent(options.silent ?? false);

    const restoreOffline = withOfflineScope(options.offline === true);
    try {
        await infoInner(component, options, cwd);
    } finally {
        restoreOffline();
    }
}

async function infoInner(component: string, options: InfoOptions, cwd: string): Promise<void> {
    const config = await readConfigSafe(cwd);

    if (!config) {
        throw new CliError('No components.json found. Run `brutx-vue init` first.', {
            code: 'CONFIG_NOT_FOUND',
        });
    }

    const context = await ProjectContext.loadUninitialized(cwd, { configOverride: config });
    const result = await getComponentInfo(context, component, options.registry);

    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    printInfo(result);
}
