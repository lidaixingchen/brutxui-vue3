import { builtinModules } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { SfcAstEngine } from './ast/sfc-ast-engine.js';
import type {
    ModuleAnalysisResult,
    SourceLanguage,
} from './ast/types.js';

export type { ModuleReference, SourceRange } from './ast/types.js';

export const DEFAULT_MODULE_EXTENSIONS = Object.freeze([
    '.mjs',
    '.js',
    '.ts',
    '.d.ts',
    '.tsx',
    '.jsx',
    '.json',
    '.vue',
] as const);

const TS_EXTENSION_SUBSTITUTIONS = Object.freeze({
    '.js': ['.ts', '.tsx'],
    '.jsx': ['.tsx', '.ts'],
} as const);

export interface ModuleAlias {
    readonly find: string;
    readonly replacement: string | readonly string[];
    readonly baseDir?: string;
}

export interface ModuleResolverOptions {
    readonly rootDir: string;
    readonly tsconfigPath?: string;
    readonly aliases?: readonly ModuleAlias[];
    readonly viteAliases?: readonly ModuleAlias[];
    readonly extensions?: readonly string[];
    readonly enforceCaseSensitive?: boolean;
}

export type ModuleResolutionKind = 'internal' | 'external' | 'unresolved' | 'ambiguous';

export interface ModuleResolutionDiagnostic {
    readonly code:
        | 'MODULE_CONFIG_ERROR'
        | 'MODULE_ALIAS_AMBIGUOUS'
        | 'MODULE_NOT_FOUND'
        | 'MODULE_PATH_CASE_MISMATCH'
        | 'MODULE_PATH_AMBIGUOUS'
        | 'MODULE_OUTSIDE_ROOT';
    readonly severity: 'error' | 'warning';
    readonly importer: string;
    readonly specifier: string;
    readonly message: string;
    readonly candidates?: readonly string[];
}

export interface ModuleResolution {
    readonly importer: string;
    readonly specifier: string;
    readonly kind: ModuleResolutionKind;
    readonly resolvedPath?: string;
    readonly normalizedPath?: string;
    readonly packageName?: string;
    readonly packageSubpath?: string;
    readonly isNodeBuiltin?: boolean;
    readonly candidates: readonly string[];
    readonly diagnostics: readonly ModuleResolutionDiagnostic[];
}

export interface ModuleSourceAnalysis {
    readonly importer: string;
    readonly analysis: ModuleAnalysisResult;
}

export interface ModuleResolver {
    readonly rootDir: string;
    readonly extensions: readonly string[];
    readonly aliases: readonly ModuleAlias[];
    resolve(importer: string, specifier: string): ModuleResolution;
    analyze(source: string, importer: string, language?: SourceLanguage): ModuleSourceAnalysis;
}

interface AliasMatch {
    readonly alias: ModuleAlias;
    readonly suffix: string;
    readonly score: number;
}

interface PathCandidate {
    readonly absolutePath: string;
}

interface ExactPathResult {
    readonly status: 'file' | 'missing' | 'case-mismatch' | 'ambiguous';
    readonly actualPath?: string;
    readonly candidates?: readonly string[];
}

const POSIX_SEPARATOR = '/';
const PACKAGE_SCOPE_SEPARATOR = '/';
const CURRENT_DIRECTORY = '.';
const PARENT_DIRECTORY = '..';
const WILDCARD = '*';

function toPosix(value: string): string {
    return value.split(path.sep).join(POSIX_SEPARATOR);
}

function normalizeAbsolute(value: string): string {
    return toPosix(path.resolve(value));
}

function isPathInside(rootDir: string, targetPath: string): boolean {
    const root = path.resolve(rootDir);
    const target = path.resolve(targetPath);
    const relative = path.relative(root, target);
    return relative === '' || (relative !== PARENT_DIRECTORY && !relative.startsWith(`${PARENT_DIRECTORY}${path.sep}`) && !path.isAbsolute(relative));
}

function normalizeRelative(rootDir: string, targetPath: string): string {
    const relative = path.relative(path.resolve(rootDir), path.resolve(targetPath));
    return toPosix(relative || CURRENT_DIRECTORY);
}

function isKnownExtension(value: string, extensions: readonly string[]): boolean {
    return extensions.includes(value.toLowerCase());
}

function readDirectoryEntries(directoryPath: string): string[] {
    try {
        return fs.readdirSync(directoryPath);
    } catch {
        return [];
    }
}

