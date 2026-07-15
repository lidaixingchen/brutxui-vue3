import { confirm } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import type { BrutalistConfig, CheckResult, DoctorOptions, BrutxManifest, InstalledComponentManifest, RegistrySourceStatus } from '../lib/types.js';
import { FixId } from '../lib/types.js';
import { readConfigSafe, CliError, FileTransaction, detectWorkspaceRoot, readManifest, computeInstalledContentHash, resolveRegistrySources, isOfflineRequested, withOfflineScope, getRecentFailures, auditLogExists, countAuditEntries } from '../lib/index.js';
import { resolveAliasPath } from '../lib/project.js';
import { SCHEMA_URL, BASE_DEPENDENCIES, getBrutalistCssStyles, UTILS_TEMPLATE, CN_FUNCTION_TEMPLATE, CURRENT_CONFIG_VERSION, CONFIG_FILES } from '../lib/constants.js';
import { logger } from '../lib/logger.js';

const UTILS_EXTENSIONS = ['.ts', '.js', '.mts', '.mjs'] as const;
const MIN_NODE_VERSION = '22.5.0';

async function resolveUtilsPath(config: BrutalistConfig, cwd: string): Promise<string> {
    if (config.sharedBase) {
        return path.join(await resolveAliasPath(config.sharedBase, cwd), 'utils');
    }
    return await resolveAliasPath(config.aliases.utils, cwd);
}

function getUtilsDisplayName(config: BrutalistConfig): string {
    return config.sharedBase
        ? `sharedBase/utils (${config.sharedBase}/utils)`
        : `aliases.utils → ${config.aliases.utils}`;
}

function isNodeVersionSupported(version: string): boolean {
    const cleanVersion = version.split('-')[0];
    const [major = 0, minor = 0, patch = 0] = cleanVersion.split('.').map(Number);
    const [minMajor, minMinor, minPatch] = MIN_NODE_VERSION.split('.').map(Number);

    if (major !== minMajor) return major > minMajor;
    if (minor !== minMinor) return minor > minMinor;
    return patch >= minPatch;
}

function checkNodeVersion(): CheckResult {
    const version = process.versions.node;
    if (!isNodeVersionSupported(version)) {
        return {
            name: 'Node.js version',
            status: 'error',
            message: `Node.js ${version} is unsupported. brutx-vue requires Node.js >=${MIN_NODE_VERSION}.`,
        };
    }

    return {
        name: 'Node.js version',
        status: 'pass',
        message: `Node.js ${version} satisfies >=${MIN_NODE_VERSION}.`,
    };
}

function checkConfigExists(cwd: string, config: BrutalistConfig | null): CheckResult {
    if (!config) {
        return {
            name: 'components.json exists',
            status: 'error',
            message: 'components.json not found. Run `brutx-vue init` first.',
        };
    }
    return {
        name: 'components.json exists',
        status: 'pass',
        message: 'components.json found.',
    };
}

function checkSchema(config: BrutalistConfig): CheckResult {
    if (!config.$schema) {
        return {
            name: '$schema field present',
            status: 'warn',
            message: '$schema field is missing.',
            fixId: FixId.AddSchema,
            fixDescription: 'Add $schema URL',
        };
    }
    return {
        name: '$schema field present',
        status: 'pass',
        message: '$schema field is present.',
    };
}

function checkConfigVersion(config: BrutalistConfig): CheckResult {
    if (config.$version === undefined) {
        return {
            name: 'config version',
            status: 'warn',
            message: 'Configuration is missing version information.',
            fixId: FixId.AddConfigVersion,
            fixDescription: 'Add $version field',
        };
    }
    if (config.$version < CURRENT_CONFIG_VERSION) {
        return {
            name: 'config version',
            status: 'warn',
            message: `Configuration version ${config.$version} is outdated (current: ${CURRENT_CONFIG_VERSION}). Migration may be needed.`,
            fixId: FixId.AddConfigVersion,
            fixDescription: `Update $version to ${CURRENT_CONFIG_VERSION}`,
        };
    }
    return {
        name: 'config version',
        status: 'pass',
        message: `Configuration version is ${config.$version}.`,
    };
}

