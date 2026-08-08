import fs from 'fs-extra';
import path from 'path';
import { diffLines } from 'diff';
import type {
    BrutalistConfig,
    DiffComponentStatus,
    DiffIntegrityStatus,
    DiffResult,
    FileDiff,
    InstalledComponentManifest,
    RegistryItem,
} from '../types.js';
import { getItemFromSources } from '../registry.js';
import { resolveRegistrySources } from '../registry-source.js';
import { getInstalledComponentNames } from '../installed-components.js';
import { REGISTRY_PATH_PREFIXES } from '../constants.js';
import { isSafePath, resolveAliasPath, resolveImportAlias } from '../project.js';

function normalizeLineEndings(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function matchFileByPath(registryPath: string, localRelativePath: string, componentName: string): boolean {
    const normalizedRegistry = registryPath.replace(/\\/g, '/');
    const normalizedLocal = localRelativePath.replace(/\\/g, '/');

    // 标准布局：components/ui/<componentName>/<rest>，local 侧相对组件目录的路径与 <rest> 对齐
    const dirPrefix = `${REGISTRY_PATH_PREFIXES.components}ui/${componentName}/`;
    if (normalizedRegistry.startsWith(dirPrefix)) {
        return normalizedRegistry.slice(dirPrefix.length) === normalizedLocal;
    }

    // 单文件组件：components/ui/<componentName>.<ext>（如 components/ui/button.ts），
    // local 组件目录下对应同名文件；按文件名比较，避免单文件被误判为 added/removed
    const filePrefix = `${REGISTRY_PATH_PREFIXES.components}ui/${componentName}.`;
    if (normalizedRegistry.startsWith(filePrefix)) {
        return path.basename(normalizedRegistry) === normalizedLocal;
    }

    // 兜底：registry 侧直接以文件名注册（无 components/ui/ 前缀）时与 local 相对路径逐字比较
    return normalizedRegistry === normalizedLocal;
}

function generateUnifiedDiff(
    filePath: string,
    oldContent: string,
    newContent: string
): string {
    const normalizedOld = normalizeLineEndings(oldContent);
    const normalizedNew = normalizeLineEndings(newContent);

    const changes = diffLines(normalizedOld, normalizedNew);
    const diffLines_: string[] = [];
    diffLines_.push(`--- registry/${filePath}`);
    diffLines_.push(`+++ local/${filePath}`);

    for (const part of changes) {
        const lines = part.value.split('\n').filter((line, i, arr) => !(i === arr.length - 1 && line === ''));
        for (const line of lines) {
            if (part.added) {
                diffLines_.push(`+${line}`);
            } else if (part.removed) {
                diffLines_.push(`-${line}`);
            } else {
                diffLines_.push(` ${line}`);
            }
        }
    }

    return diffLines_.join('\n');
}

export async function getInstalledComponents(cwd: string, config: BrutalistConfig): Promise<string[]> {
    return getInstalledComponentNames(cwd, config);
}

async function getLocalComponentFiles(
    cwd: string,
    config: BrutalistConfig,
    componentName: string
): Promise<Array<{ relativePath: string; absolutePath: string }>> {
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const componentPath = path.join(componentsPath, componentName);

    // componentName 来自命令行/调用方，可能含 ../ 或绝对路径：静态校验组件目录边界
    //（resolve 后必须仍位于 componentsPath 内），isSafePath 再解符号链接确认不越出项目
    const normalize = process.platform === 'win32'
        ? (s: string) => s.toLowerCase()
        : (s: string) => s;
    const resolvedComponents = normalize(path.resolve(componentsPath));
    const resolvedComponent = normalize(path.resolve(componentPath));
    const withinComponents = resolvedComponent === resolvedComponents
        || resolvedComponent.startsWith(resolvedComponents + path.sep);
    if (!withinComponents) {
        // ../ 等字面穿越：静态解析即越出组件目录
        throw new Error(`Security Error: Component path "${componentPath}" is outside the components directory "${componentsPath}".`);
    }
    if (!(await isSafePath(componentPath, cwd))) {
        // 静态路径在目录内但 realpath 解链后越出项目：符号链接攻击
        throw new Error(`Security Error: Component path "${componentPath}" resolves outside the project directory "${cwd}" (possible symlink attack).`);
    }

    if (!await fs.pathExists(componentPath)) {
        return [];
    }

    const files: Array<{ relativePath: string; absolutePath: string }> = [];

    async function walkDir(dir: string, relativeBase: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(relativeBase, entry.name);

            if (entry.isDirectory()) {
                await walkDir(fullPath, relativePath);
            } else {
                files.push({ relativePath, absolutePath: fullPath });
            }
        }
    }

    await walkDir(componentPath, '');
    return files;
}

