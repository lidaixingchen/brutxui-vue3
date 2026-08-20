import path from 'path';
import type { CheckResult, DiagnosticContext, DiagnosticRepairContext, DiagnosticRule, RuleFixResult } from '../types.js';
import { FixId } from '../types.js';
import { BASE_DEPENDENCIES, CN_FUNCTION_BODY_TEMPLATE, UTILS_TEMPLATE } from '../../constants.js';

export const UTILS_EXTENSIONS = ['.ts', '.js', '.mts', '.mjs'] as const;

export async function resolveUtilsBasePath(ctx: DiagnosticContext): Promise<string> {
    if (ctx.config?.sharedBase) {
        return path.join(await ctx.projectContext.resolveAliasPath(ctx.config.sharedBase), 'utils');
    }
    const utilsAlias = ctx.config?.aliases?.utils ?? '@/lib/utils';
    return await ctx.projectContext.resolveAliasPath(utilsAlias);
}

export async function findExistingUtilsFile(ctx: DiagnosticContext): Promise<string | null> {
    const basePath = await resolveUtilsBasePath(ctx);
    for (const ext of UTILS_EXTENSIONS) {
        const fullPath = basePath + ext;
        if (await ctx.fs.pathExists(fullPath)) {
            return fullPath;
        }
    }
    return null;
}

export const structureAliasesRule: DiagnosticRule = {
    id: 'structure.aliases',
    category: 'structure',
    name: 'components directory exists',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult> {
        const componentsDir = await ctx.projectContext.resolveComponentsDir();
        const exists = await ctx.fs.pathExists(componentsDir);

        return {
            ruleId: 'structure.aliases',
            category: 'structure',
            name: `aliases.components → ${ctx.config!.aliases.components}`,
            status: exists ? 'pass' : 'warn',
            message: exists ? 'Directory exists.' : 'Directory does not exist.',
            fixId: FixId.CreateComponentsDir,
            fixDescription: 'Create directory',
        };
    },
    async fix(ctx: DiagnosticRepairContext): Promise<RuleFixResult> {
        const componentsDir = await ctx.projectContext.resolveComponentsDir();
        await ctx.transaction.ensureDir(componentsDir);
        return {
            status: 'applied',
            message: 'Created components directory.',
        };
    },
};

export const structureUtilsFileRule: DiagnosticRule = {
    id: 'structure.utils-file',
    category: 'structure',
    name: 'utils file exists',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult> {
        const existingUtilsFile = await findExistingUtilsFile(ctx);
        const displayName = ctx.config?.sharedBase
            ? `sharedBase/utils (${ctx.config.sharedBase}/utils)`
            : `aliases.utils → ${ctx.config?.aliases?.utils ?? '@/lib/utils'}`;

        if (!existingUtilsFile) {
            return {
                ruleId: 'structure.utils-file',
                category: 'structure',
                name: displayName,
                status: 'error',
                message: 'File does not exist.',
                fixId: FixId.CreateUtilsFile,
                fixDescription: 'Create utils file',
            };
        }

        return {
            ruleId: 'structure.utils-file',
            category: 'structure',
            name: displayName,
            status: 'pass',
            message: 'File exists.',
        };
    },
    async fix(ctx: DiagnosticRepairContext): Promise<RuleFixResult> {
        const basePath = await resolveUtilsBasePath(ctx);
        const targetPath = basePath + '.ts';
        await ctx.transaction.writeFile(targetPath, UTILS_TEMPLATE);
        return {
            status: 'applied',
            message: 'Created utils file.',
        };
    },
};

