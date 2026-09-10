import path from 'node:path';
import type { CheckResult, DiagnosticContext, DiagnosticRule, PlanFixResult, RepairAction } from '../types.js';
import { FixId } from '../types.js';
import {
    BRUTX_CSS_END_MARKER,
    BRUTX_CSS_START_MARKER,
    getBrutalistCssStyles,
    hasBrutxCssBlock,
    replaceBrutxCssBlock,
} from '../../constants.js';
import {
    computeRelativeImportSpecifier,
    injectImportStatement,
    scanCssGraph,
} from '../../css/index.js';
import { isSafePath } from '../../project.js';

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
                message: `CSS file not found: ${cssAlias}`,
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

        const graph = await scanCssGraph(cssPath, {
            cwd: ctx.projectContext.cwd,
            fs: ctx.fs,
            resolveAlias: (specifier: string) => ctx.projectContext.resolveAliasPath(specifier),
        });

        if (graph.missingImports.length > 0) {
            const missing = graph.missingImports[0];
            const relFrom = path.relative(ctx.projectContext.cwd, missing.from).replace(/\\/g, '/');
            return {
                ruleId: 'tailwind.tokens',
                category: 'tailwind',
                name: 'tailwind.css contains BrutxUI tokens',
                status: 'error',
                message: `Missing CSS import target "${missing.specifier}" referenced at ${relFrom}:${missing.line}`,
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

        if (tokensAlias) {
            const tokensPath = await ctx.projectContext.resolveAliasPath(tokensAlias);
            if (tokensPath !== cssPath) {
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

                const tokensGraph = await scanCssGraph(tokensPath, {
                    cwd: ctx.projectContext.cwd,
                    fs: ctx.fs,
                    resolveAlias: (specifier: string) => ctx.projectContext.resolveAliasPath(specifier),
                });

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

                if (!graph.hasBrutxTokens) {
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

                return {
                    ruleId: 'tailwind.tokens',
                    category: 'tailwind',
                    name: 'tailwind.css contains BrutxUI tokens',
                    status: 'pass',
                    message: 'CSS file contains BrutxUI tokens.',
                };
            }
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
        const cssAlias = ctx.config!.tailwind.css;
        const tokensAlias = ctx.config!.tailwind.tokensFile?.trim();
        const cssPath = await ctx.projectContext.resolveAliasPath(cssAlias);

        if (!(await isSafePath(cssPath, ctx.projectContext.cwd, ctx.fs))) {
            return {
                status: 'failed',
                reason: `Security Error: CSS path traversal detected. Access denied to path "${cssPath}".`,
            };
        }

        const brutalistCss = await getBrutalistCssStyles();
        const brutxBlock = `${BRUTX_CSS_START_MARKER}\n${brutalistCss}\n${BRUTX_CSS_END_MARKER}`;
        const actions: RepairAction[] = [];

        if (tokensAlias) {
            const tokensPath = await ctx.projectContext.resolveAliasPath(tokensAlias);
            if (tokensPath !== cssPath) {
                if (!(await isSafePath(tokensPath, ctx.projectContext.cwd, ctx.fs))) {
                    return {
                        status: 'failed',
                        reason: `Security Error: CSS path traversal detected. Access denied to path "${tokensPath}".`,
                    };
                }

                actions.push({
                    type: 'ensure-dir',
                    dirPath: path.dirname(tokensPath),
                    description: 'Ensure tokens directory exists',
                });

                let tokenContent: string;
                if (await ctx.fs.pathExists(tokensPath)) {
                    const existingTokens = await ctx.fs.readFile(tokensPath, 'utf-8');
                    if (hasBrutxCssBlock(existingTokens)) {
                        tokenContent = replaceBrutxCssBlock(existingTokens, brutxBlock);
                    } else {
                        const cleaned = existingTokens.trimEnd();
                        tokenContent = cleaned.length > 0 ? `${cleaned}\n${brutxBlock}` : brutxBlock;
                    }
                } else {
                    tokenContent = brutxBlock;
                }

                actions.push({
                    type: 'write-file',
                    filePath: tokensPath,
                    content: tokenContent,
                    description: 'Write BrutxUI tokens to tokens file',
                });

                actions.push({
                    type: 'ensure-dir',
                    dirPath: path.dirname(cssPath),
                    description: 'Ensure css directory exists',
                });

                const importSpecifier = computeRelativeImportSpecifier(cssPath, tokensPath);
                let mainContent = '';
                if (await ctx.fs.pathExists(cssPath)) {
                    mainContent = await ctx.fs.readFile(cssPath, 'utf-8');
                }

                if (hasBrutxCssBlock(mainContent)) {
                    mainContent = replaceBrutxCssBlock(mainContent, '').trimEnd();
                }

                if (mainContent.length > 0) {
                    mainContent = injectImportStatement(mainContent, importSpecifier);
                } else {
                    mainContent = `@import "tailwindcss";\n@import "${importSpecifier}";\n`;
                }

                actions.push({
                    type: 'write-file',
                    filePath: cssPath,
                    content: mainContent,
                    description: 'Import tokens file in main css',
                });

                return {
                    status: 'planned',
                    plan: {
                        fixId: FixId.InjectCssTokens,
                        ruleId: 'tailwind.tokens',
                        description: 'Injected BrutxUI CSS tokens into decoupled tokens file.',
                        actions,
                    },
                };
            }
        }

        let existing = '';
        if (await ctx.fs.pathExists(cssPath)) {
            existing = await ctx.fs.readFile(cssPath, 'utf-8');
        }

        let newContent: string;
        if (hasBrutxCssBlock(existing)) {
            newContent = replaceBrutxCssBlock(existing, brutxBlock);
        } else {
            const cleaned = existing
                .replaceAll(BRUTX_CSS_START_MARKER, '')
                .replaceAll(BRUTX_CSS_END_MARKER, '')
                .trimEnd();

            newContent = cleaned.length > 0
                ? `${cleaned}\n${brutxBlock}`
                : `@import "tailwindcss";\n${brutxBlock}`;
        }

        actions.push({
            type: 'ensure-dir',
            dirPath: path.dirname(cssPath),
            description: 'Ensure css directory exists',
        });
        actions.push({
            type: 'write-file',
            filePath: cssPath,
            content: newContent,
            description: 'Inject BrutxUI CSS tokens into tailwind.css',
        });

        return {
            status: 'planned',
            plan: {
                fixId: FixId.InjectCssTokens,
                ruleId: 'tailwind.tokens',
                description: 'Injected BrutxUI CSS tokens.',
                actions,
            },
        };
    },
};

export const tailwindRules: DiagnosticRule[] = [
    tailwindCssExistsRule,
    tailwindTokensRule,
];
