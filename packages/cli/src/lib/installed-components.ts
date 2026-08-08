import fs from 'fs-extra';
import path from 'path';
import type { BrutalistConfig, InstalledComponentInfo, InstalledComponentManifest } from './types.js';
import { readManifest } from './manifest.js';
import { resolveAliasPath } from './project.js';

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

async function extractDependencies(componentDir: string): Promise<string[]> {
    const deps = new Set<string>();
    const files = await scanComponentFiles(componentDir);

    for (const file of files) {
        const ext = path.extname(file);
        if (ext !== '.vue' && ext !== '.ts' && ext !== '.js') continue;

        const content = await fs.readFile(path.join(componentDir, file), 'utf-8');
        // 同时覆盖 `from 'pkg'`（具名/默认导入）、`import 'pkg'`（副作用导入）
        // 与 `import('pkg')`（动态导入），避免漏采依赖
        const importRegex = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"./][^'"]*)['"]/g;
        let match: RegExpExecArray | null;

        while ((match = importRegex.exec(content)) !== null) {
            const pkg = match[1];
            if (pkg.startsWith('@')) {
                const parts = pkg.split('/');
                // 仅将真实的 scoped 包（scope 名长度 > 1）视为依赖，过滤 @/ 等路径别名
                if (parts.length >= 2 && parts[0].length > 1) {
                    deps.add(parts.slice(0, 2).join('/'));
                }
            } else {
                deps.add(pkg.split('/')[0]);
            }
        }
    }

    return [...deps].sort();
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
    fileCount: number;
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
        installedIntegrity: manifestEntry?.integrity,
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
                fileCount: entry.files.length,
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

    // 各组件目录扫描相互独立，并行执行提升大量组件场景下的性能；
    // 单个组件扫描/读取失败不阻断整体，降级为仅返回 manifest 信息。
    const infos = await Promise.all(
        componentNames.map(async (name): Promise<InstalledComponentInfo | null> => {
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
                    { name, files, fileCount: files.length, dependencies },
                    manifestEntry,
                );
            } catch {
                // 单个组件扫描失败不应阻断整体，降级为仅返回 manifest 信息
                return manifestEntry ? createManifestInfo(manifestEntry) : null;
            }
        }),
    );

    return infos
        .filter((info): info is InstalledComponentInfo => info !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
}
