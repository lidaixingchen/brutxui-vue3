import path from 'path';
import { createTwoFilesPatch } from 'diff';
import type { BrutalistConfig } from '../types.js';
import type {
    CheckResult,
    CheckStatus,
    DiagnoseOptions,
    DiagnosticCategory,
    DiagnosticContext,
    DiagnosticReport,
    DiagnosticRule,
    DiagnosticSummary,
    FileDiffPreview,
    RepairAction,
    RepairItemReport,
    RepairOptions,
    RepairPlan,
    RepairPreviewReport,
    RepairReport,
} from './types.js';
import { BUILTIN_RULES } from './rules/index.js';
import { ProjectContext } from '../project-context.js';
import { readManifest } from '../manifest.js';
import { readConfigSafe } from '../config.js';
import { CliError } from '../error.js';
import { assertSafePath } from '../security.js';
import { CustomRuleLoader } from './custom-rule-loader.js';

const CONFIG_FILE_NAME = 'components.json';
const JSON_INDENT_SPACES = 2;

function normalizePathKey(filePath: string, cwd: string): string {
    const resolved = path.resolve(cwd, filePath);
    return process.platform === 'win32' || process.platform === 'darwin'
        ? resolved.toLowerCase()
        : resolved;
}

function normalizeNewlines(content: string): string {
    return content.replace(/\r\n/g, '\n');
}

interface PlannedRepairState {
    readonly cwd: string;
    readonly initialReport: DiagnosticReport;
    readonly fixableChecks: CheckResult[];
    readonly projectContext: ProjectContext;
    readonly plannedItems: Array<{ check: CheckResult; plan: RepairPlan }>;
    readonly plans: RepairPlan[];
    readonly skipped: Array<{ ruleId: string; checkName: string; fixId: string; reason: string }>;
    readonly failed: Array<{ ruleId: string; checkName: string; fixId: string; reason: string }>;
}

export function createDiagnosticReport(checks: CheckResult[]): DiagnosticReport {
    let passed = 0;
    let warnings = 0;
    let errors = 0;
    let fixable = 0;

    for (const check of checks) {
        if (check.status === 'pass') passed++;
        else if (check.status === 'warn') warnings++;
        else if (check.status === 'error') errors++;

        if (check.status !== 'pass' && check.fixId) {
            fixable++;
        }
    }

    const summary: DiagnosticSummary = {
        total: checks.length,
        passed,
        warnings,
        errors,
        fixable,
    };

    return {
        checks,
        summary,
        hasErrors: errors > 0,
        hasWarnings: warnings > 0,
        fixableCount: fixable,
        getByCategory(category: DiagnosticCategory): CheckResult[] {
            return checks.filter(c => c.category === category);
        },
        getByStatus(status: CheckStatus): CheckResult[] {
            return checks.filter(c => c.status === status);
        },
        getByRuleId(ruleId: string): CheckResult[] {
            return checks.filter(c => c.ruleId === ruleId);
        },
    };
}

function deepMerge(target: unknown, source: unknown): unknown {
    if (!target || typeof target !== 'object' || Array.isArray(target)) {
        return source;
    }
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
        return source;
    }
    const output: Record<string, unknown> = { ...(target as Record<string, unknown>) };
    const sourceObj = source as Record<string, unknown>;
    for (const key of Object.keys(sourceObj)) {
        const sourceVal = sourceObj[key];
        const targetVal = output[key];
        if (
            sourceVal &&
            typeof sourceVal === 'object' &&
            !Array.isArray(sourceVal) &&
            targetVal &&
            typeof targetVal === 'object' &&
            !Array.isArray(targetVal)
        ) {
            output[key] = deepMerge(targetVal, sourceVal);
        } else if (sourceVal !== undefined) {
            output[key] = sourceVal;
        }
    }
    return output;
}

export class DiagnosticEngine {
    private readonly rules: DiagnosticRule[];
    private readonly ruleMap: Map<string, DiagnosticRule>;
    private readonly loadedPluginPaths = new Set<string>();