function getIntegrityMetadata(
    registryItem: RegistryItem | null,
    manifestEntry?: InstalledComponentManifest
): Pick<DiffResult, 'installedIntegrity' | 'latestIntegrity' | 'integrityStatus' | 'registrySource' | 'installedAt'> {
    const installedIntegrity = manifestEntry?.integrity;
    const latestIntegrity = typeof registryItem?.integrity === 'string'
        ? registryItem.integrity
        : undefined;

    // 非空字符串双方齐全才比较；空字符串（缺失信号）归入 unknown，避免 truthiness 误判
    let integrityStatus: DiffIntegrityStatus = 'unknown';
    if (typeof installedIntegrity === 'string' && installedIntegrity.length > 0
        && typeof latestIntegrity === 'string' && latestIntegrity.length > 0) {
        integrityStatus = installedIntegrity === latestIntegrity ? 'current' : 'outdated';
    }

    return {
        installedIntegrity,
        latestIntegrity,
        integrityStatus,
        registrySource: manifestEntry?.registrySource,
        installedAt: manifestEntry?.installedAt,
    };
}

export async function diffComponent(
    cwd: string,
    config: BrutalistConfig,
    componentName: string,
    registryOverride?: string,
    manifestEntry?: InstalledComponentManifest,
    useCache: boolean = true
): Promise<DiffResult> {
    let registryItem: RegistryItem | null;
    let registryError: Error | null = null;

    const sources = resolveRegistrySources(config, registryOverride);
    try {
        const { item } = await getItemFromSources(componentName, sources, useCache);
        registryItem = item;
    } catch (error) {
        registryItem = null;
        registryError = error instanceof Error ? error : new Error(String(error));
    }

    if (!registryItem) {
        const localFiles = await getLocalComponentFiles(cwd, config, componentName);
        // 三种互斥状态：registry 不可达 > 本地有文件 > 未安装
        let status: DiffComponentStatus;
        if (registryError) {
            status = 'registry-unreachable';
        } else if (localFiles.length > 0) {
            status = 'local-only';
        } else {
            status = 'not-installed';
        }
        return {
            component: componentName,
            status,
            files: [],
            registryError: registryError?.message,
            ...getIntegrityMetadata(registryItem, manifestEntry),
        };
    }

    const localFiles = await getLocalComponentFiles(cwd, config, componentName);
    const fileDiffs: FileDiff[] = [];

    for (const registryFile of registryItem.files) {
        const localFile = localFiles.find((f) => matchFileByPath(registryFile.path, f.relativePath, componentName));

        // 语义说明：status 是"以 registry 为基准的同步视角"——registry 有而本地缺失的文件
        // 标记为 added（本地需要新增），与下方 patch 方向（old=registry, new=local）相反；
        // path 使用 registry 路径（相对 cwd，如 components/ui/button/index.ts）。
        if (!localFile) {
            fileDiffs.push({
                path: registryFile.path,
                status: 'added',
            });
            continue;
        }

        // 文件本已来自 readdir 结果，无需 pathExists 预检（其与 readFile 之间存在 TOCTOU
        // 窗口）；读取失败时仅将 ENOENT 降级为 added，其他错误上抛
        let localContent: string;
        try {
            localContent = await fs.readFile(localFile.absolutePath, 'utf-8');
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
                fileDiffs.push({
                    path: registryFile.path,
                    status: 'added',
                });
                continue;
            }
            throw error;
        }
        const normalizedRegistryContent = resolveImportAlias(registryFile.content, config);

        if (normalizeLineEndings(localContent) === normalizeLineEndings(normalizedRegistryContent)) {
            fileDiffs.push({
                path: registryFile.path,
                status: 'unchanged',
            });
        } else {
            fileDiffs.push({
                path: registryFile.path,
                status: 'modified',
                patch: generateUnifiedDiff(
                    registryFile.path,
                    normalizedRegistryContent,
                    localContent
                ),
            });
        }
    }

    for (const localFile of localFiles) {
        const isInRegistry = registryItem.files.some((f) => matchFileByPath(f.path, localFile.relativePath, componentName));

        if (!isInRegistry) {
            // 本地多余文件：registry 中无对应物，path 使用相对组件目录的路径（如 local-only.ts），
            // 与其他状态（registry 路径，相对 cwd）基准不同——这是有意的：该文件仅存在于本地，
            // 无法表达为 registry 路径；消费方如需按 path 关联需自行区分
            fileDiffs.push({
                path: localFile.relativePath,
                status: 'removed',
            });
        }
    }

    const hasChanges = fileDiffs.some((f) => f.status !== 'unchanged');

    return {
        component: componentName,
        status: hasChanges ? 'modified' : 'up-to-date',
        files: fileDiffs,
        ...getIntegrityMetadata(registryItem, manifestEntry),
    };
}

export async function diffComponents(
    cwd: string,
    config: BrutalistConfig,
    componentNames: string[],
    getRegistrySource: (componentName: string) => string | undefined,
    getManifestEntry: (componentName: string) => InstalledComponentManifest | undefined,
    useCache: boolean = true
): Promise<DiffResult[]> {
    return Promise.all(
        componentNames.map(component => diffComponent(
            cwd,
            config,
            component,
            getRegistrySource(component),
            getManifestEntry(component),
            useCache,
        ))
    );
}
