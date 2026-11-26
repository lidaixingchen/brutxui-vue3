import path from 'node:path';
import type { CheckResult, DiagnosticContext, DiagnosticRule, PlanFixResult } from '../types.js';
import { FixId } from '../types.js';
import {
    planCssTokenInjection,
    scanCssGraph,
} from '../../css/index.js';

export const tailwindCssExistsRule: DiagnosticRule = {
    id: 'tailwind.css-exists',
    category: 'tailwind',
    name: 'tailwind.css points to real file',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult> {
        const cssAlias = ctx.config!.tailwind.css;
        const cssPath = await ctx.projectContext.resolveAliasPath(cssAlias);

        if (!(await ctx.fs.pathExists(cssPath))) {
            return {
                ruleId: 'tailwind.css-exists',
                category: 'tailwind',
                name: 'tailwind.css points to real file',
                status: 'error',
                message: `CSS file not found: ${cssAlias} (resolved to: ${cssPath})`,
                fixId: FixId.InjectCssTokens,
                fixDescription: 'Create CSS file and inject BrutxUI tokens',
            };
        }

        return {
            ruleId: 'tailwind.css-exists',
            category: 'tailwind',
            name: 'tailwind.css points to real file',
            status: 'pass',
            message: 'CSS file exists.',
        };
    },
};