function checkStyle(config: BrutalistConfig): CheckResult {
    if (!config.style) {
        return {
            name: 'style field present',
            status: 'warn',
            message: 'style field is missing.',
            fixId: FixId.SetStyle,
            fixDescription: 'Set style to "brutalism"',
        };
    }
    return {
        name: 'style field present',
        status: 'pass',
        message: `style is "${config.style}".`,
    };
}

async function checkTailwindCss(cwd: string, config: BrutalistConfig): Promise<CheckResult> {
    const cssPath = await resolveAliasPath(config.tailwind.css, cwd);

    if (!(await fs.pathExists(cssPath))) {
        return {
            name: 'tailwind.css points to real file',
            status: 'error',
            message: `CSS file not found: ${config.tailwind.css}`,
        };
    }

    const content = await fs.readFile(cssPath, 'utf-8');
    const hasCompleteBrutalistStyles = content.includes('--color-brutal-bg')
        && content.includes('.bg-brutal-primary')
        && content.includes('.animate-in');
    if (!hasCompleteBrutalistStyles) {
        return {
            name: 'tailwind.css contains BrutxUI tokens',
            status: 'error',
            message: `CSS file exists but missing BrutxUI tokens: ${config.tailwind.css}`,
            fixId: FixId.InjectCssTokens,
            fixDescription: 'Inject BrutxUI CSS tokens',
        };
    }

    return {
        name: 'tailwind.css contains BrutxUI tokens',
        status: 'pass',
        message: 'CSS file contains BrutxUI tokens.',
    };
}

async function checkDeprecatedBrutalismPlugin(cwd: string, config: BrutalistConfig): Promise<CheckResult> {
    const candidates = Array.from(new Set([config.tailwind.config, ...CONFIG_FILES.tailwind]));

    for (const candidate of candidates) {
        const configPath = path.resolve(cwd, candidate);
        if (!(await fs.pathExists(configPath))) continue;

        const stat = await fs.stat(configPath);
        if (stat.isDirectory()) continue;

        const content = await fs.readFile(configPath, 'utf-8');
        if (content.includes('brutx-ui-vue/brutalism-plugin') || content.includes('brutx-ui-vue/dist/brutalism-plugin')) {
            return {
                name: 'deprecated brutalism plugin',
                status: 'warn',
                message: `${candidate} imports the deprecated empty brutalism plugin. Import BrutxUI styles via styles.css or preflight.css instead.`,
            };
        }
    }

    return {
        name: 'deprecated brutalism plugin',
        status: 'pass',
        message: 'No deprecated brutalism plugin import found.',
    };
}

async function checkAliases(cwd: string, config: BrutalistConfig): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const componentsExists = await fs.pathExists(componentsPath);
    results.push({
        name: `aliases.components → ${config.aliases.components}`,
        status: componentsExists ? 'pass' : 'warn',
        message: componentsExists
            ? 'Directory exists.'
            : 'Directory does not exist.',
        fixId: FixId.CreateComponentsDir,
        fixDescription: 'Create directory',
    });

    const utilsPath = await resolveUtilsPath(config, cwd);
    let utilsExists = false;
    for (const ext of UTILS_EXTENSIONS) {
        if (await fs.pathExists(utilsPath + ext)) {
            utilsExists = true;
            break;
        }
    }

    results.push({
        name: getUtilsDisplayName(config),
        status: utilsExists ? 'pass' : 'error',
        message: utilsExists ? 'File exists.' : 'File does not exist.',
        fixId: FixId.CreateUtilsFile,
        fixDescription: 'Create utils file',
    });

    return results;
}