    constructor(customRules?: DiagnosticRule[]) {
        this.rules = customRules ? [...customRules] : [...BUILTIN_RULES];
        this.ruleMap = new Map(this.rules.map(r => [r.id, r]));
    }

    getRegisteredRules(): readonly DiagnosticRule[] {
        return this.rules;
    }

    async loadPlugins(plugins: string[], cwd: string): Promise<void> {
        const loader = new CustomRuleLoader(cwd);
        for (const pluginPath of plugins) {
            const resolvedPath = loader.resolvePluginPath(pluginPath);
            if (this.loadedPluginPaths.has(resolvedPath)) {
                continue;
            }
            this.loadedPluginPaths.add(resolvedPath);
            const loadedRules = await loader.loadPlugin(pluginPath);
            for (const rule of loadedRules) {
                if (!this.ruleMap.has(rule.id)) {
                    this.rules.push(rule);
                    this.ruleMap.set(rule.id, rule);
                }
            }
        }
    }

    async diagnose(options: DiagnoseOptions = {}): Promise<DiagnosticReport> {
        const cwd = path.resolve(options.cwd ?? process.cwd());
        const fsAdapter = options.fs;

        let configOverride = options.context?.config;
        if (!configOverride) {
            try {
                const safe = await readConfigSafe(cwd);
                if (safe) {
                    configOverride = safe;
                }
            } catch {
                // Ignore parse errors, loadUninitialized handles null config
            }
        }

        const projectContext = options.context ?? await ProjectContext.loadUninitialized(cwd, {
            fs: fsAdapter,
            configOverride,
            optionalConfig: true,
        });

        const manifest = await readManifest(cwd, projectContext.fs);
        const offline = options.offline ?? false;

        const ctx: DiagnosticContext = {
            cwd,
            projectContext,
            fs: projectContext.fs,
            config: projectContext.config ?? null,
            manifest,
            offline,
        };

        if (ctx.config?.plugins && ctx.config.plugins.length > 0) {
            await this.loadPlugins(ctx.config.plugins, cwd);
        }

        const checks: CheckResult[] = [];
        const rulesOverrides = ctx.config?.rules ?? {};

        for (const rule of this.rules) {
            if (options.categories && !options.categories.includes(rule.category)) {
                continue;
            }
            if (options.ruleIds && !options.ruleIds.includes(rule.id)) {
                continue;
            }
            if (rule.requiresConfig && !ctx.config) {
                continue;
            }
            if (rulesOverrides[rule.id] === 'off') {
                continue;
            }

            try {
                const ruleResults = await rule.check(ctx);
                const resultsArray = Array.isArray(ruleResults) ? ruleResults : [ruleResults];

                for (const result of resultsArray) {
                    const override = rulesOverrides[result.ruleId];
                    if (override === 'off') {
                        continue;
                    }

                    const normalizedResult: CheckResult = {
                        ...result,
                        category: result.category ?? rule.category,
                        helpUrl: result.helpUrl ?? rule.helpUrl,
                        status: (override && result.status !== 'pass') ? override : result.status,
                    };

                    checks.push(normalizedResult);
                }
            } catch (ruleError) {
                const message = ruleError instanceof Error ? ruleError.message : String(ruleError);
                checks.push({
                    ruleId: rule.id,
                    category: rule.category,
                    name: rule.name,
                    status: 'error',
                    message,
                    helpUrl: rule.helpUrl,
                });
            }
        }

        return createDiagnosticReport(checks);
    }

