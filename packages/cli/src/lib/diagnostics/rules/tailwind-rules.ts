import type { CheckResult, DiagnosticContext, DiagnosticRepairContext, DiagnosticRule, RuleFixResult } from '../types.js';
import { FixId } from '../types.js';
import {
    BRUTX_CSS_END_MARKER,
    BRUTX_CSS_START_MARKER,
    getBrutalistCssStyles,
    hasBrutxCssBlock,
    replaceBrutxCssBlock,
} from '../../constants.js';

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

        const content = await ctx.fs.readFile(cssPath, 'utf-8');
        const hasCompleteBrutalistStyles = hasBrutxCssBlock(content);
        if (!hasCompleteBrutalistStyles) {
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
        const cssPath = await ctx.projectContext.resolveAliasPath(cssAlias);

        let existing = '';
        if (await ctx.fs.pathExists(cssPath)) {
            existing = await ctx.fs.readFile(cssPath, 'utf-8');
        }

        const brutalistCss = await getBrutalistCssStyles();
        const brutxBlock = `${BRUTX_CSS_START_MARKER}\n${brutalistCss}\n${BRUTX_CSS_END_MARKER}`;

        let newContent: string;
        if (hasBrutxCssBlock(existing)) {
            newContent = replaceBrutxCssBlock(existing, brutxBlock);
        } else {
            newContent = existing.length > 0
                ? (existing.endsWith('\n') ? `${existing}${brutxBlock}` : `${existing}\n${brutxBlock}`)
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
