import { createJiti } from 'jiti';
import path from 'path';
import type { CheckResult, DiagnosticRule } from './types.js';

/**
 * 定义单个 BrutxUI 诊断规则（提供完整的 TypeScript 类型推导）
 */
export function defineDiagnosticRule(rule: DiagnosticRule): DiagnosticRule {
    return rule;
}

/**
 * 批量定义 BrutxUI 诊断规则插件
 */
export function defineDiagnosticRules(rules: DiagnosticRule[]): DiagnosticRule[] {
    return rules;
}

export class CustomRuleLoader {
    private readonly jiti: ReturnType<typeof createJiti>;

    constructor(private readonly cwd: string) {
        this.jiti = createJiti(cwd, {
            interopDefault: true,
            cache: false,
        });
    }

    async loadPlugin(pluginPath: string): Promise<DiagnosticRule[]> {
        const resolvedPath = pluginPath.startsWith('.')
            ? path.resolve(this.cwd, pluginPath)
            : pluginPath;

        try {
            const rawModule = await this.jiti.import(resolvedPath);
            const exported = (rawModule && typeof rawModule === 'object' && 'default' in rawModule)
                ? (rawModule as { default: unknown }).default
                : rawModule;

            const rulesArray = Array.isArray(exported) ? exported : [exported];
            const validRules = rulesArray.filter((r): r is DiagnosticRule => this.validateRuleContract(r));

            if (validRules.length === 0) {
                return [
                    this.createLoaderErrorRule(
                        pluginPath,
                        `Plugin ${pluginPath} did not export any valid DiagnosticRule.`
                    ),
                ];
            }

            return validRules;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return [
                this.createLoaderErrorRule(pluginPath, message),
            ];
        }
    }

    private createLoaderErrorRule(pluginPath: string, message: string): DiagnosticRule {
        const baseName = path.basename(pluginPath).replace(/[^a-zA-Z0-9_-]/g, '-');
        const ruleId = `custom.loader-error.${baseName}`;
        return {
            id: ruleId,
            category: 'custom',
            name: `Plugin Load Error: ${path.basename(pluginPath)}`,
            defaultSeverity: 'error',
            check: async (): Promise<CheckResult> => ({
                ruleId,
                category: 'custom',
                name: `Failed to load plugin: ${path.basename(pluginPath)}`,
                status: 'error',
                message,
                location: {
                    file: pluginPath,
                },
            }),
        };
    }

    private validateRuleContract(rule: unknown): rule is DiagnosticRule {
        return (
            typeof rule === 'object' &&
            rule !== null &&
            'id' in rule &&
            typeof (rule as DiagnosticRule).id === 'string' &&
            'check' in rule &&
            typeof (rule as DiagnosticRule).check === 'function'
        );
    }
}
