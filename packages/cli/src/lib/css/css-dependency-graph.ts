import path from 'node:path';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import { hasBrutxCssBlock } from '../constants.js';
import { getTsConfigPathCandidates, type ResolvedTsConfig } from '../env-detector.js';

export interface CssImportStatement {
    readonly specifier: string;
    readonly modifiers: string;
    readonly isExternal: boolean;
    readonly line: number;
    readonly start: number;
    readonly end: number;
    readonly resolvedPath: string | null;
}

export interface CssNode {
    readonly absolutePath: string;
    readonly relativePath: string;
    readonly exists: boolean;
    readonly content: string;
    readonly imports: CssImportStatement[];
    readonly hasTokensBlock: boolean;
    readonly hasTailwindCore: boolean;
    readonly hasThemeBlock: boolean;
}

export interface CssDependencyGraph {
    readonly rootNode: CssNode;
    readonly nodes: ReadonlyMap<string, CssNode>;
    readonly circularPaths: string[][];
    readonly missingImports: { from: string; specifier: string; line: number }[];
    readonly hasBrutxTokens: boolean;
    readonly tokenNodePaths: string[];
}

export interface CssGraphScanOptions {
    readonly cwd: string;
    readonly fs: FileSystemAdapter;
    readonly resolveAlias?: (specifier: string) => Promise<string> | string;
    readonly tsConfig?: ResolvedTsConfig | null;
}

const THEME_PATTERN = /@theme\s*\{/;
const TW_CORE_PATTERN = /@import\s+['"]tailwindcss['"][^;]*;/;
const EXTERNAL_URL_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export function stripCssComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, match => match.replace(/[^\r\n]/g, ' '));
}

