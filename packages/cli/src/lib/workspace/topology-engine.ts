import path from 'node:path';
import type { FileSystemAdapter } from '../fs/index.js';
import type { WorkspaceTopology, WorkspacePackageInfo, PackageManager } from '../types.js';

interface TopologyCacheEntry {
    topology: WorkspaceTopology;
    mtimeMs: number;
}

const topologyCache = new Map<string, TopologyCacheEntry>();

export class WorkspaceTopologyEngine {
    /**
     * 清理拓扑缓存（主要用于测试）
     */
    static clearCache(): void {
        topologyCache.clear();
    }

    /**
     * 从当前工作目录向上扫描并构建完备的工作区拓扑图（带轻量 mtime 缓存）
     */
    static async resolveTopology(
        cwd: string,
        fsAdapter: FileSystemAdapter
    ): Promise<WorkspaceTopology> {
        const resolvedCwd = path.resolve(cwd);
        const workspaceRoot = await WorkspaceTopologyEngine.findWorkspaceRoot(resolvedCwd, fsAdapter);
        if (!workspaceRoot) {
            return {
                isMonorepo: false,
                workspaceRoot: resolvedCwd,
                packageManager: await WorkspaceTopologyEngine.detectPackageManager(resolvedCwd, fsAdapter),
                packages: new Map(),
            };
        }

        const normalizedRoot = path.resolve(workspaceRoot);
        const cacheKey = normalizedRoot;
        const rootStat = await fsAdapter.stat(normalizedRoot).catch(() => null);
        const currentMtime = rootStat?.mtimeMs ?? 0;
        const cached = topologyCache.get(cacheKey);

        if (cached && cached.mtimeMs === currentMtime) {
            return cached.topology;
        }

        const packageManager = await WorkspaceTopologyEngine.detectPackageManager(normalizedRoot, fsAdapter);
        const packageGlobs = await WorkspaceTopologyEngine.getWorkspaceGlobs(normalizedRoot, packageManager, fsAdapter);
        const packageInfos = await WorkspaceTopologyEngine.scanPackages(normalizedRoot, packageGlobs, fsAdapter);

        const packagesMap = new Map<string, WorkspacePackageInfo>();
        let sharedUiPackage: WorkspacePackageInfo | undefined;
        let sharedUtilsPackage: WorkspacePackageInfo | undefined;

        for (const pkg of packageInfos) {
            packagesMap.set(pkg.name, pkg);
            packagesMap.set(pkg.relativeDir, pkg);
            packagesMap.set(pkg.rootDir, pkg);

            if (pkg.role === 'shared-ui' && !sharedUiPackage) {
                sharedUiPackage = pkg;
            }
            if (pkg.role === 'shared-utils' && !sharedUtilsPackage) {
                sharedUtilsPackage = pkg;
            }
        }

        const topology: WorkspaceTopology = {
            isMonorepo: true,
            workspaceRoot: normalizedRoot,
            packageManager,
            packages: packagesMap,
            sharedUiPackage,
            sharedUtilsPackage,
        };

        topologyCache.set(cacheKey, { topology, mtimeMs: currentMtime });
        return topology;
    }

    /**
     * 判定子包的角色（Role Detection）
     */
    static inferPackageRole(pkgJson: Record<string, unknown>, relativePath: string): WorkspacePackageInfo['role'] {
        const name = String(pkgJson['name'] ?? '').toLowerCase();
        const posixRel = relativePath.replace(/\\/g, '/').toLowerCase();

        if (posixRel.includes('packages/ui') || posixRel.includes('packages/components') || name.endsWith('/ui') || name.endsWith('-ui')) {
            return 'shared-ui';
        }
        if (posixRel.includes('packages/utils') || posixRel.includes('packages/shared') || name.endsWith('/utils') || name.endsWith('/shared')) {
            return 'shared-utils';
        }
        if (posixRel.startsWith('apps/') || name.includes('app') || name.includes('web') || name.includes('admin') || name.includes('docs')) {
            return 'app';
        }
        return 'unknown';
    }

    static async findWorkspaceRoot(cwd: string, fsAdapter: FileSystemAdapter): Promise<string | null> {
        let current = path.resolve(cwd);
        const root = path.parse(current).root;

        while (current !== root) {
            const pnpmWorkspacePath = path.join(current, 'pnpm-workspace.yaml');
            if (await fsAdapter.pathExists(pnpmWorkspacePath)) {
                try {
                    const content = await fsAdapter.readFile(pnpmWorkspacePath, 'utf-8');
                    if (/^\s*packages:\s*$/m.test(content)) {
                        return current;
                    }
                } catch {
                    return current;
                }
            }
            if (await fsAdapter.pathExists(path.join(current, 'lerna.json'))) return current;
            if (await fsAdapter.pathExists(path.join(current, 'turbo.json'))) return current;

            const pkgPath = path.join(current, 'package.json');
            if (await fsAdapter.pathExists(pkgPath)) {
                try {
                    const pkg = await fsAdapter.readJson<Record<string, unknown>>(pkgPath);
                    if (pkg['workspaces']) return current;
                } catch { /* 忽略格式错误 */ }
            }

            const parent = path.dirname(current);
            if (parent === current) break;
            current = parent;
        }
        return null;
    }