export const tailwindTokensRule: DiagnosticRule = {
    id: 'tailwind.tokens',
    category: 'tailwind',
    name: 'tailwind.css contains BrutxUI tokens',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult> {
        const cssAlias = ctx.config!.tailwind.css;
        const tokensAlias = ctx.config!.tailwind.tokensFile?.trim();
        const cssPath = await ctx.projectContext.resolveAliasPath(cssAlias);

        if (!(await ctx.fs.pathExists(cssPath))) {
            return {
                ruleId: 'tailwind.tokens',
                category: 'tailwind',
                name: 'tailwind.css contains BrutxUI tokens',
                status: 'warn',
                message: `CSS file not found: ${cssAlias}`,
            };
        }

        const graphOptions = {
            cwd: ctx.projectContext.cwd,
            fs: ctx.fs,
            resolveAlias: (specifier: string) => ctx.projectContext.resolveAliasPath(specifier),
            tsConfig: ctx.projectContext.tsConfig,
        };
        const graph = await scanCssGraph(cssPath, graphOptions);

        const tokensPath = tokensAlias ? await ctx.projectContext.resolveAliasPath(tokensAlias) : null;
        if (graph.missingImports.length > 0) {
            const missing = graph.missingImports[0];
            const isTokensImport = tokensPath !== null && graph.nodes.get(missing.from)?.imports.some(
                item => item.line === missing.line && item.specifier === missing.specifier && item.resolvedPath === tokensPath
            );
            const relFrom = path.relative(ctx.projectContext.cwd, missing.from).replace(/\\/g, '/');
            return {
                ruleId: 'tailwind.tokens',
                category: 'tailwind',
                name: 'tailwind.css contains BrutxUI tokens',
                status: 'error',
                message: `Missing CSS import target "${missing.specifier}" referenced at ${relFrom}:${missing.line}`,
                ...(isTokensImport ? {
                    fixId: FixId.InjectCssTokens,
                    fixDescription: 'Inject BrutxUI CSS tokens into decoupled tokens file',
                } : {}),
            };
        }

        if (graph.circularPaths.length > 0) {
            const cycleStr = graph.circularPaths[0]
                .map(p => path.relative(ctx.projectContext.cwd, p).replace(/\\/g, '/'))
                .join(' -> ');
            return {
                ruleId: 'tailwind.tokens',
                category: 'tailwind',
                name: 'tailwind.css contains BrutxUI tokens',
                status: 'error',
                message: `Circular CSS import detected: ${cycleStr}`,
            };
        }

        const resolveRealPath = (filePath: string) => ctx.fs.realpath(filePath).catch(() => filePath);
        if (tokensPath && tokensPath !== cssPath && await resolveRealPath(tokensPath) !== await resolveRealPath(cssPath)) {
            if (!(await ctx.fs.pathExists(tokensPath))) {
                return {
                    ruleId: 'tailwind.tokens',
                    category: 'tailwind',
                    name: 'tailwind.css contains BrutxUI tokens',
                    status: 'error',
                    message: `Tokens file does not exist: ${tokensAlias}`,
                    fixId: FixId.InjectCssTokens,
                    fixDescription: 'Inject BrutxUI CSS tokens into decoupled tokens file and import it',
                };
            }

            const tokensGraph = await scanCssGraph(tokensPath, graphOptions);

            if (!tokensGraph.hasBrutxTokens) {
                return {
                    ruleId: 'tailwind.tokens',
                    category: 'tailwind',
                    name: 'tailwind.css contains BrutxUI tokens',
                    status: 'error',
                    message: `Tokens file exists but missing BrutxUI tokens: ${tokensAlias}`,
                    fixId: FixId.InjectCssTokens,
                    fixDescription: 'Inject BrutxUI CSS tokens',
                };
            }

            if (!graph.nodes.has(tokensGraph.rootNode.absolutePath)) {
                return {
                    ruleId: 'tailwind.tokens',
                    category: 'tailwind',
                    name: 'tailwind.css contains BrutxUI tokens',
                    status: 'error',
                    message: `Tokens file contains tokens but main CSS does not import it: ${cssAlias} -> ${tokensAlias}`,
                    fixId: FixId.InjectCssTokens,
                    fixDescription: 'Inject BrutxUI CSS tokens',
                };
            }

            if (graph.rootNode.hasTokensBlock) {
                return {
                    ruleId: 'tailwind.tokens',
                    category: 'tailwind',
                    name: 'tailwind.css contains BrutxUI tokens',
                    status: 'error',
                    message: `Main CSS still contains inline BrutxUI tokens: ${cssAlias}`,
                    fixId: FixId.InjectCssTokens,
                    fixDescription: 'Keep BrutxUI CSS tokens in the decoupled tokens file',
                };
            }

            return {
                ruleId: 'tailwind.tokens',
                category: 'tailwind',
                name: 'tailwind.css contains BrutxUI tokens',
                status: 'pass',
                message: 'CSS file contains BrutxUI tokens.',
            };
        }

        if (!graph.hasBrutxTokens) {
            return {
                ruleId: 'tailwind.tokens',
                category: 'tailwind',
                name: 'tailwind.css contains BrutxUI tokens',
                status: 'error',
                message: `CSS file exists but missing BrutxUI tokens: ${cssAlias}`,
                fixId: FixId.InjectCssTokens,
                fixDescription: 'Inject BrutxUI CSS tokens',
            };
        }

        return {
            ruleId: 'tailwind.tokens',
            category: 'tailwind',
            name: 'tailwind.css contains BrutxUI tokens',
            status: 'pass',
            message: 'CSS file contains BrutxUI tokens.',
        };
    },
    async planFix(ctx: DiagnosticContext): Promise<PlanFixResult> {
        try {
            const plan = await planCssTokenInjection({
                cwd: ctx.projectContext.cwd,
                tailwind: ctx.config!.tailwind,
                fs: ctx.fs,
                resolveAlias: (alias) => ctx.projectContext.resolveAliasPath(alias),
                tsConfig: ctx.projectContext.tsConfig,
            });

            if (!plan.hasChanges) {
                return { status: 'skipped', reason: 'CSS already contains BrutxUI tokens.' };
            }

            const description = plan.tokensPath
                ? 'Injected BrutxUI CSS tokens into decoupled tokens file.'
                : 'Injected BrutxUI CSS tokens.';

            return {
                status: 'planned',
                plan: {
                    fixId: FixId.InjectCssTokens,
                    ruleId: 'tailwind.tokens',
                    description,
                    actions: plan.actions,
                },
            };
        } catch (error) {
            return {
                status: 'failed',
                reason: error instanceof Error ? error.message : String(error),
            };
        }
    },
};

export const tailwindRules: DiagnosticRule[] = [
    tailwindCssExistsRule,
    tailwindTokensRule,
];