    private async collectRepairPlans(options: RepairOptions): Promise<PlannedRepairState> {
        const cwd = path.resolve(options.cwd ?? process.cwd());
        const initialReport = await this.diagnose(options);

        let fixableChecks = initialReport.checks.filter(c => c.status !== 'pass' && c.fixId);
        if (options.fixOnly) {
            fixableChecks = fixableChecks.filter(c => c.fixId === options.fixOnly);
        }

        const projectContext = options.context ?? await ProjectContext.loadUninitialized(cwd, {
            fs: options.fs,
            optionalConfig: true,
        });

        const manifest = await readManifest(cwd, projectContext.fs);
        const offline = options.offline ?? false;

        const ctx: DiagnosticContext = {
            cwd,
            projectContext,
            fs: projectContext.fs,
            config: projectContext.config ?? null,
            manifest,
            offline,
        };

        const plannedItems: Array<{ check: CheckResult; plan: RepairPlan }> = [];
        const plans: RepairPlan[] = [];
        const skipped: Array<{ ruleId: string; checkName: string; fixId: string; reason: string }> = [];
        const failed: Array<{ ruleId: string; checkName: string; fixId: string; reason: string }> = [];

        for (const check of fixableChecks) {
            const rule = this.ruleMap.get(check.ruleId);
            const fixId = check.fixId ?? 'auto-fix';
            if (!rule || !rule.planFix) {
                skipped.push({
                    ruleId: check.ruleId,
                    checkName: check.name,
                    fixId,
                    reason: 'No planFix handler registered for rule',
                });
                continue;
            }

            try {
                const fixResult = await rule.planFix(ctx, check);
                if (fixResult.status === 'planned') {
                    plannedItems.push({ check, plan: fixResult.plan });
                    plans.push(fixResult.plan);
                } else if (fixResult.status === 'skipped') {
                    skipped.push({
                        ruleId: check.ruleId,
                        checkName: check.name,
                        fixId,
                        reason: fixResult.reason,
                    });
                } else {
                    failed.push({
                        ruleId: check.ruleId,
                        checkName: check.name,
                        fixId,
                        reason: fixResult.reason,
                    });
                }
            } catch (error) {
                failed.push({
                    ruleId: check.ruleId,
                    checkName: check.name,
                    fixId,
                    reason: error instanceof Error ? error.message : String(error),
                });
            }
        }

        return {
            cwd,
            initialReport,
            fixableChecks,
            projectContext,
            plannedItems,
            plans,
            skipped,
            failed,
        };
    }