async function checkWorkspaceHint(cwd: string): Promise<CheckResult[]> {
    const workspaceRoot = await detectWorkspaceRoot(cwd);
    const resolvedCwd = path.resolve(cwd);
    if (!workspaceRoot || workspaceRoot === resolvedCwd) {
        return [];
    }
    const relativeRoot = path.relative(resolvedCwd, workspaceRoot);
    return [{
        name: 'workspace hint',
        status: 'warn',
        message: `Detected monorepo subpackage (workspace root: ${relativeRoot}). BrutxUI does not provide cross-package batch init/add/remove; run \`brutx-vue init\`/\`add\` independently inside each package, and manage shared dependencies via pnpm-workspace.yaml.`,
    }];
}

async function checkDependencies(cwd: string): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    let packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } = {};
    try {
        packageJson = await fs.readJson(path.join(cwd, 'package.json'));
    } catch {
        return results;
    }

    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    };

    const workspaceRoot = await detectWorkspaceRoot(cwd);
    if (workspaceRoot && workspaceRoot !== path.resolve(cwd)) {
        try {
            const rootPackageJson = await fs.readJson(path.join(workspaceRoot, 'package.json'));
            Object.assign(
                allDeps,
                rootPackageJson.dependencies,
                rootPackageJson.devDependencies
            );
        } catch {
            // Ignore error
        }
    }

    const requiredDeps = BASE_DEPENDENCIES.filter((dep) => dep !== '@lucide/vue');
    const optionalDeps = ['@lucide/vue'];

    for (const dep of requiredDeps) {
        const installed = dep in allDeps;
        results.push({
            name: `${dep} installed`,
            status: installed ? 'pass' : 'error',
            message: installed
                ? `${allDeps[dep]} installed.`
                : `Missing dependency. Run: pnpm add ${dep}`,
        });
    }

    for (const dep of optionalDeps) {
        const installed = dep in allDeps;
        results.push({
            name: `${dep} installed (optional)`,
            status: installed ? 'pass' : 'warn',
            message: installed
                ? `${allDeps[dep]} installed.`
                : `Optional dependency not installed (needed for icon components).`,
        });
    }

    return results;
}

async function checkUtilsFunction(cwd: string, config: BrutalistConfig): Promise<CheckResult> {
    const utilsPath = await resolveUtilsPath(config, cwd);
    let utilsFile: string | undefined;
    for (const ext of UTILS_EXTENSIONS) {
        if (await fs.pathExists(utilsPath + ext)) {
            utilsFile = ext;
            break;
        }
    }

    if (!utilsFile) {
        return {
            name: 'cn() function exists',
            status: 'error',
            message: 'Utils file not found.',
            fixId: FixId.AddCnFunction,
            fixDescription: 'Create utils file with cn() function',
        };
    }

    const content = await fs.readFile(utilsPath + utilsFile, 'utf-8');
    if (!content.includes('export function cn') && !content.includes('export const cn')) {
        return {
            name: 'cn() function exists',
            status: 'error',
            message: 'cn() function not found in utils file.',
            fixId: FixId.AddCnFunction,
            fixDescription: 'Add cn() function to utils file',
        };
    }

    return {
        name: 'cn() function exists',
        status: 'pass',
        message: 'cn() function found.',
    };
}

async function checkComponentIntegrity(cwd: string, config: BrutalistConfig): Promise<CheckResult[]> {
    const manifest = await readManifest(cwd);
    if (manifest && Object.keys(manifest.components).length > 0) {
        return checkComponentIntegrityManifest(cwd, manifest);
    }
    return checkComponentIntegrityLegacy(cwd, config);
}

