import path from 'path';
import type { InstalledComponentManifest, RegistrySourceStatus } from '../../types.js';
import type { CheckResult, DiagnosticContext, DiagnosticRepairContext, DiagnosticRule, RuleFixResult } from '../types.js';
import { FixId } from '../types.js';
import type { FileSystemAdapter } from '../../fs/file-system-adapter.js';
import {
    auditLogExists,
    computeInstalledContentHash,
    countAuditEntries,
    getCacheStats,
    getItem,
    getRecentFailures,
    resolveImportAlias,
    resolveRegistrySources,
} from '../../index.js';

const ORPHAN_EXTENSIONS = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx']);
const AUDIT_FAILURE_REPORT_LIMIT = 5;

export async function findOrphanFilesInVfs(
    cwd: string,
    entry: InstalledComponentManifest,
    fsAdapter: FileSystemAdapter
): Promise<string[]> {
    const orphans: string[] = [];
    if (entry.files.length === 0) return orphans;

    const manifestAbsSet = new Set(entry.files.map((f: string) => path.resolve(cwd, f)));
    const directories = new Set<string>();
    for (const relFile of entry.files) {
        let dir = path.dirname(path.resolve(cwd, relFile));
        while (dir !== cwd && path.dirname(dir) !== dir) {
            directories.add(dir);
            dir = path.dirname(dir);
        }
    }

    const dirResults = await Promise.all(
        Array.from(directories).map(async (dir) => {
            const dirOrphans: string[] = [];
            if (!(await fsAdapter.pathExists(dir))) return dirOrphans;
            const entries = await fsAdapter.readdir(dir, { withFileTypes: true });
            for (const e of entries) {
                if (!e.isFile()) continue;
                const ext = path.extname(e.name).toLowerCase();
                if (!ORPHAN_EXTENSIONS.has(ext)) continue;
                const absPath = path.join(dir, e.name);
                if (!manifestAbsSet.has(absPath)) {
                    dirOrphans.push(path.relative(cwd, absPath).split(path.sep).join('/'));
                }
            }
            return dirOrphans;
        })
    );

    return dirResults.flat();
}