function inspectExactPath(
    targetPath: string,
    enforceCaseSensitive: boolean,
    rootDir?: string,
): ExactPathResult {
    const absolutePath = path.resolve(targetPath);
    if (!enforceCaseSensitive) {
        try {
            return fs.statSync(absolutePath).isFile() ? { status: 'file', actualPath: absolutePath } : { status: 'missing' };
        } catch {
            return { status: 'missing' };
        }
    }

    const anchor = rootDir && isPathInside(rootDir, absolutePath)
        ? path.resolve(rootDir)
        : null;

    if (!anchor) {
        try {
            return fs.statSync(absolutePath).isFile() ? { status: 'file', actualPath: absolutePath } : { status: 'missing' };
        } catch {
            return { status: 'missing' };
        }
    }

    let current = anchor;
    const relativePath = path.relative(anchor, absolutePath);
    const segments = relativePath.split(path.sep).filter(Boolean);
    let hasCaseMismatch = false;

    for (const segment of segments) {
        const matches = readDirectoryEntries(current).filter((entry) => entry.toLowerCase() === segment.toLowerCase());
        if (matches.length === 0) return { status: 'missing' };
        if (matches.length > 1) {
            return {
                status: 'ambiguous',
                candidates: matches.map((entry) => path.join(current, entry)),
            };
        }
        if (matches[0] !== segment) {
            hasCaseMismatch = true;
        }
        current = path.join(current, matches[0]);
    }

    try {
        if (!fs.statSync(current).isFile()) return { status: 'missing' };
    } catch {
        return { status: 'missing' };
    }

    if (hasCaseMismatch) {
        return {
            status: 'case-mismatch',
            candidates: [current],
        };
    }

    return { status: 'file', actualPath: current };
}

function collectCandidates(
    basePath: string,
    extensions: readonly string[],
): PathCandidate[] {
    const candidates: PathCandidate[] = [];
    const addCandidate = (candidatePath: string): void => {
        const absolutePath = path.resolve(candidatePath);
        if (candidates.some((item) => item.absolutePath === absolutePath)) return;
        candidates.push({ absolutePath });
    };

    const extension = path.extname(basePath).toLowerCase();
    if (extension && isKnownExtension(extension, extensions)) {
        addCandidate(basePath);
        const substitutions = TS_EXTENSION_SUBSTITUTIONS[extension as keyof typeof TS_EXTENSION_SUBSTITUTIONS];
        substitutions?.forEach((replacement) => addCandidate(basePath.slice(0, -extension.length) + replacement));
    } else if (extension) {
        addCandidate(basePath);
    } else {
        extensions.forEach((item) => addCandidate(`${basePath}${item}`));
        addCandidate(basePath);
    }

    extensions.forEach((item) => addCandidate(path.join(basePath, `index${item}`)));
    return candidates;
}

function packageIdentity(specifier: string): { packageName: string; packageSubpath?: string } {
    const segments = specifier.split(PACKAGE_SCOPE_SEPARATOR).filter(Boolean);
    if (segments[0]?.startsWith('@') && segments.length >= 2) {
        return {
            packageName: segments.slice(0, 2).join(PACKAGE_SCOPE_SEPARATOR),
            packageSubpath: segments.length > 2 ? segments.slice(2).join(PACKAGE_SCOPE_SEPARATOR) : undefined,
        };
    }
    return {
        packageName: segments[0] ?? specifier,
        packageSubpath: segments.length > 1 ? segments.slice(1).join(PACKAGE_SCOPE_SEPARATOR) : undefined,
    };
}

function isNodeBuiltinSpecifier(specifier: string, packageName: string): boolean {
    if (specifier.startsWith('node:')) return true;
    return builtinModules.includes(packageName) || builtinModules.includes(`node:${packageName}`);
}

function aliasMatches(specifier: string, alias: ModuleAlias): AliasMatch | undefined {
    const wildcardIndex = alias.find.indexOf(WILDCARD);
    if (wildcardIndex >= 0) {
        const prefix = alias.find.slice(0, wildcardIndex);
        const suffix = alias.find.slice(wildcardIndex + WILDCARD.length);
        if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) return undefined;
        const middleEnd = specifier.length - suffix.length;
        if (middleEnd < prefix.length) return undefined;
        return {
            alias,
            suffix: specifier.slice(prefix.length, middleEnd),
            score: prefix.length + suffix.length + WILDCARD.length,
        };
    }
    if (specifier !== alias.find && !specifier.startsWith(`${alias.find}/`)) return undefined;
    return {
        alias,
        suffix: specifier.slice(alias.find.length).replace(/^\//, ''),
        score: alias.find.length + (specifier === alias.find ? 1 : 0),
    };
}

function applyAlias(alias: ModuleAlias, suffix: string): string[] {
    const replacements = typeof alias.replacement === 'string' ? [alias.replacement] : [...alias.replacement];
    return replacements.map((replacement) => {
        if (replacement.includes(WILDCARD)) return replacement.replace(WILDCARD, suffix);
        if (!suffix) return replacement;
        return path.join(replacement, suffix);
    });
}

