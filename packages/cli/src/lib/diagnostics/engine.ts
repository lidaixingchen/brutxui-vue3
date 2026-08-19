import path from 'path';
import type {
    CheckResult,
    CheckStatus,
    DiagnoseOptions,
    DiagnosticCategory,
    DiagnosticContext,
    DiagnosticReport,
    DiagnosticRule,
    DiagnosticSummary,
} from './types.js';
import { BUILTIN_RULES } from './rules/index.js';
import { ProjectContext } from '../project-context.js';
import { readManifest } from '../manifest.js';

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

    constructor(customRules?: DiagnosticRule[]) {
        this.rules = customRules ? [...customRules] : [...BUILTIN_RULES];
    }

    getRegisteredRules(): readonly DiagnosticRule[] {
        return this.rules;
    }

    async diagnose(options: DiagnoseOptions = {}): Promise<DiagnosticReport> {
        const cwd = path.resolve(options.cwd ?? process.cwd());
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
}