export async function scanCssGraph(
    entryPath: string,
    options: CssGraphScanOptions,
    entryContent?: string
): Promise<CssDependencyGraph> {
    const { fs, cwd, resolveAlias, tsConfig } = options;
    const rootPath = path.resolve(cwd, entryPath);
    const { '*': _catchAll, ...explicitPaths } = tsConfig?.compilerOptions?.paths ?? {};
    const aliasConfig = tsConfig && {
        ...tsConfig,
        compilerOptions: { ...tsConfig.compilerOptions, paths: explicitPaths },
    };
    const nodes = new Map<string, CssNode>();
    const circularPaths: string[][] = [];
    const missingImports: { from: string; specifier: string; line: number }[] = [];
    const tokenNodePaths: string[] = [];

    async function traverse(currentPath: string, visitStack: string[]): Promise<void> {
        const normalizedPath = path.resolve(cwd, currentPath);

        if (visitStack.includes(normalizedPath)) {
            circularPaths.push([...visitStack, normalizedPath]);
            return;
        }

        if (nodes.has(normalizedPath)) {
            return;
        }

        const contentOverride = normalizedPath === rootPath ? entryContent : undefined;
        const exists = contentOverride !== undefined || await fs.pathExists(normalizedPath);
        if (!exists) {
            const rel = path.relative(cwd, normalizedPath).replace(/\\/g, '/');
            nodes.set(normalizedPath, {
                absolutePath: normalizedPath,
                relativePath: rel,
                exists: false,
                content: '',
                imports: [],
                hasTokensBlock: false,
                hasTailwindCore: false,
                hasThemeBlock: false,
            });
            return;
        }

        let content: string;
        try {
            content = contentOverride ?? await fs.readFile(normalizedPath, 'utf-8');
        } catch {
            const rel = path.relative(cwd, normalizedPath).replace(/\\/g, '/');
            nodes.set(normalizedPath, {
                absolutePath: normalizedPath,
                relativePath: rel,
                exists: false,
                content: '',
                imports: [],
                hasTokensBlock: false,
                hasTailwindCore: false,
                hasThemeBlock: false,
            });
            return;
        }

        const hasTokens = hasBrutxCssBlock(content);
        const sanitizedContent = stripCssComments(content);
        const hasTailwindCore = TW_CORE_PATTERN.test(sanitizedContent);
        const hasThemeBlock = THEME_PATTERN.test(sanitizedContent);

        if (hasTokens) {
            tokenNodePaths.push(normalizedPath);
        }

        const imports: CssImportStatement[] = [];
        const importPattern = /@import\s+(?:url\(['"]?([^'")]+)['"]?\)|['"]([^'"]+)['"])([^;]*);/g;
        let match: RegExpExecArray | null;

        while ((match = importPattern.exec(sanitizedContent)) !== null) {
            const specifier = (match[1] ?? match[2]).trim();
            const modifiers = (match[3] ?? '').trim();
            const isRelativeOrAbsolute = specifier.startsWith('.') || specifier.startsWith('/');
            const isRemote = EXTERNAL_URL_PATTERN.test(specifier);
            const isAlias = !isRemote && !isRelativeOrAbsolute && (
                specifier.startsWith('@/') ||
                specifier.startsWith('~/') ||
                (resolveAlias !== undefined && getTsConfigPathCandidates(specifier, cwd, aliasConfig ?? null).length > 0)
            );
            const isExternal = isRemote || (!isRelativeOrAbsolute && !isAlias);
            const line = content.slice(0, match.index).split('\n').length;

            let resolvedPath: string | null = null;
            if (!isExternal) {
                if (resolveAlias && isAlias) {
                    try {
                        resolvedPath = await resolveAlias(specifier);
                    } catch {
                        resolvedPath = null;
                    }
                } else {
                    resolvedPath = path.resolve(path.dirname(normalizedPath), specifier);
                }
            }

            imports.push({
                specifier,
                modifiers,
                isExternal,
                line,
                start: match.index,
                end: match.index + match[0].length,
                resolvedPath,
            });

            if (!isExternal) {
                if (resolvedPath) {
                    const subExists = await fs.pathExists(resolvedPath);
                    if (!subExists) {
                        missingImports.push({
                            from: normalizedPath,
                            specifier,
                            line,
                        });
                    }
                } else {
                    missingImports.push({
                        from: normalizedPath,
                        specifier,
                        line,
                    });
                }
            }
        }

        const rel = path.relative(cwd, normalizedPath).replace(/\\/g, '/');
        nodes.set(normalizedPath, {
            absolutePath: normalizedPath,
            relativePath: rel,
            exists: true,
            content,
            imports,
            hasTokensBlock: hasTokens,
            hasTailwindCore,
            hasThemeBlock,
        });

        for (const imp of imports) {
            if (imp.resolvedPath) {
                await traverse(imp.resolvedPath, [...visitStack, normalizedPath]);
            }
        }
    }

    await traverse(entryPath, []);

    const rootNode = nodes.get(rootPath)!;

    return {
        rootNode,
        nodes,
        circularPaths,
        missingImports,
        hasBrutxTokens: tokenNodePaths.length > 0,
        tokenNodePaths,
    };
}

export function computeRelativeImportSpecifier(fromFile: string, toFile: string): string {
    let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/');
    if (!rel.startsWith('.')) {
        rel = `./${rel}`;
    }
    return rel;
}

export function injectImportStatement(mainContent: string, importSpecifier: string): string {
    const sanitizedContent = stripCssComments(mainContent);
    const escaped = importSpecifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingPattern = new RegExp(`@import\\s+(?:url\\(['"]?${escaped}['"]?\\)|['"]${escaped}['"])[^;]*;`);
    if (existingPattern.test(sanitizedContent)) {
        return mainContent;
    }

    const statement = `@import "${importSpecifier}";`;

    const twMatch = TW_CORE_PATTERN.exec(sanitizedContent);
    if (twMatch) {
        const insertIndex = twMatch.index + twMatch[0].length;
        const prefix = mainContent.slice(0, insertIndex);
        const suffix = mainContent.slice(insertIndex);
        return `${prefix}\n${statement}${suffix.startsWith('\n') ? '' : '\n'}${suffix}`;
    }

    const charsetMatch = /@charset\s+['"][^'"]+['"]\s*;/.exec(sanitizedContent);
    if (charsetMatch) {
        const insertIndex = charsetMatch.index + charsetMatch[0].length;
        const prefix = mainContent.slice(0, insertIndex);
        const suffix = mainContent.slice(insertIndex);
        return `${prefix}\n${statement}${suffix.startsWith('\n') ? '' : '\n'}${suffix}`;
    }

    return `${statement}\n${mainContent}`;
}