async function checkComponentIntegrityLegacy(cwd: string, config: BrutalistConfig): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);

    if (!(await fs.pathExists(componentsPath))) {
        return results;
    }

    const collectComponentDirs = async (baseDir: string): Promise<string[]> => {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        const subDirs: string[] = [];
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const subPath = path.join(baseDir, entry.name);
            const inner = await fs.readdir(subPath, { withFileTypes: true });
            const hasVueOrTs = inner.some(e => e.isFile() && (e.name.endsWith('.vue') || e.name.endsWith('.ts')));
            if (hasVueOrTs) {
                subDirs.push(subPath);
            } else {
                subDirs.push(...await collectComponentDirs(subPath));
            }
        }
        return subDirs;
    };

    try {
        const componentDirs = await collectComponentDirs(componentsPath);
        for (const componentPath of componentDirs) {
            const files = await fs.readdir(componentPath);
            const fileCount = files.filter(f => !fs.statSync(path.join(componentPath, f)).isDirectory()).length;
            const hasFiles = fileCount > 0;
            const componentName = path.relative(componentsPath, componentPath).split(path.sep).join('/');

            results.push({
                name: `component ${componentName}`,
                status: hasFiles ? 'pass' : 'warn',
                message: hasFiles
                    ? `${fileCount} files found. (legacy scan)`
                    : 'Component directory is empty. (legacy scan)',
            });
        }
    } catch (error) {
        logger.debug(`Error reading component directory: ${error instanceof Error ? error.message : String(error)}`);
    }

    return results;
}

const ORPHAN_EXTENSIONS = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx']);

/**
 * Manifest 驱动的三类检查：
 * 1. manifest 与文件系统一致性（缺失文件 / 孤儿文件）
 * 2. integrity 漂移检测（重算 installedContentHash 与 manifest 比对）
 * 3. registryDependencies 闭环检查
 */
async function checkComponentIntegrityManifest(cwd: string, manifest: BrutxManifest): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const manifestComponentNames = new Set(Object.keys(manifest.components));

    for (const [componentName, entry] of Object.entries(manifest.components)) {
        results.push(...await checkManifestEntryConsistency(cwd, componentName, entry));
        results.push(...await checkManifestEntryIntegrityDrift(cwd, componentName, entry));
        results.push(...checkManifestEntryRegistryDepsClosure(componentName, entry, manifestComponentNames));
    }

    return results;
}

async function checkManifestEntryConsistency(
    cwd: string,
    componentName: string,
    entry: InstalledComponentManifest,
): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const missingFiles: string[] = [];
    const existingAbsPaths: Set<string> = new Set();

    for (const relativeFile of entry.files) {
        const absPath = path.resolve(cwd, relativeFile);
        if (await fs.pathExists(absPath)) {
            existingAbsPaths.add(absPath);
        } else {
            missingFiles.push(relativeFile);
        }
    }

    if (missingFiles.length > 0) {
        results.push({
            name: `component ${componentName} files present`,
            status: 'error',
            message: `Missing ${missingFiles.length} file(s) recorded in manifest: ${missingFiles.join(', ')}`,
            fixId: FixId.RestoreIntegrity,
            fixDescription: `Run \`brutx-vue update ${componentName}\` to restore missing files`,
            componentName,
        });
    } else if (entry.files.length > 0) {
        results.push({
            name: `component ${componentName} files present`,
            status: 'pass',
            message: `All ${entry.files.length} manifest file(s) exist on disk.`,
            componentName,
        });
    }

    const orphans = await findOrphanFiles(cwd, entry);
    if (orphans.length > 0) {
        results.push({
            name: `component ${componentName} no orphans`,
            status: 'warn',
            message: `Found ${orphans.length} orphan file(s) not recorded in manifest: ${orphans.join(', ')}`,
            fixId: FixId.RemoveOrphans,
            fixDescription: `Remove orphan files or add them to manifest via reinstall`,
            componentName,
        });
    } else if (entry.files.length > 0) {
        results.push({
            name: `component ${componentName} no orphans`,
            status: 'pass',
            message: 'No orphan files detected in component directory.',
            componentName,
        });
    }

    return results;
}