    static async detectPackageManager(cwd: string, fsAdapter: FileSystemAdapter): Promise<PackageManager> {
        if (await fsAdapter.pathExists(path.join(cwd, 'pnpm-workspace.yaml')) || await fsAdapter.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
            return 'pnpm';
        }
        if (await fsAdapter.pathExists(path.join(cwd, 'yarn.lock'))) return 'yarn';
        if (await fsAdapter.pathExists(path.join(cwd, 'bun.lockb')) || await fsAdapter.pathExists(path.join(cwd, 'bun.lock'))) return 'bun';
        return 'npm';
    }

    static async getWorkspaceGlobs(workspaceRoot: string, _pm: PackageManager, fsAdapter: FileSystemAdapter): Promise<string[]> {
        const pnpmYamlPath = path.join(workspaceRoot, 'pnpm-workspace.yaml');
        let hasPnpmWorkspace = false;
        if (await fsAdapter.pathExists(pnpmYamlPath)) {
            hasPnpmWorkspace = true;
            const content = await fsAdapter.readFile(pnpmYamlPath, 'utf-8');
            const lines = content.split(/\r?\n/);
            const globs: string[] = [];
            let inPackages = false;
            for (const line of lines) {
                if (/^\s*packages:\s*$/.test(line)) {
                    inPackages = true;
                    continue;
                }
                if (inPackages) {
                    const lineWithoutComment = line.replace(/#.*$/, '').trim();
                    if (/^-\s+/.test(lineWithoutComment)) {
                        const clean = lineWithoutComment.replace(/^-\s+['"]?/, '').replace(/['"]?\s*$/, '').trim();
                        if (clean) globs.push(clean);
                    } else if (lineWithoutComment.length > 0 && /^\S/.test(lineWithoutComment)) {
                        inPackages = false;
                    }
                }
            }
            if (globs.length > 0) return globs;
        }

        const rootPkgPath = path.join(workspaceRoot, 'package.json');
        if (await fsAdapter.pathExists(rootPkgPath)) {
            try {
                const rootPkg = await fsAdapter.readJson<{ workspaces?: string[] | { packages?: string[] } }>(rootPkgPath);
                if (Array.isArray(rootPkg.workspaces)) return rootPkg.workspaces;
                if (Array.isArray(rootPkg.workspaces?.packages)) return rootPkg.workspaces.packages;
            } catch { /* 忽略解析错误 */ }
        }

        if (hasPnpmWorkspace) {
            return [];
        }

        return ['packages/*', 'apps/*'];
    }

    static async scanPackages(
        workspaceRoot: string,
        globs: string[],
        fsAdapter: FileSystemAdapter
    ): Promise<WorkspacePackageInfo[]> {
        const results: WorkspacePackageInfo[] = [];
        const visitedDirs = new Set<string>();

        const inspectAndAdd = async (subPkgDir: string): Promise<void> => {
            const resolvedPath = path.resolve(subPkgDir);
            if (visitedDirs.has(resolvedPath)) return;
            visitedDirs.add(resolvedPath);

            const pkgJsonPath = path.join(subPkgDir, 'package.json');
            if (await fsAdapter.pathExists(pkgJsonPath)) {
                try {
                    const pkgJson = await fsAdapter.readJson<Record<string, unknown>>(pkgJsonPath);
                    const relDir = path.relative(workspaceRoot, subPkgDir).replace(/\\/g, '/');
                    const hasComponentsConfig = await fsAdapter.pathExists(path.join(subPkgDir, 'components.json'));
                    results.push({
                        name: String(pkgJson['name'] ?? path.basename(subPkgDir)),
                        rootDir: resolvedPath,
                        relativeDir: relDir,
                        isRoot: false,
                        role: WorkspaceTopologyEngine.inferPackageRole(pkgJson, relDir),
                        hasComponentsConfig,
                        packageJson: pkgJson,
                    });
                } catch { /* 忽略损坏的 package.json */ }
            }
        };

        for (const pattern of globs) {
            const cleanPattern = pattern.replace(/^['"]/, '').replace(/['"]$/, '').replace(/\\/g, '/');
            if (cleanPattern.endsWith('/*')) {
                const baseDir = path.join(workspaceRoot, cleanPattern.replace(/\/\*$/, ''));
                if (!await fsAdapter.pathExists(baseDir)) continue;
                const entries = await fsAdapter.readdir(baseDir);
                for (const entry of entries) {
                    await inspectAndAdd(path.join(baseDir, entry));
                }
            } else {
                const targetDir = path.join(workspaceRoot, cleanPattern);
                if (await fsAdapter.pathExists(targetDir)) {
                    await inspectAndAdd(targetDir);
                }
            }
        }
        return results;
    }
}