export async function restoreComponentFromRegistry(
    ctx: DiagnosticRepairContext,
    componentName: string
): Promise<RuleFixResult> {
    const entry = ctx.manifest?.components[componentName];
    if (!entry) {
        return {
            status: 'failed',
            message: `Manifest entry not found for "${componentName}".`,
        };
    }

    try {
        const item = await getItem(componentName, entry.registrySource, true);
        if (entry.files.length !== item.files.length) {
            return {
                status: 'failed',
                message: `File count mismatch for ${componentName} (manifest: ${entry.files.length}, registry: ${item.files.length}). Run update manually.`,
            };
        }

        for (let i = 0; i < item.files.length; i++) {
            const targetPath = path.resolve(ctx.cwd, entry.files[i]);
            const resolvedContent = resolveImportAlias(item.files[i].content, ctx.config!);
            await ctx.transaction.writeFile(targetPath, resolvedContent);
        }

        return {
            status: 'applied',
            message: `Restored ${componentName} from registry.`,
        };
    } catch (error) {
        return {
            status: 'failed',
            message: `Could not restore ${componentName} from registry: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

async function collectComponentDirs(componentsPath: string, fsAdapter: FileSystemAdapter): Promise<string[]> {
    if (!(await fsAdapter.pathExists(componentsPath))) return [];
    const entries = await fsAdapter.readdir(componentsPath, { withFileTypes: true });
    const dirs: string[] = [];
    for (const e of entries) {
        if (e.isDirectory()) {
            dirs.push(path.join(componentsPath, e.name));
        }
    }
    return dirs;
}

async function checkComponentIntegrityLegacy(ctx: DiagnosticContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    if (!ctx.config) return results;
    const componentsPath = await ctx.projectContext.resolveComponentsDir();

    if (!(await ctx.fs.pathExists(componentsPath))) {
        return results;
    }

    try {
        const componentDirs = await collectComponentDirs(componentsPath, ctx.fs);
        for (const componentPath of componentDirs) {
            const entries = await ctx.fs.readdir(componentPath, { withFileTypes: true });
            const fileCount = entries.filter(e => e.isFile()).length;
            const hasFiles = fileCount > 0;
            const componentName = path.relative(componentsPath, componentPath).split(path.sep).join('/');

            results.push({
                ruleId: 'integrity.manifest-files',
                category: 'integrity',
                name: `component ${componentName}`,
                status: hasFiles ? 'pass' : 'warn',
                message: hasFiles
                    ? `${fileCount} files found. (legacy scan)`
                    : 'Component directory is empty. (legacy scan)',
            });
        }
    } catch {
        // Ignore read errors
    }

    return results;
}

export const integrityManifestFilesRule: DiagnosticRule = {
    id: 'integrity.manifest-files',
    category: 'integrity',
    name: 'component manifest files present',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult[]> {
        if (!ctx.manifest || Object.keys(ctx.manifest.components).length === 0) {
            return await checkComponentIntegrityLegacy(ctx);
        }

        const results: CheckResult[] = [];
        for (const [componentName, entry] of Object.entries(ctx.manifest.components)) {
            const missingFiles: string[] = [];
            for (const relativeFile of entry.files) {
                const absPath = path.resolve(ctx.cwd, relativeFile);
                if (!(await ctx.fs.pathExists(absPath))) {
                    missingFiles.push(relativeFile);
                }
            }

            if (missingFiles.length > 0) {
                results.push({
                    ruleId: 'integrity.manifest-files',
                    category: 'integrity',
                    name: `component ${componentName} files present`,
                    status: 'error',
                    message: `Missing ${missingFiles.length} file(s) recorded in manifest: ${missingFiles.join(', ')}`,
                    fixId: FixId.RestoreIntegrity,
                    fixDescription: `Run \`brutx-vue update ${componentName}\` to restore missing files`,
                    componentName,
                });
            } else if (entry.files.length > 0) {
                results.push({
                    ruleId: 'integrity.manifest-files',
                    category: 'integrity',
                    name: `component ${componentName} files present`,
                    status: 'pass',
                    message: `All ${entry.files.length} manifest file(s) exist on disk.`,
                    componentName,
                });
            }
        }

        return results;
    },
    async fix(ctx: DiagnosticRepairContext, result: CheckResult): Promise<RuleFixResult> {
        if (!result.componentName) {
            return { status: 'skipped', message: 'No component name specified.' };
        }
        return await restoreComponentFromRegistry(ctx, result.componentName);
    },
};

export const integrityOrphansRule: DiagnosticRule = {
    id: 'integrity.orphans',
    category: 'integrity',
    name: 'component no orphans',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult[]> {
        if (!ctx.manifest || Object.keys(ctx.manifest.components).length === 0) {
            return [];
        }

        const results: CheckResult[] = [];
        for (const [componentName, entry] of Object.entries(ctx.manifest.components)) {
            const orphans = await findOrphanFilesInVfs(ctx.cwd, entry, ctx.fs);
            if (orphans.length > 0) {
                results.push({
                    ruleId: 'integrity.orphans',
                    category: 'integrity',
                    name: `component ${componentName} no orphans`,
                    status: 'warn',
                    message: `Found ${orphans.length} orphan file(s) not recorded in manifest: ${orphans.join(', ')}`,
                    fixId: FixId.RemoveOrphans,
                    fixDescription: 'Remove orphan files or add them to manifest via reinstall',
                    componentName,
                });
            } else if (entry.files.length > 0) {
                results.push({
                    ruleId: 'integrity.orphans',
                    category: 'integrity',
                    name: `component ${componentName} no orphans`,
                    status: 'pass',
                    message: 'No orphan files detected in component directory.',
                    componentName,
                });
            }
        }

        return results;
    },
    async fix(ctx: DiagnosticRepairContext, result: CheckResult): Promise<RuleFixResult> {
        if (!result.componentName) {
            return { status: 'skipped', message: 'No component name specified.' };
        }
        const entry = ctx.manifest?.components[result.componentName];
        if (!entry) {
            return { status: 'failed', message: `Component "${result.componentName}" not found in manifest.` };
        }

        const orphans = await findOrphanFilesInVfs(ctx.cwd, entry, ctx.fs);
        await Promise.all(
            orphans.map(async (orphan) => {
                const absPath = path.resolve(ctx.cwd, orphan);
                await ctx.transaction.remove(absPath);
            })
        );

        return {
            status: 'applied',
            message: `Removed ${orphans.length} orphan file(s) for ${result.componentName}.`,
        };
    },
};