function getAliasBaseDir(alias: ModuleAlias, rootDir: string): string {
    return alias.baseDir ? path.resolve(alias.baseDir) : path.resolve(rootDir);
}

function parseTsconfigAliases(tsconfigPath: string): ModuleAlias[] {
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    if (configFile.error) {
        const message = ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n');
        throw new Error(`无法读取 tsconfig：${tsconfigPath}：${message}`);
    }
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfigPath));
    if (parsed.errors.length > 0) {
        const message = parsed.errors
            .map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n'))
            .join('\n');
        throw new Error(`tsconfig 解析失败：${tsconfigPath}：${message}`);
    }
    const paths = parsed.options.paths ?? {};
    const baseDir = parsed.options.baseUrl ?? path.dirname(tsconfigPath);
    return Object.entries(paths).flatMap(([find, replacements]) => {
        if (!Array.isArray(replacements) || replacements.length === 0) return [];
        return [{ find, replacement: replacements, baseDir }];
    });
}

function mergeAliases(options: ModuleResolverOptions): ModuleAlias[] {
    const aliases = [
        ...(options.aliases ?? []),
        ...(options.viteAliases ?? []),
        ...(options.tsconfigPath ? parseTsconfigAliases(options.tsconfigPath) : []),
    ];
    const seen = new Set<string>();
    return aliases.filter((alias) => {
        const replacements = typeof alias.replacement === 'string' ? [alias.replacement] : alias.replacement;
        if (!alias.find || replacements.length === 0 || replacements.some((replacement) => !replacement)) {
            throw new Error('模块别名必须包含非空 find 和 replacement。');
        }
        const key = `${alias.find}\u0000${alias.baseDir ?? ''}\u0000${replacements.join('\u0001')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function createDiagnostic(
    code: ModuleResolutionDiagnostic['code'],
    importer: string,
    specifier: string,
    message: string,
    candidates?: readonly string[],
): ModuleResolutionDiagnostic {
    return { code, severity: 'error', importer, specifier, message, candidates };
}

function resolveInternal(
    rootDir: string,
    importer: string,
    specifier: string,
    candidates: readonly string[],
    enforceCaseSensitive: boolean,
): ModuleResolution {
    const diagnostics: ModuleResolutionDiagnostic[] = [];
    const caseMismatchCandidates: string[] = [];
    const ambiguousCandidates: string[] = [];
    const resolvedCandidates: string[] = [];

    for (const candidate of candidates) {
        const exact = inspectExactPath(candidate, enforceCaseSensitive, rootDir);
        if (exact.status === 'file' && exact.actualPath) {
            if (!isPathInside(rootDir, exact.actualPath)) {
                diagnostics.push(createDiagnostic(
                    'MODULE_OUTSIDE_ROOT',
                    importer,
                    specifier,
                    `模块引用越过项目根目录：${specifier}`,
                    [exact.actualPath],
                ));
                return {
                    importer,
                    specifier,
                    kind: 'unresolved',
                    candidates: [normalizeAbsolute(exact.actualPath)],
                    diagnostics,
                };
            }
            resolvedCandidates.push(exact.actualPath);
            continue;
        }
        if (exact.status === 'case-mismatch') caseMismatchCandidates.push(...(exact.candidates ?? []));
        if (exact.status === 'ambiguous') ambiguousCandidates.push(...(exact.candidates ?? []));
    }

    const uniqueResolved = [...new Set(resolvedCandidates)];
    if (uniqueResolved.length > 0) {
        const selected = uniqueResolved[0];
        return {
            importer,
            specifier,
            kind: 'internal',
            resolvedPath: normalizeAbsolute(selected),
            normalizedPath: normalizeRelative(rootDir, selected),
            candidates: uniqueResolved.map(normalizeAbsolute),
            diagnostics,
        };
    }
    if (ambiguousCandidates.length > 0) {
        const unique = [...new Set(ambiguousCandidates)].map(normalizeAbsolute);
        diagnostics.push(createDiagnostic(
            'MODULE_PATH_AMBIGUOUS',
            importer,
            specifier,
            `模块路径存在多个大小写匹配项：${specifier}`,
            unique,
        ));
        return { importer, specifier, kind: 'ambiguous', candidates: unique, diagnostics };
    }
    if (caseMismatchCandidates.length > 0) {
        const unique = [...new Set(caseMismatchCandidates)].map(normalizeAbsolute);
        diagnostics.push(createDiagnostic(
            'MODULE_PATH_CASE_MISMATCH',
            importer,
            specifier,
            `模块路径大小写与磁盘文件不一致：${specifier}`,
            unique,
        ));
        return { importer, specifier, kind: 'unresolved', candidates: unique, diagnostics };
    }
    diagnostics.push(createDiagnostic(
        'MODULE_NOT_FOUND',
        importer,
        specifier,
        `无法解析模块引用：${specifier}`,
        candidates.map((item) => normalizeAbsolute(item)),
    ));
    return { importer, specifier, kind: 'unresolved', candidates: candidates.map(normalizeAbsolute), diagnostics };
}

export function normalizeModulePath(rootDir: string, targetPath: string): string {
    return normalizeRelative(rootDir, targetPath);
}

export function loadModuleAliases(tsconfigPath: string): readonly ModuleAlias[] {
    return parseTsconfigAliases(path.resolve(tsconfigPath));
}

export function createModuleResolver(options: ModuleResolverOptions): ModuleResolver {
    const rootDir = normalizeAbsolute(options.rootDir);
    const extensions = Object.freeze([...(options.extensions ?? DEFAULT_MODULE_EXTENSIONS)]);
    const enforceCaseSensitive = options.enforceCaseSensitive ?? true;
    const aliases = Object.freeze(mergeAliases({ ...options, rootDir }));

    const resolver: ModuleResolver = {
        rootDir,
        extensions,
        aliases,
        resolve(importer, specifier): ModuleResolution {
            const normalizedImporter = normalizeAbsolute(importer);
            const isRelative = /^(?:\.{1,2})(?:[\\/]|$)/u.test(specifier);
            const isAbsolute = path.isAbsolute(specifier) || path.posix.isAbsolute(specifier) || path.win32.isAbsolute(specifier);

            if (!isRelative && !isAbsolute) {
                const matches = aliases
                    .map((alias) => aliasMatches(specifier, alias))
                    .filter((match): match is AliasMatch => match !== undefined);
                if (matches.length > 0) {
                    const bestScore = Math.max(...matches.map((match) => match.score));
                    const bestMatches = matches.filter((match) => match.score === bestScore);
                    const aliasCandidates = bestMatches.flatMap((match) => applyAlias(match.alias, match.suffix).map((item) => path.resolve(getAliasBaseDir(match.alias, rootDir), item)));
                    const uniqueAliasCandidates = [...new Set(aliasCandidates)];
                    if (bestMatches.length > 1 && uniqueAliasCandidates.length > 1) {
                        const diagnostics = [createDiagnostic(
                            'MODULE_ALIAS_AMBIGUOUS',
                            normalizedImporter,
                            specifier,
                            `模块别名存在多个同优先级解析结果：${specifier}`,
                            uniqueAliasCandidates,
                        )];
                        return {
                            importer: normalizedImporter,
                            specifier,
                            kind: 'ambiguous',
                            candidates: uniqueAliasCandidates.map(normalizeAbsolute),
                            diagnostics,
                        };
                    }
                    return resolveInternal(rootDir, normalizedImporter, specifier, collectCandidates(uniqueAliasCandidates[0], extensions).map((item) => item.absolutePath), enforceCaseSensitive);
                }

                const identity = packageIdentity(specifier);
                return {
                    importer: normalizedImporter,
                    specifier,
                    kind: 'external',
                    packageName: identity.packageName,
                    packageSubpath: identity.packageSubpath,
                    isNodeBuiltin: isNodeBuiltinSpecifier(specifier, identity.packageName),
                    candidates: [],
                    diagnostics: [],
                };
            }

            const basePath = isAbsolute ? path.resolve(specifier) : path.resolve(path.dirname(normalizedImporter), specifier);
            const candidatePaths = collectCandidates(basePath, extensions).map((item) => item.absolutePath);
            return resolveInternal(rootDir, normalizedImporter, specifier, candidatePaths, enforceCaseSensitive);
        },
        analyze(source, importer, language): ModuleSourceAnalysis {
            const normalizedImporter = normalizeAbsolute(importer);
            return {
                importer: normalizedImporter,
                analysis: SfcAstEngine.analyzeModules(source, normalizedImporter, language),
            };
        },
    };
    return resolver;
}

export function resolveModuleSpecifier(
    importer: string,
    specifier: string,
    options: ModuleResolverOptions,
): ModuleResolution {
    return createModuleResolver(options).resolve(importer, specifier);
}

export function analyzeModuleSource(
    source: string,
    importer: string,
    language?: SourceLanguage,
): ModuleSourceAnalysis {
    const normalizedImporter = normalizeAbsolute(importer);
    return {
        importer: normalizedImporter,
        analysis: SfcAstEngine.analyzeModules(source, normalizedImporter, language),
    };
}