export const structureUtilsCnRule: DiagnosticRule = {
    id: 'structure.utils-cn',
    category: 'structure',
    name: 'cn() utility function and FOCUS_RING_CLASSES exist',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult> {
        const existingUtilsFile = await findExistingUtilsFile(ctx);
        if (!existingUtilsFile) {
            return {
                ruleId: 'structure.utils-cn',
                category: 'structure',
                name: 'cn() function and FOCUS_RING_CLASSES exist',
                status: 'error',
                message: 'Utils file not found.',
                fixId: FixId.AddCnFunction,
                fixDescription: 'Create utils file with cn() function and FOCUS_RING_CLASSES',
            };
        }

        const content = await ctx.fs.readFile(existingUtilsFile, 'utf-8');
        const hasCnDeclaration = /^\s*export\s+(?:function|const)\s+cn\b/m.test(content);
        const hasFocusRing = /^\s*export\s+const\s+FOCUS_RING_CLASSES\b/m.test(content);
        const hasBrutalMerge = /extendTailwindMerge|BRUTAL_COLOR_NAMES|brutal-primary/.test(content);

        if (!hasCnDeclaration) {
            return {
                ruleId: 'structure.utils-cn',
                category: 'structure',
                name: 'cn() function and FOCUS_RING_CLASSES exist',
                status: 'error',
                message: 'cn() function not found in utils file.',
                fixId: FixId.AddCnFunction,
                fixDescription: 'Add cn() function and FOCUS_RING_CLASSES to utils file',
            };
        }

        if (!hasFocusRing) {
            return {
                ruleId: 'structure.utils-cn',
                category: 'structure',
                name: 'cn() function and FOCUS_RING_CLASSES exist',
                status: 'warn',
                message: 'FOCUS_RING_CLASSES not found in utils file. Components relying on standard focus ring may fail to compile.',
                fixId: FixId.AddCnFunction,
                fixDescription: 'Add FOCUS_RING_CLASSES to utils file',
            };
        }

        if (!hasBrutalMerge) {
            return {
                ruleId: 'structure.utils-cn',
                category: 'structure',
                name: 'cn() function and FOCUS_RING_CLASSES exist',
                status: 'warn',
                message: 'cn() utility uses standard twMerge without Brutalism color extensions. Custom color overrides may not resolve conflicts deterministically.',
                fixId: FixId.AddCnFunction,
                fixDescription: 'Upgrade cn() with extendTailwindMerge and Brutalism colors',
            };
        }

        return {
            ruleId: 'structure.utils-cn',
            category: 'structure',
            name: 'cn() function and FOCUS_RING_CLASSES exist',
            status: 'pass',
            message: 'cn() function and FOCUS_RING_CLASSES found with Brutalism color extensions.',
        };
    },
    async fix(ctx: DiagnosticRepairContext): Promise<RuleFixResult> {
        const existingUtilsFile = await findExistingUtilsFile(ctx);
        if (!existingUtilsFile) {
            return {
                status: 'failed',
                message: 'Utils file not found on disk. Create utils file first.',
            };
        }

        let existing = await ctx.fs.readFile(existingUtilsFile, 'utf-8');
        const hasCnDeclaration = /^\s*export\s+(?:function|const)\s+cn\b/m.test(existing);
        const hasFocusRing = /^\s*export\s+const\s+FOCUS_RING_CLASSES\b/m.test(existing);
        const hasBrutalMerge = /extendTailwindMerge|BRUTAL_COLOR_NAMES|brutal-primary/.test(existing);

        if (hasCnDeclaration && hasFocusRing && hasBrutalMerge) {
            return {
                status: 'skipped',
                message: 'cn() function and FOCUS_RING_CLASSES are already fully configured.',
            };
        }

        if (!hasCnDeclaration) {
            const importLines: string[] = [];
            if (!/^\s*import\b.*?\bfrom\s+["']clsx["']/m.test(existing)) {
                importLines.push('import { type ClassValue, clsx } from "clsx";');
            }
            if (!/^\s*import\b.*?\bfrom\s+["']tailwind-merge["']/m.test(existing)) {
                importLines.push('import { extendTailwindMerge } from "tailwind-merge";');
            } else if (!/extendTailwindMerge/.test(existing)) {
                existing = existing.replace(
                    /import\s+\{([^}]+)\}\s+from\s+["']tailwind-merge["']/,
                    'import { $1, extendTailwindMerge } from "tailwind-merge"',
                );
            }

            const addition = importLines.length > 0
                ? `${importLines.join('\n')}\n${CN_FUNCTION_BODY_TEMPLATE}`
                : CN_FUNCTION_BODY_TEMPLATE;

            const newContent = existing.trim().length > 0 ? `${existing}\n${addition}` : addition;
            await ctx.transaction.writeFile(existingUtilsFile, newContent);

            return {
                status: 'applied',
                message: 'Added cn() function with Brutalism color extensions and FOCUS_RING_CLASSES.',
            };
        }

        let modified = existing;

        if (!hasFocusRing) {
            const focusRingDeclaration = `export const FOCUS_RING_CLASSES =
    "focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden";
`;
            modified = `${modified.trim()}\n\n${focusRingDeclaration}`;
        }

        if (!hasBrutalMerge) {
            if (!/^\s*import\b.*?\bfrom\s+["']tailwind-merge["']/m.test(modified)) {
                modified = `import { extendTailwindMerge } from "tailwind-merge";\n${modified}`;
            } else if (!/extendTailwindMerge/.test(modified)) {
                modified = modified.replace(
                    /import\s+\{([^}]+)\}\s+from\s+["']tailwind-merge["']/,
                    'import { $1, extendTailwindMerge } from "tailwind-merge"',
                );
            }

            const colorAndMergeBlock = CN_FUNCTION_BODY_TEMPLATE.replace(
                /export\s+const\s+FOCUS_RING_CLASSES[\s\S]*?;/,
                '',
            ).trim();

            if (/^\s*export\s+(?:function|const)\s+cn\b[\s\S]*?\{[\s\S]*?\}/m.test(modified)) {
                modified = modified.replace(
                    /^\s*export\s+(?:function|const)\s+cn\b[\s\S]*?\{[\s\S]*?\}/m,
                    colorAndMergeBlock,
                );
            } else {
                modified = `${modified.trim()}\n\n${colorAndMergeBlock}`;
            }
        }

        await ctx.transaction.writeFile(existingUtilsFile, modified);

        return {
            status: 'applied',
            message: 'Upgraded utils file with Brutalism color extensions and FOCUS_RING_CLASSES.',
        };
    },
};

export const structureDependenciesRule: DiagnosticRule = {
    id: 'structure.dependencies',
    category: 'structure',
    name: 'package dependencies',
    requiresConfig: true,
    async check(ctx: DiagnosticContext): Promise<CheckResult[]> {
        const results: CheckResult[] = [];
        const packageJsonPath = path.join(ctx.cwd, 'package.json');

        if (!(await ctx.fs.pathExists(packageJsonPath))) {
            return results;
        }

        let packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
        try {
            packageJson = await ctx.fs.readJson(packageJsonPath);
        } catch {
            return results;
        }

        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };

        const workspaceRoot = ctx.projectContext.env.workspaceRoot;
        if (workspaceRoot && workspaceRoot !== path.resolve(ctx.cwd)) {
            const rootPkgPath = path.join(workspaceRoot, 'package.json');
            if (await ctx.fs.pathExists(rootPkgPath)) {
                try {
                    const rootPkg = await ctx.fs.readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(rootPkgPath);
                    Object.assign(allDeps, rootPkg.dependencies, rootPkg.devDependencies);
                } catch {
                    // Ignore error
                }
            }
        }

        const requiredDeps = BASE_DEPENDENCIES.filter(dep => dep !== '@lucide/vue');
        const optionalDeps = ['@lucide/vue'];

        for (const dep of requiredDeps) {
            const installed = dep in allDeps;
            results.push({
                ruleId: 'structure.dependencies',
                category: 'structure',
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
                ruleId: 'structure.dependencies',
                category: 'structure',
                name: `${dep} installed (optional)`,
                status: installed ? 'pass' : 'warn',
                message: installed
                    ? `${allDeps[dep]} installed.`
                    : `Optional dependency not installed (needed for icon components).`,
            });
        }

        return results;
    },
};

export const structureRules: DiagnosticRule[] = [
    structureAliasesRule,
    structureUtilsFileRule,
    structureUtilsCnRule,
    structureDependenciesRule,
];