export const integrityHashDriftRule: DiagnosticRule = {
    id: 'integrity.hash-drift',
    category: 'integrity',
    name: 'component hash drift',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult[]> {
        if (!ctx.manifest || Object.keys(ctx.manifest.components).length === 0) {
            return [];
        }

        const results: CheckResult[] = [];
        for (const [componentName, entry] of Object.entries(ctx.manifest.components)) {
            if (!entry.installedContentHash) {
                results.push({
                    ruleId: 'integrity.hash-drift',
                    category: 'integrity',
                    name: `component ${componentName} integrity`,
                    status: 'warn',
                    message: 'No installedContentHash recorded (pre-P0-1 manifest). Run update to enable drift detection.',
                    componentName,
                });
                continue;
            }

            if (entry.files.length === 0) continue;

            try {
                const absFiles = entry.files.map(f => path.resolve(ctx.cwd, f));
                const currentHash = await computeInstalledContentHash(absFiles, ctx.fs);
                if (currentHash !== entry.installedContentHash) {
                    results.push({
                        ruleId: 'integrity.hash-drift',
                        category: 'integrity',
                        name: `component ${componentName} integrity`,
                        status: 'warn',
                        message: `Integrity drift detected — component files have been modified since install. Run \`brutx-vue update ${componentName}\` to restore.`,
                        fixId: FixId.RestoreIntegrity,
                        fixDescription: `Restore ${componentName} from registry`,
                        componentName,
                    });
                } else {
                    results.push({
                        ruleId: 'integrity.hash-drift',
                        category: 'integrity',
                        name: `component ${componentName} integrity`,
                        status: 'pass',
                        message: 'Component files match installed snapshot.',
                        componentName,
                    });
                }
            } catch {
                // If files are missing, integrity.manifest-files handles it
            }
        }

        return results;
    },
    async fix(ctx: DiagnosticRepairContext, result: CheckResult): Promise<RuleFixResult> {
        if (!result.componentName) {
            return { status: 'skipped', message: 'No component name specified.' };
        }
        return await restoreComponentFromRegistry(ctx, result.componentName);
    },
};

export const integrityRegistryDepsRule: DiagnosticRule = {
    id: 'integrity.registry-deps',
    category: 'integrity',
    name: 'component registry dependencies closed',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult[]> {
        if (!ctx.manifest || Object.keys(ctx.manifest.components).length === 0) {
            return [];
        }

        const results: CheckResult[] = [];
        const manifestComponentNames = new Set(Object.keys(ctx.manifest.components));

        for (const [componentName, entry] of Object.entries(ctx.manifest.components)) {
            if (entry.registryDependencies.length === 0) continue;

            const missingDeps = entry.registryDependencies.filter(dep => !manifestComponentNames.has(dep));
            if (missingDeps.length > 0) {
                results.push({
                    ruleId: 'integrity.registry-deps',
                    category: 'integrity',
                    name: `component ${componentName} registry deps closed`,
                    status: 'warn',
                    message: `Registry dependency ${missingDeps.map(d => `'${d}'`).join(', ')} not installed. Run \`brutx-vue add ${missingDeps[0]}\` to install.`,
                    componentName,
                });
            } else {
                results.push({
                    ruleId: 'integrity.registry-deps',
                    category: 'integrity',
                    name: `component ${componentName} registry deps closed`,
                    status: 'pass',
                    message: `All ${entry.registryDependencies.length} registry dependency(ies) installed.`,
                    componentName,
                });
            }
        }

        return results;
    },
};

