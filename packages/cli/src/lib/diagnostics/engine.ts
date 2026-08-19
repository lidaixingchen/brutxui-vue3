import path from 'path';
import type { BrutalistConfig } from '../types.js';
import type {
    CheckResult,
    CheckStatus,
    DiagnoseOptions,
    DiagnosticCategory,
    DiagnosticContext,
    DiagnosticRepairContext,
    DiagnosticReport,
    DiagnosticRule,
    DiagnosticSummary,
    RepairItemReport,
    RepairOptions,
    RepairReport,
} from './types.js';
import { BUILTIN_RULES } from './rules/index.js';
import { ProjectContext } from '../project-context.js';
import { readManifest } from '../manifest.js';
import { readConfigSafe } from '../registry.js';
import { CliError } from '../error.js';

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

export class DiagnosticEngine {
    private readonly rules: DiagnosticRule[];
    private readonly ruleMap: Map<string, DiagnosticRule>;

    constructor(customRules?: DiagnosticRule[]) {
        this.rules = customRules ? [...customRules] : [...BUILTIN_RULES];
        this.ruleMap = new Map(this.rules.map(r => [r.id, r]));
    }

    getRegisteredRules(): readonly DiagnosticRule[] {
        return this.rules;
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

        const checks: CheckResult[] = [];

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

            const ruleResults = await rule.check(ctx);
            if (Array.isArray(ruleResults)) {
                checks.push(...ruleResults);
            } else {
                checks.push(ruleResults);
            }
        }

        return createDiagnosticReport(checks);
    }

    async repair(options: RepairOptions = {}): Promise<RepairReport> {
        const cwd = path.resolve(options.cwd ?? process.cwd());
        const initialReport = await this.diagnose(options);

        let fixableChecks = initialReport.checks.filter(c => c.status !== 'pass' && c.fixId);
        if (options.fixOnly) {
            fixableChecks = fixableChecks.filter(c => c.fixId === options.fixOnly);
        }

        if (fixableChecks.length === 0) {
            return {
                applied: [],
                skipped: [],
                failed: [],
                totalAttempted: 0,
                configUpdated: false,
                freshReport: initialReport,
            };
        }

        const projectContext = options.context ?? await ProjectContext.loadUninitialized(cwd, {
            fs: options.fs,
            optionalConfig: true,
        });

        const transaction = projectContext.createTransaction();
        const originalConfig = projectContext.config;
        const mutableConfig = originalConfig
            ? (JSON.parse(JSON.stringify(originalConfig)) as BrutalistConfig)
            : ({} as BrutalistConfig);

        // 单一真实数据源绑定：确保后续无论是通过上下文还是 mutableConfig 访问均保持一致
        if (originalConfig) {
            projectContext.bindConfig(mutableConfig);
        }

        let isConfigDirty = false;
        const markConfigDirty = () => {
            isConfigDirty = true;
        };

        const manifest = await readManifest(cwd, projectContext.fs);
        const offline = options.offline ?? false;

        const repairCtx: DiagnosticRepairContext = {
            cwd,
            projectContext,
            fs: projectContext.fs,
            config: originalConfig ? mutableConfig : null,
            manifest,
            offline,
            transaction,
            mutableConfig,
            markConfigDirty,
        };

        const applied: RepairItemReport[] = [];
        const skipped: RepairItemReport[] = [];
        const failed: RepairItemReport[] = [];

        for (const check of fixableChecks) {
            const rule = this.ruleMap.get(check.ruleId);
            if (!rule || !rule.fix) {
                skipped.push({
                    ruleId: check.ruleId,
                    checkName: check.name,
                    fixId: check.fixId!,
                    status: 'skipped',
                    message: 'No fix handler registered for rule',
                });
                continue;
            }

            try {
                const fixResult = await rule.fix(repairCtx, check);
                const itemReport: RepairItemReport = {
                    ruleId: check.ruleId,
                    checkName: check.name,
                    fixId: check.fixId!,
                    status: fixResult.status,
                    message: fixResult.message,
                };

                if (fixResult.status === 'applied') {
                    applied.push(itemReport);
                } else if (fixResult.status === 'skipped') {
                    skipped.push(itemReport);
                } else {
                    failed.push(itemReport);
                }
            } catch (ruleError) {
                failed.push({
                    ruleId: check.ruleId,
                    checkName: check.name,
                    fixId: check.fixId!,
                    status: 'failed',
                    message: ruleError instanceof Error ? ruleError.message : String(ruleError),
                });
            }
        }

        if (applied.length > 0 && isConfigDirty) {
            const configPath = path.join(cwd, 'components.json');
            await transaction.writeJson(configPath, mutableConfig, { spaces: 2 });
        }

        if (!options.dryRun) {
            try {
                await transaction.commit();
            } catch (error) {
                await transaction.rollback();
                throw new CliError('Failed to commit self-healing transaction', {
                    code: 'WRITE_FAILED',
                    cause: error,
                });
            }
        } else {
            await transaction.rollback();
        }

        // 重新诊断获取最新的权威报告
        const freshReport = await this.diagnose(options);

        return {
            applied,
            skipped,
            failed,
            totalAttempted: fixableChecks.length,
            configUpdated: isConfigDirty && applied.length > 0 && !options.dryRun,
            freshReport,
        };
    }
}
