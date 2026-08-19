import path from 'path';
import type { CheckResult, DiagnosticContext, DiagnosticRepairContext, DiagnosticRule, RuleFixResult } from '../types.js';
import { FixId } from '../types.js';
import { CONFIG_FILES, CURRENT_CONFIG_VERSION, SCHEMA_URL } from '../../constants.js';

export const configExistsRule: DiagnosticRule = {
    id: 'config.exists',
    category: 'config',
    name: 'components.json exists',
    requiresConfig: false,
    async check(ctx: DiagnosticContext): Promise<CheckResult> {
        if (!ctx.config) {
            return {
                ruleId: 'config.exists',
                category: 'config',
                name: 'components.json exists',
                status: 'error',
                message: 'components.json not found. Run `brutx-vue init` first.',
            };
        }
        return {
            ruleId: 'config.exists',
            category: 'config',
            name: 'components.json exists',
            status: 'pass',
            message: 'components.json found.',
        };
    },
};

export const configSchemaRule: DiagnosticRule = {
    id: 'config.schema',
    category: 'config',
    name: '$schema field present',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult> {
        if (!ctx.config?.$schema) {
            return {
                ruleId: 'config.schema',
                category: 'config',
                name: '$schema field present',
                status: 'warn',
                message: '$schema field is missing.',
                fixId: FixId.AddSchema,
                fixDescription: 'Add $schema URL',
            };
        }
        return {
            ruleId: 'config.schema',
            category: 'config',
            name: '$schema field present',
            status: 'pass',
            message: '$schema field is present.',
        };
    },
    async fix(ctx: DiagnosticRepairContext): Promise<RuleFixResult> {
        ctx.mutableConfig.$schema = SCHEMA_URL;
        ctx.markConfigDirty();
        return {
            status: 'applied',
            message: 'Added $schema field.',
        };
    },
};

export const configVersionRule: DiagnosticRule = {
    id: 'config.version',
    category: 'config',
    name: 'config version',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult> {
        if (ctx.config?.$version === undefined) {
            return {
                ruleId: 'config.version',
                category: 'config',
                name: 'config version',
                status: 'warn',
                message: 'Configuration is missing version information.',
                fixId: FixId.AddConfigVersion,
                fixDescription: 'Add $version field',
            };
        }
        if (ctx.config.$version < CURRENT_CONFIG_VERSION) {
            return {
                ruleId: 'config.version',
                category: 'config',
                name: 'config version',
                status: 'warn',
                message: `Configuration version ${ctx.config.$version} is outdated (current: ${CURRENT_CONFIG_VERSION}). Migration may be needed.`,
                fixId: FixId.AddConfigVersion,
                fixDescription: `Update $version to ${CURRENT_CONFIG_VERSION}`,
            };
        }
        return {
            ruleId: 'config.version',
            category: 'config',
            name: 'config version',
            status: 'pass',
            message: `Configuration version is ${ctx.config.$version}.`,
        };
    },
    async fix(ctx: DiagnosticRepairContext): Promise<RuleFixResult> {
        ctx.mutableConfig.$version = CURRENT_CONFIG_VERSION;
        ctx.markConfigDirty();
        return {
            status: 'applied',
            message: `Set $version to ${CURRENT_CONFIG_VERSION}.`,
        };
    },
};

export const configStyleRule: DiagnosticRule = {
    id: 'config.style',
    category: 'config',
    name: 'style field present',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult> {
        if (!ctx.config?.style) {
            return {
                ruleId: 'config.style',
                category: 'config',
                name: 'style field present',
                status: 'warn',
                message: 'style field is missing.',
                fixId: FixId.SetStyle,
                fixDescription: 'Set style to "brutalism"',
            };
        }
        return {
            ruleId: 'config.style',
            category: 'config',
            name: 'style field present',
            status: 'pass',
            message: `style is "${ctx.config.style}".`,
        };
    },
    async fix(ctx: DiagnosticRepairContext): Promise<RuleFixResult> {
        ctx.mutableConfig.style = 'brutalism';
        ctx.markConfigDirty();
        return {
            status: 'applied',
            message: 'Set style to "brutalism".',
        };
    },
};

export const configDeprecatedPluginRule: DiagnosticRule = {
    id: 'config.deprecated-plugin',
    category: 'config',
    name: 'deprecated brutalism plugin',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult> {
        const candidates = Array.from(new Set([ctx.config?.tailwind.config, ...CONFIG_FILES.tailwind].filter(Boolean))) as string[];

        for (const candidate of candidates) {
            const configPath = path.resolve(ctx.cwd, candidate);
            if (!(await ctx.fs.pathExists(configPath))) continue;

            const stat = await ctx.fs.stat(configPath);
            if (stat.isDirectory()) continue;

            const content = await ctx.fs.readFile(configPath, 'utf-8');
            if (content.includes('brutx-ui-vue/brutalism-plugin') || content.includes('brutx-ui-vue/dist/brutalism-plugin')) {
                return {
                    ruleId: 'config.deprecated-plugin',
                    category: 'config',
                    name: 'deprecated brutalism plugin',
                    status: 'warn',
                    message: `${candidate} imports the deprecated empty brutalism plugin. Import BrutxUI styles via styles.css or preflight.css instead.`,
                };
            }
        }

        return {
            ruleId: 'config.deprecated-plugin',
            category: 'config',
            name: 'deprecated brutalism plugin',
            status: 'pass',
            message: 'No deprecated brutalism plugin import found.',
        };
    },
};

export const configRules: DiagnosticRule[] = [
    configExistsRule,
    configSchemaRule,
    configVersionRule,
    configStyleRule,
    configDeprecatedPluginRule,
];