async function probeHttpSource(source: string): Promise<RegistrySourceStatus> {
    const probeUrl = `${source}/registry-manifest.json`;
    const start = Date.now();
    try {
        const res = await fetch(probeUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(10000),
        });
        const latencyMs = Date.now() - start;
        return {
            url: source,
            reachable: res.ok,
            latencyMs,
            error: res.ok ? undefined : `HTTP ${res.status} ${res.statusText}`,
        };
    } catch (error) {
        const latencyMs = Date.now() - start;
        return {
            url: source,
            reachable: false,
            latencyMs,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export const integrityRegistryReachabilityRule: DiagnosticRule = {
    id: 'integrity.registry-reachability',
    category: 'integrity',
    name: 'registry reachability',
    requiresConfig: true,
    network: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult[]> {
        const sources = resolveRegistrySources(ctx.config!);
        const results: CheckResult[] = [];

        if (ctx.offline) {
            for (const source of sources) {
                results.push({
                    ruleId: 'integrity.registry-reachability',
                    category: 'integrity',
                    name: `registry source ${source}`,
                    status: 'pass',
                    message: 'Configured (offline mode, reachability check skipped).',
                });
            }
            return results;
        }

        for (const source of sources) {
            if (!source.startsWith('http://') && !source.startsWith('https://')) {
                const exists = await ctx.fs.pathExists(source);
                results.push({
                    ruleId: 'integrity.registry-reachability',
                    category: 'integrity',
                    name: `registry source ${source}`,
                    status: exists ? 'pass' : 'error',
                    message: exists
                        ? 'Local registry directory exists.'
                        : `Local registry path does not exist: ${source}`,
                });
                continue;
            }

            const status = await probeHttpSource(source);
            results.push({
                ruleId: 'integrity.registry-reachability',
                category: 'integrity',
                name: `registry source ${source}`,
                status: status.reachable ? 'pass' : 'warn',
                message: status.reachable
                    ? `Reachable${status.latencyMs !== undefined ? ` (${status.latencyMs}ms)` : ''}.`
                    : `Unreachable: ${status.error ?? 'unknown error'}`,
            });
        }

        return results;
    },
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const integrityCacheHealthRule: DiagnosticRule = {
    id: 'integrity.cache-health',
    category: 'integrity',
    name: 'registry cache',
    requiresConfig: true,
    async check(): Promise<CheckResult[]> {
        try {
            const stats = await getCacheStats();
            const sizeLabel = formatBytes(stats.totalBytes);
            return [{
                ruleId: 'integrity.cache-health',
                category: 'integrity',
                name: 'registry cache',
                status: stats.entryCount > 0 ? 'pass' : 'warn',
                message: stats.entryCount > 0
                    ? `${stats.entryCount} cached entr${stats.entryCount !== 1 ? 'ies' : 'y'}, ${sizeLabel} (${stats.dir}). Offline-available for cached components.`
                    : 'Empty cache. Running add online will populate it for offline use.',
            }];
        } catch {
            return [];
        }
    },
};

export const integrityAuditLogRule: DiagnosticRule = {
    id: 'integrity.audit-log',
    category: 'integrity',
    name: 'audit log health',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult[]> {
        if (!(await auditLogExists(ctx.cwd))) {
            return [];
        }

        try {
            const total = await countAuditEntries(ctx.cwd);
            const failures = await getRecentFailures(ctx.cwd, AUDIT_FAILURE_REPORT_LIMIT);

            if (failures.length === 0) {
                return [{
                    ruleId: 'integrity.audit-log',
                    category: 'integrity',
                    name: 'audit log health',
                    status: 'pass',
                    message: `No failures in ${total} audit log entr${total !== 1 ? 'ies' : 'y'}.`,
                }];
            }

            const latestFailure = failures[failures.length - 1];
            const failureSummary = failures.map(f => `${f.command}(${f.components.join(',')})`).join(', ');
            return [{
                ruleId: 'integrity.audit-log',
                category: 'integrity',
                name: 'audit log health',
                status: 'warn',
                message: `${failures.length} recent failure(s) in audit log: ${failureSummary}. Latest: ${latestFailure.command} failed at ${latestFailure.timestamp}${latestFailure.error ? ` — ${latestFailure.error}` : ''}`,
            }];
        } catch {
            return [];
        }
    },
};

export const integrityRules: DiagnosticRule[] = [
    integrityManifestFilesRule,
    integrityOrphansRule,
    integrityHashDriftRule,
    integrityRegistryDepsRule,
    integrityRegistryReachabilityRule,
    integrityCacheHealthRule,
    integrityAuditLogRule,
];
