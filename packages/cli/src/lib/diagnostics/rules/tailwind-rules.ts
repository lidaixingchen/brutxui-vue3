import path from 'node:path';
import type { CheckResult, DiagnosticContext, DiagnosticRepairContext, DiagnosticRule, RuleFixResult } from '../types.js';
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
        const tokensAlias = ctx.config!.tailwind.tokensFile;
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
            const tokensExist = await ctx.fs.pathExists(tokensPath);
            let tokensValid = false;
            if (tokensExist) {
                const tokenContent = await ctx.fs.readFile(tokensPath, 'utf-8');
                tokensValid = hasBrutxCssBlock(tokenContent);
            }

            const isImported = graph.nodes.has(tokensPath);

            if (!tokensValid || !isImported) {
                return {
                    ruleId: 'tailwind.tokens',
                    category: 'tailwind',
                    name: 'tailwind.css contains BrutxUI tokens',
                    status: 'error',
                    message: !tokensValid
                        ? `Decoupled tokens file missing or incomplete: ${tokensAlias}`
                        : `Main CSS does not import decoupled tokens file: ${tokensAlias}`,
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
    async fix(ctx: DiagnosticRepairContext): Promise<RuleFixResult> {
        const cssAlias = ctx.config!.tailwind.css;
        const tokensAlias = ctx.config!.tailwind.tokensFile;
        const cssPath = await ctx.projectContext.resolveAliasPath(cssAlias);

        if (!(await isSafePath(cssPath, ctx.projectContext.cwd, ctx.fs))) {
            throw new Error(`Security Error: CSS path traversal detected. Access denied to path "${cssPath}".`);
        }

        const brutalistCss = await getBrutalistCssStyles();
        const brutxBlock = `${BRUTX_CSS_START_MARKER}\n${brutalistCss}\n${BRUTX_CSS_END_MARKER}`;

        if (tokensAlias) {
            const tokensPath = await ctx.projectContext.resolveAliasPath(tokensAlias);
            if (!(await isSafePath(tokensPath, ctx.projectContext.cwd, ctx.fs))) {
                throw new Error(`Security Error: CSS path traversal detected. Access denied to path "${tokensPath}".`);
            }

            await ctx.transaction.ensureDir(path.dirname(tokensPath));

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
            await ctx.transaction.writeFile(tokensPath, tokenContent);

            await ctx.transaction.ensureDir(path.dirname(cssPath));
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

            await ctx.transaction.writeFile(cssPath, mainContent);

            return {
                status: 'applied',
                message: 'Injected BrutxUI CSS tokens into decoupled tokens file.',
            };
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

        await ctx.transaction.writeFile(cssPath, newContent);

        return {
            status: 'applied',
            message: 'Injected BrutxUI CSS tokens.',
        };
    },
};

export const tailwindRules: DiagnosticRule[] = [
    tailwindCssExistsRule,
    tailwindTokensRule,
];