    private async buildPreview(state: PlannedRepairState): Promise<RepairPreviewReport> {
        const { cwd, projectContext, plans, skipped, failed } = state;

        // 碰撞校验门禁（Pre-flight collision & path traversal gate）
        const writeActionMap = new Map<string, { content: string; filePath: string }>();
        const removeActionMap = new Map<string, { targetPath: string }>();

        for (const plan of plans) {
            for (const action of plan.actions) {
                if (action.type === 'write-file') {
                    const normalized = normalizePathKey(action.filePath, cwd);
                    const absPath = path.resolve(cwd, action.filePath);
                    await assertSafePath(absPath, cwd, projectContext.fs);

                    // 互斥检测：同一路径不能既写又删
                    if (removeActionMap.has(normalized)) {
                        throw new CliError(
                            `Conflicting actions detected: path "${absPath}" is targeted by both write-file and remove-path.`,
                            { code: 'ACTION_CONFLICT' }
                        );
                    }

                    if (writeActionMap.has(normalized)) {
                        const existing = writeActionMap.get(normalized)!;
                        if (existing.content !== action.content) {
                            throw new CliError(`Conflicting write actions detected for path "${absPath}".`, {
                                code: 'ACTION_CONFLICT',
                            });
                        }
                    } else {
                        writeActionMap.set(normalized, { content: action.content, filePath: absPath });
                    }
                } else if (action.type === 'remove-path') {
                    const normalized = normalizePathKey(action.targetPath, cwd);
                    const absPath = path.resolve(cwd, action.targetPath);
                    await assertSafePath(absPath, cwd, projectContext.fs);

                    // 互斥检测：同一路径不能既写又删
                    if (writeActionMap.has(normalized)) {
                        throw new CliError(
                            `Conflicting actions detected: path "${absPath}" is targeted by both write-file and remove-path.`,
                            { code: 'ACTION_CONFLICT' }
                        );
                    }
                    removeActionMap.set(normalized, { targetPath: absPath });
                }
            }
        }

        // 差异全景生成（Unified Diff Generation）
        const fileDiffs: FileDiffPreview[] = [];
        const originalConfig = projectContext.config;
        let patchedConfig: BrutalistConfig | null = null;
        let hasConfigChanges = false;

        const configActions = plans.flatMap(p =>
            p.actions.filter((a): a is Extract<RepairAction, { type: 'patch-config' }> => a.type === 'patch-config')
        );

        if (configActions.length > 0) {
            hasConfigChanges = true;
            let currentConfigRecord: Record<string, unknown> = originalConfig
                ? (JSON.parse(JSON.stringify(originalConfig)) as Record<string, unknown>)
                : {};

            for (const action of configActions) {
                currentConfigRecord = deepMerge(currentConfigRecord, action.patch) as Record<string, unknown>;
            }
            patchedConfig = currentConfigRecord as unknown as BrutalistConfig;

            const configPath = path.join(cwd, CONFIG_FILE_NAME);
            const relConfigPath = path.relative(cwd, configPath).replace(/\\/g, '/');
            const oldConfigText = originalConfig
                ? normalizeNewlines(JSON.stringify(originalConfig, null, JSON_INDENT_SPACES) + '\n')
                : null;
            const newConfigText = normalizeNewlines(
                JSON.stringify(patchedConfig, null, JSON_INDENT_SPACES) + '\n'
            );
            const diff = createTwoFilesPatch(
                relConfigPath,
                relConfigPath,
                oldConfigText ?? '',
                newConfigText,
                oldConfigText === null ? '(nonexistent)' : '',
                ''
            );

            fileDiffs.push({
                filePath: relConfigPath,
                changeType: oldConfigText === null ? 'create' : 'modify',
                oldContent: oldConfigText,
                newContent: newConfigText,
                unifiedDiff: diff,
            });
        }

        const handledFiles = new Set<string>();
        for (const plan of plans) {
            for (const action of plan.actions) {
                if (action.type === 'write-file') {
                    const absPath = path.resolve(cwd, action.filePath);
                    const normKey = normalizePathKey(action.filePath, cwd);
                    if (handledFiles.has(normKey)) continue;
                    handledFiles.add(normKey);

                    const relPath = path.relative(cwd, absPath).replace(/\\/g, '/');
                    const exists = await projectContext.fs.pathExists(absPath);
                    const rawOldContent = exists ? await projectContext.fs.readFile(absPath, 'utf-8') : null;
                    const oldContent = rawOldContent !== null ? normalizeNewlines(rawOldContent) : null;
                    const newContent = normalizeNewlines(action.content);
                    const diff = createTwoFilesPatch(
                        relPath,
                        relPath,
                        oldContent ?? '',
                        newContent,
                        oldContent === null ? '(nonexistent)' : '',
                        ''
                    );

                    fileDiffs.push({
                        filePath: relPath,
                        changeType: oldContent === null ? 'create' : 'modify',
                        oldContent,
                        newContent,
                        unifiedDiff: diff,
                    });
                } else if (action.type === 'remove-path') {
                    const absPath = path.resolve(cwd, action.targetPath);
                    const normKey = normalizePathKey(action.targetPath, cwd);
                    if (handledFiles.has(normKey)) continue;
                    handledFiles.add(normKey);

                    const relPath = path.relative(cwd, absPath).replace(/\\/g, '/');
                    const exists = await projectContext.fs.pathExists(absPath);
                    let oldContent: string | null = null;
                    if (exists) {
                        try {
                            const stat = await projectContext.fs.stat(absPath);
                            if (stat.isFile()) {
                                const raw = await projectContext.fs.readFile(absPath, 'utf-8');
                                oldContent = normalizeNewlines(raw);
                            }
                        } catch {
                            // ignore stat error
                        }
                    }
                    const diff = createTwoFilesPatch(
                        relPath,
                        relPath,
                        oldContent ?? '',
                        '',
                        '',
                        '(deleted)'
                    );

                    fileDiffs.push({
                        filePath: relPath,
                        changeType: 'delete',
                        oldContent,
                        newContent: null,
                        unifiedDiff: diff,
                    });
                }
            }
        }

        return {
            plans,
            skipped: skipped.map(s => ({ ruleId: s.ruleId, reason: s.reason })),
            failed: failed.map(f => ({ ruleId: f.ruleId, reason: f.reason })),
            fileDiffs,
            configChanges: hasConfigChanges && patchedConfig ? {
                before: originalConfig ?? null,
                after: patchedConfig,
            } : undefined,
        };
    }

