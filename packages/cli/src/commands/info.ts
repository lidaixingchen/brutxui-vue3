import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import type { BrutalistConfig, InfoOptions, RegistryItem } from '../lib/types.js';
import { getItemFromSources } from '../lib/registry.js';
import { readConfigSafe, CliError, resolveRegistrySources, withOfflineScope } from '../lib/index.js';
import { resolveAliasPath } from '../lib/project.js';
import { logger } from '../lib/logger.js';

interface ComponentInfoResult {
    name: string;
    registryItem: RegistryItem | null;
    localFiles: string[];
    source: string;
    status: 'installed' | 'not-installed' | 'not-found' | 'registry-unreachable';
}

async function getLocalFiles(cwd: string, config: BrutalistConfig, componentName: string): Promise<string[]> {
    try {
        const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
        const componentPath = path.join(componentsPath, componentName);

        if (!await fs.pathExists(componentPath)) {
            return [];
        }

        const files: string[] = [];

        async function walk(dir: string, base: string): Promise<void> {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relative = base ? `${base}/${entry.name}` : entry.name;

                if (entry.isSymbolicLink()) {
                    // 符号链接：用 stat 判断真实类型（链接指向的目录不递归，避免环引用）
                    try {
                        const stat = await fs.stat(fullPath);
                        if (stat.isFile()) {
                            files.push(relative);
                        }
                    } catch {
                        // 悬空链接（目标不存在）忽略
                    }
                    continue;
                }

                if (entry.isDirectory()) {
                    await walk(fullPath, relative);
                } else if (entry.isFile()) {
                    files.push(relative);
                }
                // 设备、管道等特殊文件不计入文件清单
            }
        }

        await walk(componentPath, '');
        return files;
    } catch (error) {
        // 本地扫描失败（别名越界/目录无权限等）不中断 info 命令：返回空列表并告警，
        // 与 registry 获取错误的降级处理保持一致
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to scan local files for "${componentName}": ${message}`);
        return [];
    }
}

/**
 * 判断注册表错误是否为"组件不存在"（HTTP 404 / 本地 registry 文件缺失）。
 * getItemFromSources 会把各源错误聚合为 "All N registry source(s) failed. Last error: ..."，
 * 真实原因在 cause 链末端，故沿 cause 链逐层匹配。
 */
function isComponentNotFoundError(error: Error | null): boolean {
    let current: unknown = error;
    while (current instanceof Error) {
        if (current.message.toLowerCase().includes('not found')) {
            return true;
        }
        const cause = (current as Error & { cause?: unknown }).cause;
        if (!(cause instanceof Error) || cause === current) {
            break;
        }
        current = cause;
    }
    return false;
}

async function getComponentInfo(
    cwd: string,
    config: BrutalistConfig,
    componentName: string,
    registryOverride?: string
): Promise<ComponentInfoResult> {
    // 与 registry.ts 的 PATH_UNSAFE 校验保持一致：拒绝路径分隔符与 ".."，
    // 防止 path.join 丢弃 componentsPath 前缀后把组件目录之外的文件扫进本地清单
    if (componentName.includes('/') || componentName.includes('\\') || componentName.includes('..')) {
        throw new CliError(
            `Security Error: Path traversal detected in component name "${componentName}".`,
            { code: 'PATH_UNSAFE', exitCode: 2 }
        );
    }

    const sources = resolveRegistrySources(config, registryOverride);
    let source = sources[0];
    let registryItem: RegistryItem | null;
    let registryFetchError: Error | null = null;

    try {
        const result = await getItemFromSources(componentName, sources);
        registryItem = result.item;
        source = result.source;
    } catch (error) {
        registryItem = null;
        registryFetchError = error instanceof Error ? error : new Error(String(error));
    }

    const localFiles = await getLocalFiles(cwd, config, componentName);

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

    const result = await getComponentInfo(cwd, config, component, options.registry);

    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    printInfo(result);
}