async function findOrphanFiles(cwd: string, entry: InstalledComponentManifest): Promise<string[]> {
    const orphans: string[] = [];
    if (entry.files.length === 0) return orphans;

    const manifestAbsSet = new Set(entry.files.map(f => path.resolve(cwd, f)));
    const directories = new Set<string>();
    for (const relFile of entry.files) {
        let dir = path.dirname(path.resolve(cwd, relFile));
        while (dir !== cwd && path.dirname(dir) !== dir) {
            directories.add(dir);
            dir = path.dirname(dir);
        }
    }

    for (const dir of directories) {
        if (!(await fs.pathExists(dir))) continue;
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const e of entries) {
            if (!e.isFile()) continue;
            const ext = path.extname(e.name).toLowerCase();
            if (!ORPHAN_EXTENSIONS.has(ext)) continue;
            const absPath = path.join(dir, e.name);
            if (!manifestAbsSet.has(absPath)) {
                orphans.push(path.relative(cwd, absPath).split(path.sep).join('/'));
            }
        }
    }

    return orphans;
}

async function checkManifestEntryIntegrityDrift(
    cwd: string,
    componentName: string,
    entry: InstalledComponentManifest,
): Promise<CheckResult[]> {
    if (!entry.installedContentHash) {
        return [{
            name: `component ${componentName} integrity`,
            status: 'warn',
            message: 'No installedContentHash recorded (pre-P0-1 manifest). Run update to enable drift detection.',
            componentName,
        }];
    }

    if (entry.files.length === 0) {
        return [];
    }

    try {
        const absFiles = entry.files.map(f => path.resolve(cwd, f));
        const currentHash = await computeInstalledContentHash(absFiles);
        if (currentHash !== entry.installedContentHash) {
            return [{
                name: `component ${componentName} integrity`,
                status: 'warn',
                message: `Integrity drift detected — component files have been modified since install. Run \`brutx-vue update ${componentName}\` to restore.`,
                fixId: FixId.RestoreIntegrity,
                fixDescription: `Restore ${componentName} from registry`,
                componentName,
            }];
        }
        return [{
            name: `component ${componentName} integrity`,
            status: 'pass',
            message: 'Component files match installed snapshot.',
            componentName,
        }];
    } catch (error) {
        logger.debug(`Error computing integrity for ${componentName}: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
}

function checkManifestEntryRegistryDepsClosure(
    componentName: string,
    entry: InstalledComponentManifest,
    manifestComponentNames: Set<string>,
): CheckResult[] {
    if (entry.registryDependencies.length === 0) {
        return [];
    }

    const missingDeps = entry.registryDependencies.filter(dep => !manifestComponentNames.has(dep));
    if (missingDeps.length > 0) {
        return [{
            name: `component ${componentName} registry deps closed`,
            status: 'warn',
            message: `Registry dependency ${missingDeps.map(d => `'${d}'`).join(', ')} not installed. Run \`brutx-vue add ${missingDeps[0]}\` to install.`,
            componentName,
        }];
    }
    return [{
        name: `component ${componentName} registry deps closed`,
        status: 'pass',
        message: `All ${entry.registryDependencies.length} registry dependency(ies) installed.`,
        componentName,
    }];
}

/**
 * registry 可达性检查（P1-5）：对配置中的所有 registry 源做 HEAD/GET 探测。
 * --offline 或 BRUTX_OFFLINE=1 时跳过网络探测，仅报告源列表。
 */
