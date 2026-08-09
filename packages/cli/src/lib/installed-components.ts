import fs from 'fs-extra';
import path from 'path';
import { parse as parseModuleImports, type ImportSpecifier } from 'es-module-lexer';
import type { BrutalistConfig, InstalledComponentInfo, InstalledComponentManifest } from './types.js';
import { readManifest } from './manifest.js';
import { extractScriptBlocks, resolveAliasPath } from './project.js';
import { logger } from './logger.js';

/** 组件目录扫描的并发上限，避免组件较多时瞬时占用过多文件描述符 */
const SCAN_CONCURRENCY = 8;

/**
 * 以固定并发上限执行异步映射，限制同时运行的任务数。
 * mapper 抛错时置停止标志，阻止后续新任务派发（不保证已领取/进行中的任务中止）。
 */
async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T) => Promise<R>,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let nextIndex = 0;
    let stopped = false;

    async function worker(): Promise<void> {
        while (!stopped) {
            const index = nextIndex;
            nextIndex += 1;
            if (index >= items.length) return;
            results[index] = await mapper(items[index]);
        }
    }

    try {
        await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
    } catch (error) {
        stopped = true;
        throw error;
    }
    return results;
}

async function scanComponentFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(currentDir: string, base: string): Promise<void> {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            const relative = base ? `${base}/${entry.name}` : entry.name;

            if (entry.isDirectory()) {
                // 跳过 node_modules 与以 `.` 开头的隐藏目录（.git/.nuxt 等），
                // 避免把无关文件计入组件文件列表并拖慢扫描
                if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
                    continue;
                }
                await walk(fullPath, relative);
            } else {
                files.push(relative);
            }
        }
    }

    await walk(dir, '');
    return files;
}

/**
 * 用 es-module-lexer 真实解析 import——覆盖 `from 'pkg'`（具名/默认导入）、
 * 副作用导入 `import 'pkg'` 与动态导入 `import('pkg')`，并天然跳过注释、
 * 字符串与正则字面量，避免注释/字符串内的假导入被误采。
 */
async function extractDependencies(componentDir: string): Promise<string[]> {
    const deps = new Set<string>();
    const files = await scanComponentFiles(componentDir);

    for (const file of files) {
        const ext = path.extname(file);
        if (ext !== '.vue' && ext !== '.ts' && ext !== '.js') continue;

        const content = await fs.readFile(path.join(componentDir, file), 'utf-8');
        // .vue 需先提取 <script> 块，模板与 HTML 注释不参与 import 解析
        const scripts = ext === '.vue'
            ? extractScriptBlocks(content).map(block => block.code)
            : [content];

        for (const script of scripts) {
            let imports: readonly ImportSpecifier[];
            try {
                [imports] = parseModuleImports(script);
            } catch (error) {
                // 单个文件解析失败跳过，不阻断整个组件，但记录日志便于定位依赖缺失
                logger.warn(`Failed to parse imports in '${file}': ${error instanceof Error ? error.message : String(error)}`);
                continue;
            }
            for (const imp of imports) {
                collectDependency(deps, imp.n);
            }
        }
    }

    return [...deps].sort();
}

function collectDependency(deps: Set<string>, specifier: string | undefined): void {
    if (!specifier) return;
    // 过滤相对导入（./ ../）与绝对路径导入（/）
    if (specifier.startsWith('.') || specifier.startsWith('/')) return;
    if (specifier.startsWith('@')) {
        const parts = specifier.split('/');
        // 仅将真实的 scoped 包（scope 名长度 > 1）视为依赖，过滤 @/ 等路径别名
        if (parts.length >= 2 && parts[0].length > 1) {
            deps.add(parts.slice(0, 2).join('/'));
        }
    } else {
        deps.add(specifier.split('/')[0]);
    }
}

async function getScannedComponentNames(componentsPath: string): Promise<string[]> {
    if (!await fs.pathExists(componentsPath)) {
        return [];
    }

    const dirs = await fs.readdir(componentsPath, { withFileTypes: true });
    return dirs
        .filter((dir) => dir.isDirectory())
        .map((dir) => dir.name)
        .sort();
}

interface ComponentScanBase {
    name: string;
    files: string[];
    dependencies: string[];
}

/**
 * 合并 manifest 元数据默认值：扫描结果中 manifest 已记录的字段以 manifest 为准，
 * 与 createManifestInfo 共用同一套映射，避免两处维护导致字段漂移。
 */
function withManifestDefaults(
    base: ComponentScanBase,
    manifestEntry: InstalledComponentManifest | undefined,
): InstalledComponentInfo {
    return {
        ...base,
        dependencies: manifestEntry?.dependencies ?? base.dependencies,
        category: manifestEntry?.category,
        examples: manifestEntry?.examples,
        status: manifestEntry?.status,
        replacement: manifestEntry?.replacement,
        registryDependencies: manifestEntry?.registryDependencies,
        registrySource: manifestEntry?.registrySource,
        integrity: manifestEntry?.integrity,
        installedAt: manifestEntry?.installedAt,
        manifestFiles: manifestEntry?.files,
        managed: manifestEntry !== undefined,
    };
}

function createManifestInfo(entry: InstalledComponentManifest): InstalledComponentInfo {
    return {
        ...withManifestDefaults(
            {
                name: entry.name,
                files: entry.files,
                dependencies: entry.dependencies,
            },
            entry,
        ),
        version: entry.version,
    };
}

export async function getInstalledComponentNames(cwd: string, config: BrutalistConfig): Promise<string[]> {
    const manifest = await readManifest(cwd).catch(() => null);
    const manifestNames = Object.keys(manifest?.components ?? {});
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const scannedNames = await getScannedComponentNames(componentsPath);

    return [...new Set([...manifestNames, ...scannedNames])].sort();
}

export async function getInstalledComponentInfos(cwd: string, config: BrutalistConfig): Promise<InstalledComponentInfo[]> {
    const manifest = await readManifest(cwd).catch(() => null);
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const componentNames = await getInstalledComponentNames(cwd, config);

    // 各组件目录扫描相互独立，以受限并发并行执行提升大量组件场景下的性能；
    // 单个组件扫描/读取失败不阻断整体，降级为仅返回 manifest 信息。
    const infos = await mapWithConcurrency(componentNames, SCAN_CONCURRENCY, async (name) => {
        const componentDir = path.join(componentsPath, name);
        const manifestEntry = manifest?.components[name];

        try {
            if (!await fs.pathExists(componentDir)) {
                return manifestEntry ? createManifestInfo(manifestEntry) : null;
            }

            const files = await scanComponentFiles(componentDir);
            const hasVueFile = files.some(f => f.endsWith('.vue'));

            if (files.length === 0 || !hasVueFile) {
                return manifestEntry ? createManifestInfo(manifestEntry) : null;
            }

            const dependencies = await extractDependencies(componentDir);
            return withManifestDefaults(
                { name, files, dependencies },
                manifestEntry,
            );
        } catch (error) {
            // 单个组件扫描失败不应阻断整体，降级为仅返回 manifest 信息，但记录告警便于排查
            logger.warn(`Failed to scan component '${name}': ${error instanceof Error ? error.message : String(error)}`);
            return manifestEntry ? createManifestInfo(manifestEntry) : null;
        }
    });

    return infos
        .filter((info): info is InstalledComponentInfo => info !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
}
