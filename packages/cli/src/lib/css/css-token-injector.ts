import path from 'node:path';
import type { FileSystemAdapter } from '../fs/index.js';
import type { TailwindConfig } from '../types.js';
import type { RepairAction } from '../diagnostics/types.js';
import type { FileTransaction } from '../file-transaction.js';
import {
    BRUTX_CSS_END_MARKER,
    BRUTX_CSS_START_MARKER,
    getBrutalistCssStyles,
    hasBrutxCssBlock,
    replaceBrutxCssBlock,
} from '../constants.js';
import {
    computeRelativeImportSpecifier,
    injectImportStatement,
} from './css-dependency-graph.js';
import { isSafePath } from '../security.js';

export interface CssTokenPlanContext {
    cwd: string;
    tailwind: TailwindConfig;
    fs: FileSystemAdapter;
    tokensCss?: string;
    resolveAlias?: (specifier: string) => Promise<string> | string;
}

export interface CssTokenPlan {
    readonly hasChanges: boolean;
    readonly actions: readonly RepairAction[];
    readonly mainCssPath: string;
    readonly tokensPath: string | null;
}

export async function planCssTokenInjection(
    context: CssTokenPlanContext
): Promise<CssTokenPlan> {
    const { cwd, tailwind, fs } = context;

    const fullMainPath = context.resolveAlias
        ? await context.resolveAlias(tailwind.css)
        : path.resolve(cwd, tailwind.css);

    if (!(await isSafePath(fullMainPath, cwd, fs))) {
        throw new Error(`Security Error: CSS path traversal detected. Access denied to path "${fullMainPath}".`);
    }

    const brutalistCss = context.tokensCss ?? (await getBrutalistCssStyles());
    const brutxBlock = `${BRUTX_CSS_START_MARKER}\n${brutalistCss}\n${BRUTX_CSS_END_MARKER}`;

    const resolveForCompare = async (targetPath: string): Promise<string> => {
        try {
            return await fs.realpath(targetPath);
        } catch {
            return path.resolve(targetPath);
        }
    };

    const trimmedTokensFile = tailwind.tokensFile?.trim();
    let fullTokensPath: string | null = null;
    if (trimmedTokensFile) {
        fullTokensPath = context.resolveAlias
            ? await context.resolveAlias(trimmedTokensFile)
            : path.resolve(cwd, trimmedTokensFile);
    }

    const actions: RepairAction[] = [];

    if (
        fullTokensPath &&
        (await resolveForCompare(fullTokensPath)) !== (await resolveForCompare(fullMainPath))
    ) {
        if (!(await isSafePath(fullTokensPath, cwd, fs))) {
            throw new Error(`Security Error: CSS path traversal detected. Access denied to path "${fullTokensPath}".`);
        }

        actions.push({
            type: 'ensure-dir',
            dirPath: path.dirname(fullTokensPath),
            description: 'Ensure tokens directory exists',
        });

        let tokenContent: string;
        let existingTokens = '';
        const tokensExist = await fs.pathExists(fullTokensPath);
        if (tokensExist) {
            existingTokens = await fs.readFile(fullTokensPath, 'utf-8');
            if (hasBrutxCssBlock(existingTokens)) {
                tokenContent = replaceBrutxCssBlock(existingTokens, brutxBlock);
            } else {
                const cleaned = existingTokens
                    .replaceAll(BRUTX_CSS_START_MARKER, '')
                    .replaceAll(BRUTX_CSS_END_MARKER, '')
                    .trimEnd();
                tokenContent = cleaned.length > 0 ? `${cleaned}\n${brutxBlock}` : brutxBlock;
            }
        } else {
            tokenContent = brutxBlock;
        }

        if (!tokensExist || tokenContent !== existingTokens) {
            actions.push({
                type: 'write-file',
                filePath: fullTokensPath,
                content: tokenContent,
                description: 'Write BrutxUI tokens to tokens file',
            });
        }

        actions.push({
            type: 'ensure-dir',
            dirPath: path.dirname(fullMainPath),
            description: 'Ensure css directory exists',
        });

        const importSpecifier = computeRelativeImportSpecifier(fullMainPath, fullTokensPath);
        let mainContent: string;
        let existingMain = '';
        const mainExists = await fs.pathExists(fullMainPath);
        if (mainExists) {
            existingMain = await fs.readFile(fullMainPath, 'utf-8');
            mainContent = existingMain;
            if (hasBrutxCssBlock(mainContent)) {
                mainContent = replaceBrutxCssBlock(mainContent, '').trimEnd();
            } else {
                mainContent = mainContent
                    .replaceAll(BRUTX_CSS_START_MARKER, '')
                    .replaceAll(BRUTX_CSS_END_MARKER, '')
                    .trimEnd();
            }
            mainContent = injectImportStatement(mainContent, importSpecifier);
        } else {
            mainContent = `@import "tailwindcss";\n@import "${importSpecifier}";\n`;
        }

        if (!mainExists || mainContent !== existingMain) {
            actions.push({
                type: 'write-file',
                filePath: fullMainPath,
                content: mainContent,
                description: 'Write main CSS imports',
            });
        }

        const hasChanges = actions.some((a) => a.type === 'write-file');
        return {
            hasChanges,
            actions,
            mainCssPath: fullMainPath,
            tokensPath: fullTokensPath,
        };
    }

    actions.push({
        type: 'ensure-dir',
        dirPath: path.dirname(fullMainPath),
        description: 'Ensure css directory exists',
    });

    let content: string;
    let existingMain = '';
    const exists = await fs.pathExists(fullMainPath);
    if (exists) {
        existingMain = await fs.readFile(fullMainPath, 'utf-8');
        if (hasBrutxCssBlock(existingMain)) {
            content = replaceBrutxCssBlock(existingMain, brutxBlock);
        } else {
            const cleaned = existingMain
                .replaceAll(BRUTX_CSS_START_MARKER, '')
                .replaceAll(BRUTX_CSS_END_MARKER, '')
                .trimEnd();
            content = cleaned.length > 0
                ? `${cleaned}\n${brutxBlock}`
                : `@import "tailwindcss";\n${brutxBlock}`;
        }
    } else {
        content = `@import "tailwindcss";\n${brutxBlock}`;
    }

    if (!exists || content !== existingMain) {
        actions.push({
            type: 'write-file',
            filePath: fullMainPath,
            content,
            description: 'Write BrutxUI tokens to main CSS file',
        });
    }

    const hasChanges = actions.some((a) => a.type === 'write-file');
    return {
        hasChanges,
        actions,
        mainCssPath: fullMainPath,
        tokensPath: null,
    };
}

export async function applyCssTokenPlan(
    plan: CssTokenPlan,
    transaction: FileTransaction
): Promise<void> {
    for (const action of plan.actions) {
        if (action.type === 'ensure-dir') {
            await transaction.ensureDir(action.dirPath);
        } else if (action.type === 'write-file') {
            await transaction.writeFile(action.filePath, action.content);
        }
    }
}