    async previewRepair(options: RepairOptions = {}): Promise<RepairPreviewReport> {
        const state = await this.collectRepairPlans(options);
        return await this.buildPreview(state);
    }

    async repair(options: RepairOptions = {}): Promise<RepairReport> {
        const state = await this.collectRepairPlans(options);
        const { cwd, initialReport, fixableChecks, projectContext, plannedItems, skipped, failed } = state;

        const appliedReports: RepairItemReport[] = [];
        const skippedReports: RepairItemReport[] = skipped.map(s => ({
            ruleId: s.ruleId,
            checkName: s.checkName,
            fixId: s.fixId,
            status: 'skipped',
            message: s.reason,
        }));
        const failedReports: RepairItemReport[] = failed.map(f => ({
            ruleId: f.ruleId,
            checkName: f.checkName,
            fixId: f.fixId,
            status: 'failed',
            message: f.reason,
        }));

        if (fixableChecks.length === 0) {
            return {
                applied: [],
                skipped: skippedReports,
                failed: failedReports,
                totalAttempted: 0,
                configUpdated: false,
                freshReport: initialReport,
            };
        }

        const preview = await this.buildPreview(state);

        if (options.dryRun) {
            for (const { check, plan } of plannedItems) {
                appliedReports.push({
                    ruleId: check.ruleId,
                    checkName: check.name,
                    fixId: check.fixId ?? 'auto-fix',
                    status: 'applied',
                    message: plan.description,
                });
            }
            return {
                applied: appliedReports,
                skipped: skippedReports,
                failed: failedReports,
                totalAttempted: fixableChecks.length,
                configUpdated: false,
                preview,
                freshReport: initialReport,
            };
        }

        const transaction = projectContext.createTransaction();

        try {
            // Phase 1: remove-path (全局先删)
            for (const { plan } of plannedItems) {
                for (const action of plan.actions) {
                    if (action.type === 'remove-path') {
                        const targetPath = path.resolve(cwd, action.targetPath);
                        await transaction.remove(targetPath, { recursive: action.recursive ?? false });
                    }
                }
            }

            // Phase 2: ensure-dir (全局建目录)
            for (const { plan } of plannedItems) {
                for (const action of plan.actions) {
                    if (action.type === 'ensure-dir') {
                        const dirPath = path.resolve(cwd, action.dirPath);
                        await transaction.ensureDir(dirPath);
                    }
                }
            }

            // Phase 3: write-file (全局写文件)
            for (const { plan } of plannedItems) {
                for (const action of plan.actions) {
                    if (action.type === 'write-file') {
                        const filePath = path.resolve(cwd, action.filePath);
                        await transaction.writeFile(filePath, action.content);
                    }
                }
            }

            // Phase 4: patch-config (全局写配置)
            let configUpdated = false;
            if (preview.configChanges) {
                const configPath = path.join(cwd, CONFIG_FILE_NAME);
                await transaction.writeJson(configPath, preview.configChanges.after, { spaces: JSON_INDENT_SPACES });
                projectContext.bindConfig(preview.configChanges.after);
                configUpdated = true;
            }

            await transaction.commit();

            for (const { check, plan } of plannedItems) {
                appliedReports.push({
                    ruleId: check.ruleId,
                    checkName: check.name,
                    fixId: check.fixId ?? 'auto-fix',
                    status: 'applied',
                    message: plan.description,
                });
            }

            const freshReport = await this.diagnose(options);

            return {
                applied: appliedReports,
                skipped: skippedReports,
                failed: failedReports,
                totalAttempted: fixableChecks.length,
                configUpdated,
                preview,
                freshReport,
            };
        } catch (error) {
            await transaction.rollback();
            throw new CliError('Failed to execute self-healing transaction', {
                code: 'WRITE_FAILED',
                cause: error,
            });
        }
    }
}