async function checkRegistryReachability(
    config: BrutalistConfig,
    options: { offline: boolean },
): Promise<CheckResult[]> {
    const sources = resolveRegistrySources(config);
    const results: CheckResult[] = [];

    if (options.offline) {
        // 离线模式：跳过网络探测，报告配置的源列表
        for (const source of sources) {
            results.push({
                name: `registry source ${source}`,
                status: 'pass',
                message: `Configured (offline mode, reachability check skipped).`,
            });
        }
        return results;
    }

    for (const source of sources) {
        if (!source.startsWith('http://') && !source.startsWith('https://')) {
            // 本地路径源：检查目录是否存在
            const exists = await fs.pathExists(source);
            results.push({
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
            name: `registry source ${source}`,
            status: status.reachable ? 'pass' : 'warn',
            message: status.reachable
                ? `Reachable${status.latencyMs !== undefined ? ` (${status.latencyMs}ms)` : ''}.`
                : `Unreachable: ${status.error ?? 'unknown error'}`,
        });
    }

    return results;
}

async function probeHttpSource(source: string): Promise<RegistrySourceStatus> {
    const probeUrl = `${source}/registry-manifest.json`;
    const start = Date.now();
    try {
        const res = await fetch(probeUrl, {
            method: 'GET',
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

/**
 * 审计日志诊断（P1-8）：读取 .brutx/audit.log 中的最近失败记录。
 * 帮助用户发现"上次 update 失败"等历史线索。
 */
const AUDIT_FAILURE_REPORT_LIMIT = 5;

async function checkAuditLog(cwd: string): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    if (!(await auditLogExists(cwd))) {
        // 无审计日志是正常状态（新项目或未执行过操作）
        return results;
    }

    const total = await countAuditEntries(cwd);
    const failures = await getRecentFailures(cwd, AUDIT_FAILURE_REPORT_LIMIT);

    if (failures.length === 0) {
        results.push({
            name: 'audit log health',
            status: 'pass',
            message: `No failures in ${total} audit log entr${total !== 1 ? 'ies' : 'y'}.`,
        });
        return results;
    }

    const latestFailure = failures[failures.length - 1];
    const failureSummary = failures.map(f => `${f.command}(${f.components.join(',')})`).join(', ');
    results.push({
        name: 'audit log health',
        status: 'warn',
        message: `${failures.length} recent failure(s) in audit log: ${failureSummary}. Latest: ${latestFailure.command} failed at ${latestFailure.timestamp}${latestFailure.error ? ` — ${latestFailure.error}` : ''}`,
    });

    return results;
}

function printReport(checks: CheckResult[]): void {
    logger.newLine();
    logger.bold(' Brutx-Vue Doctor');
    logger.newLine();

    const passed = checks.filter((c) => c.status === 'pass').length;
    const warnings = checks.filter((c) => c.status === 'warn').length;
    const errors = checks.filter((c) => c.status === 'error').length;

    for (const check of checks) {
        let icon: string;
        if (check.status === 'pass') {
            icon = chalk.green('✅');
        } else if (check.status === 'warn') {
            icon = chalk.yellow('⚠️');
        } else {
            icon = chalk.red('❌');
        }
        logger.log(`  ${icon} ${check.name} — ${check.message}`);

        if (check.status !== 'pass' && check.fixDescription) {
            logger.dim(`     → Fix: ${check.fixDescription}`);
        }
    }

    logger.newLine();
    logger.log(`  Summary: ${chalk.green(`${passed} passed`)}, ${chalk.yellow(`${warnings} warning${warnings !== 1 ? 's' : ''}`)}, ${chalk.red(`${errors} error${errors !== 1 ? 's' : ''}`)}`);
    logger.newLine();
}

async function applyFixes(checks: CheckResult[], options: DoctorOptions): Promise<void> {
    let fixable = checks.filter((c) => c.status !== 'pass' && c.fixDescription);

    if (options.fixOnly) {
        fixable = fixable.filter((c) => c.fixId === options.fixOnly);
    }

    if (fixable.length === 0) {
        logger.info('No fixable issues found.');
        return;
    }

    if (options.silent) {
        return;
    }

    const isInteractive = !options.yes && !!process.stdin.isTTY;

    const cwd = options.cwd ?? process.cwd();
    const config = await readConfigSafe(cwd);

    if (!config) return;

    const transaction = new FileTransaction();
    let applied = 0;
    const total = fixable.length;

    for (const check of fixable) {
        if (!check.fixId) continue;

        if (isInteractive) {
            const shouldFix = await confirm({
                message: `Apply fix: ${check.fixId}?`,
                default: true,
            });
            if (!shouldFix) continue;
        }

        try {
            switch (check.fixId) {
                case FixId.AddSchema:
                    config.$schema = SCHEMA_URL;
                    logger.success('Added $schema field.');
                    break;

                case FixId.AddConfigVersion:
                    config.$version = CURRENT_CONFIG_VERSION;
                    logger.success(`Set $version to ${CURRENT_CONFIG_VERSION}.`);
                    break;

                case FixId.SetStyle:
                    config.style = 'brutalism';
                    logger.success('Set style to "brutalism".');
                    break;

                case FixId.InjectCssTokens: {
                    const cssPath = await resolveAliasPath(config.tailwind.css, cwd);
                    const existing = await fs.readFile(cssPath, 'utf-8');
                    await transaction.writeFile(cssPath, existing + '\n' + await getBrutalistCssStyles());
                    logger.success('Injected BrutxUI CSS tokens.');
                    break;
                }

                case FixId.CreateComponentsDir: {
                    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
                    await transaction.ensureDir(componentsPath);
                    logger.success('Created components directory.');
                    break;
                }

                case FixId.CreateUtilsFile: {
                    const utilsPath = await resolveUtilsPath(config, cwd);
                    await transaction.writeFile(utilsPath + '.ts', UTILS_TEMPLATE);
                    logger.success('Created utils file.');
                    break;
                }

                case FixId.AddCnFunction: {
                    const utilsPath = await resolveUtilsPath(config, cwd);
                    let utilsFile: string | undefined;
                    for (const ext of UTILS_EXTENSIONS) {
                        if (await fs.pathExists(utilsPath + ext)) {
                            utilsFile = ext;
                            break;
                        }
                    }

                    if (utilsFile) {
                        const existing = await fs.readFile(utilsPath + utilsFile, 'utf-8');
                        await transaction.writeFile(utilsPath + utilsFile, existing + '\n' + CN_FUNCTION_TEMPLATE);
                        logger.success('Added cn() function.');
                    }
                    break;
                }

                case FixId.RemoveOrphans: {
                    if (!check.componentName) break;
                    const manifest = await readManifest(cwd);
                    const entry = manifest?.components[check.componentName];
                    if (!entry) break;

                    const orphans = await findOrphanFiles(cwd, entry);
                    for (const orphan of orphans) {
                        const absPath = path.resolve(cwd, orphan);
                        await transaction.remove(absPath);
                    }
                    if (orphans.length > 0) {
                        logger.success(`Removed ${orphans.length} orphan file(s) for ${check.componentName}.`);
                    }
                    break;
                }

                case FixId.RestoreIntegrity: {
                    if (!check.componentName) break;
                    const manifest = await readManifest(cwd);
                    const entry = manifest?.components[check.componentName];
                    if (!entry) break;

                    // --fix 时允许触网拉取 registry 恢复权威内容
                    const { getItem, resolveImportAlias } = await import('../lib/index.js');
                    try {
                        const item = await getItem(check.componentName, entry.registrySource, true);
                        // manifest.files 顺序与 item.files 顺序一致（manifest 不再 .sort()，
                        // 来自 add-service 的 filesByComponent，源于 item.files 数组顺序）
                        if (entry.files.length !== item.files.length) {
                            logger.warn(`File count mismatch for ${check.componentName} (manifest: ${entry.files.length}, registry: ${item.files.length}). Run \`brutx-vue update ${check.componentName}\` instead.`);
                            break;
                        }
                        for (let i = 0; i < item.files.length; i++) {
                            const targetPath = path.resolve(cwd, entry.files[i]);
                            const resolvedContent = resolveImportAlias(item.files[i].content, config);
                            await transaction.writeFile(targetPath, resolvedContent);
                        }
                        logger.success(`Restored ${check.componentName} from registry.`);
                    } catch (restoreError) {
                        logger.warn(`Could not restore ${check.componentName} from registry: ${restoreError instanceof Error ? restoreError.message : String(restoreError)}`);
                        logger.info(`Run \`brutx-vue update ${check.componentName}\` manually to restore.`);
                    }
                    break;
                }
            }
            applied++;
            check.status = 'pass';
        } catch (error) {
            const rollbackFailures = await transaction.rollback();
            logger.error(`Failed to fix: ${check.name}`);
            logger.error(error instanceof Error ? error.message : String(error));
            if (rollbackFailures.length > 0) {
                logger.error(`Rollback failed for: ${rollbackFailures.join(', ')}`);
            }
            throw new CliError(`Failed to apply fix "${check.name}"`, {
                code: 'WRITE_FAILED',
                cause: error,
            });
        }
    }

    if (applied > 0) {
        try {
            const configPath = path.join(cwd, 'components.json');
            await transaction.writeJson(configPath, config, { spaces: 2 });
            await transaction.commit();
            logger.success('Updated components.json.');
        } catch (error) {
            const rollbackFailures = await transaction.rollback();
            logger.error('Failed to write updated config file.');
            logger.error(error instanceof Error ? error.message : String(error));
            if (rollbackFailures.length > 0) {
                logger.error(`Rollback failed for: ${rollbackFailures.join(', ')}`);
            }
            throw new CliError('Failed to write updated config file.', {
                code: 'WRITE_FAILED',
                cause: error,
            });
        }
    } else {
        await transaction.commit();
    }

    logger.log(`Applied ${applied}/${total} fixes.`);
}

export async function doctor(options: DoctorOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    if (options.silent) {
        logger.setSilent(true);
    }

    const offline = isOfflineRequested(options.offline);
    const restoreOffline = withOfflineScope(offline);
    try {
        await doctorInner(options, cwd, offline);
    } finally {
        restoreOffline();
    }
}

async function doctorInner(options: DoctorOptions, cwd: string, offline: boolean): Promise<void> {
    const config = await readConfigSafe(cwd);
    const checks: CheckResult[] = [];

    checks.push(checkNodeVersion());
    checks.push(...await checkWorkspaceHint(cwd));
    checks.push(checkConfigExists(cwd, config));

    if (config) {
        checks.push(checkSchema(config));
        checks.push(checkConfigVersion(config));
        checks.push(checkStyle(config));
        checks.push(await checkTailwindCss(cwd, config));
        checks.push(await checkDeprecatedBrutalismPlugin(cwd, config));
        checks.push(...await checkAliases(cwd, config));
        checks.push(...await checkDependencies(cwd));
        checks.push(await checkUtilsFunction(cwd, config));
        checks.push(...await checkComponentIntegrity(cwd, config));
        checks.push(...await checkRegistryReachability(config, { offline }));
        checks.push(...await checkAuditLog(cwd));
    }

    if (options.fix || options.fixOnly) {
        await applyFixes(checks, options);

        // 修复后重新运行检测，刷新 checks 数组，以便获取最真实的错误状态
        checks.length = 0;
        const freshConfig = await readConfigSafe(cwd);
        checks.push(checkNodeVersion());
        checks.push(...await checkWorkspaceHint(cwd));
        checks.push(checkConfigExists(cwd, freshConfig));

        if (freshConfig) {
            checks.push(checkSchema(freshConfig));
            checks.push(checkConfigVersion(freshConfig));
            checks.push(checkStyle(freshConfig));
            checks.push(await checkTailwindCss(cwd, freshConfig));
            checks.push(await checkDeprecatedBrutalismPlugin(cwd, freshConfig));
            checks.push(...await checkAliases(cwd, freshConfig));
            checks.push(...await checkDependencies(cwd));
            checks.push(await checkUtilsFunction(cwd, freshConfig));
            checks.push(...await checkComponentIntegrity(cwd, freshConfig));
            checks.push(...await checkRegistryReachability(freshConfig, { offline }));
            checks.push(...await checkAuditLog(cwd));
        }
    }

    if (options.json) {
        process.stdout.write(JSON.stringify(checks, null, 2) + '\n');
    } else {
        printReport(checks);
    }

    const hasErrors = checks.some((c) => c.status === 'error');
    if (hasErrors) {
        throw new CliError('Doctor check failed with errors');
    }
}
