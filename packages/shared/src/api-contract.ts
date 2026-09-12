import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import ts from 'typescript'
import { SfcAstEngine } from './ast/sfc-ast-engine.js'
import {
    createModuleResolver,
    type ModuleAlias,
} from './module-resolver.js'

/**
 * Types shared by the UI public API contract and build-time consumers.
 *
 * The contract deliberately separates public projections from ownership and
 * Registry installation metadata. A source module may belong to a component
 * closure without being exported from a package entry.
 */

export type PublicExportKind = 'value' | 'type'

export type ApiLayer =
    | 'runtime/helper'
    | 'foundation'
    | 'composite'
    | 'effect'
    | 'block'

export type ApiEntryKind = 'root' | 'component' | 'composable' | 'locales' | 'style'

export interface PublicExport {
    /** Module specifier relative to the generated entry that consumes it. */
    readonly source: string
    readonly sourceName: string
    readonly publicName: string
    readonly kind: PublicExportKind
}

export interface ParsedModuleExport {
    readonly sourceName: string
    readonly publicName: string
    readonly kind: PublicExportKind
    readonly moduleSpecifier?: string
    readonly isStar?: boolean
    readonly isNamespace?: boolean
}

export interface ApiModuleContract {
    /** Stable ID used to join entries, ownership and Registry mappings. */
    readonly id: string
    /** Package-relative source directory or file. */
    readonly source: string
    readonly owner: string
    readonly layer: ApiLayer
    readonly public: boolean
}

export interface ApiEntryContract {
    readonly id: string
    readonly subpath: string
    readonly kind: ApiEntryKind
    readonly moduleIds: readonly string[]
    readonly exports: readonly PublicExport[]
    readonly sideEffects?: readonly string[]
}

export interface RegistryInstallContract {
    readonly componentId: string
    readonly moduleId: string
    readonly entryId: string
}

export interface ApiDynamicDependency {
    readonly importer?: string
    readonly specifier: string
}

export interface ApiContract {
    readonly modules: readonly ApiModuleContract[]
    readonly entries: readonly ApiEntryContract[]
    readonly registry: readonly RegistryInstallContract[]
    readonly dynamicDependencies?: readonly ApiDynamicDependency[]
}

export interface ApiOutputMapping {
    readonly import?: string
    readonly types?: string
}

export interface ApiExportsManifestEntry extends ApiEntryContract {
    /** Package-relative source file consumed by the build entry. */
    readonly source: string
    /** Package-relative emitted artifacts for this entry. */
    readonly output: ApiOutputMapping
}

export interface ApiExportsManifest {
    readonly version: 1
    readonly modules: readonly ApiModuleContract[]
    readonly entries: readonly ApiExportsManifestEntry[]
    readonly registry: readonly RegistryInstallContract[]
}

export interface ComponentExportProjection {
    readonly componentId: string
    readonly exports: readonly PublicExport[]
}

export interface ApiSourceValidationOptions {
    readonly packageRoot: string
    readonly tsconfigPath?: string
    readonly aliases?: readonly ModuleAlias[]
    readonly viteAliases?: readonly ModuleAlias[]
}

export type ApiSourceValidationCode =
    | 'ENTRY_SOURCE_UNRESOLVED'
    | 'ENTRY_SOURCE_PARSE_ERROR'
    | 'PUBLIC_EXPORT_NOT_FOUND'
    | 'PUBLIC_EXPORT_KIND_MISMATCH'
    | 'PUBLIC_EXPORT_REEXPORT_UNRESOLVED'

export interface ApiSourceValidationIssue {
    readonly code: ApiSourceValidationCode
    readonly entryId: string
    readonly source: string
    readonly sourceName: string
    readonly publicName: string
    readonly kind: PublicExportKind
    readonly importer: string
    readonly message: string
    readonly target?: string
}

export const API_EXPORTS_MANIFEST_VERSION = 1 as const

function entryName(entry: ApiEntryContract): string {
    if (entry.subpath === '.') return 'index'
    return entry.subpath.replace(/^\.\//u, '')
}

/** Return the source file that implements a generated API entry. */
export function getApiEntrySource(entry: ApiEntryContract): string {
    if (entry.kind === 'style') {
        return entry.subpath === './preflight.css' ? 'src/preflight.css' : 'src/styles.css'
    }
    if (entry.id === 'root' || entry.subpath === '.') return 'src/index.ts'
    if (entry.id === 'composables') return 'src/composables/index.ts'
    if (entry.kind === 'locales') return 'src/locales/index.ts'
    if (entry.kind === 'component') return `src/components/${entryName(entry)}/index.ts`
    if (entry.kind === 'composable') return `src/entries/${entryName(entry)}.ts`
    return `src/${entryName(entry)}`
}

/** Return the import/types artifacts associated with a generated API entry. */
export function getApiEntryOutput(entry: ApiEntryContract): ApiOutputMapping {
    if (entry.kind === 'style') {
        const fileName = entry.subpath === './preflight.css' ? 'preflight.css' : 'styles.css'
        return { import: `./dist/${fileName}` }
    }
    if (entry.id === 'root' || entry.subpath === '.') {
        return { import: './dist/index.js', types: './dist/index.d.ts' }
    }
    if (entry.id === 'composables') {
        return { import: './dist/composables.js', types: './dist/composables.d.ts' }
    }
    if (entry.kind === 'locales') {
        return { import: './dist/locales.js', types: './dist/locales.d.ts' }
    }
    if (entry.kind === 'composable') {
        return {
            import: `./dist/composables/${entryName(entry)}.js`,
            types: `./dist/entries/${entryName(entry)}.d.ts`,
        }
    }
    const outputPath = `components/${entryName(entry)}/index`
    return { import: `./dist/${outputPath}.js`, types: `./dist/${outputPath}.d.ts` }
}

export function buildApiExportsManifest(contract: ApiContract): ApiExportsManifest {
    assertApiContractShape(contract)
    return {
        version: API_EXPORTS_MANIFEST_VERSION,
        modules: contract.modules,
        entries: contract.entries.map((entry) => ({
            ...entry,
            source: getApiEntrySource(entry),
            output: getApiEntryOutput(entry),
        })),
        registry: contract.registry,
    }
}

export function assertApiExportsManifestShape(manifest: ApiExportsManifest): void {
    if (manifest.version !== API_EXPORTS_MANIFEST_VERSION) {
        throw new Error(`Unsupported API exports manifest version: ${String(manifest.version)}`)
    }
    assertApiContractShape(manifest)
    const subpaths = new Set<string>()
    const outputPaths = new Set<string>()
    for (const entry of manifest.entries) {
        if (!entry.source || !entry.output) {
            throw new Error(`API exports manifest entry is missing source/output: ${entry.id}`)
        }
        if (subpaths.has(entry.subpath)) {
            throw new Error(`Duplicate API exports manifest subpath: ${entry.subpath}`)
        }
        subpaths.add(entry.subpath)
        for (const output of [entry.output.import, entry.output.types]) {
            if (!output) continue
            if (outputPaths.has(output)) throw new Error(`Duplicate API exports manifest output: ${output}`)
            outputPaths.add(output)
        }
    }
}

function hasExportModifier(node: ts.Node): boolean {
    return ts.canHaveModifiers(node)
        ? ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false
        : false
}

function hasDefaultModifier(node: ts.Node): boolean {
    return ts.canHaveModifiers(node)
        ? ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) ?? false
        : false
}

function declarationKind(node: ts.Statement): PublicExportKind | undefined {
    if (
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node)
    ) return 'type'
    if (
        ts.isClassDeclaration(node) ||
        ts.isEnumDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isVariableStatement(node)
    ) return 'value'
    return undefined
}

function parseTypeScriptExports(source: string, filename: string): ParsedModuleExport[] {
    const scriptKind = filename.endsWith('.tsx')
        ? ts.ScriptKind.TSX
        : filename.endsWith('.jsx')
            ? ts.ScriptKind.JSX
            : filename.endsWith('.js') || filename.endsWith('.mjs') || filename.endsWith('.cjs')
                ? ts.ScriptKind.JS
                : ts.ScriptKind.TS
    const sourceFile = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, scriptKind)
    const exports: ParsedModuleExport[] = []
    interface LocalBinding {
        readonly sourceName: string
        readonly kind: PublicExportKind
        readonly moduleSpecifier?: string
        readonly isNamespace?: boolean
    }
    const localBindings = new Map<string, LocalBinding>()
    const addLocalBinding = (name: string, binding: LocalBinding): void => {
        if (!localBindings.has(name)) localBindings.set(name, binding)
    }
    const declarationNames = (statement: ts.Statement): string[] => {
        if (
            ts.isClassDeclaration(statement) ||
            ts.isEnumDeclaration(statement) ||
            ts.isFunctionDeclaration(statement) ||
            ts.isInterfaceDeclaration(statement) ||
            ts.isTypeAliasDeclaration(statement)
        ) {
            return statement.name ? [statement.name.text] : []
        }
        if (!ts.isVariableStatement(statement)) return []
        return statement.declarationList.declarations.flatMap((declaration) =>
            ts.isIdentifier(declaration.name) ? [declaration.name.text] : [],
        )
    }

    for (const statement of sourceFile.statements) {
        if (ts.isImportDeclaration(statement)) {
            const clause = statement.importClause
            const moduleSpecifier = ts.isStringLiteral(statement.moduleSpecifier)
                ? statement.moduleSpecifier.text
                : undefined
            if (!clause || !moduleSpecifier) continue
            if (clause.name) {
                addLocalBinding(clause.name.text, {
                    sourceName: 'default',
                    kind: clause.isTypeOnly ? 'type' : 'value',
                    moduleSpecifier,
                })
            }
            if (!clause.namedBindings) continue
            if (ts.isNamespaceImport(clause.namedBindings)) {
                addLocalBinding(clause.namedBindings.name.text, {
                    sourceName: '*',
                    kind: 'value',
                    moduleSpecifier,
                    isNamespace: true,
                })
                continue
            }
            for (const element of clause.namedBindings.elements) {
                addLocalBinding(element.name.text, {
                    sourceName: element.propertyName?.text ?? element.name.text,
                    kind: clause.isTypeOnly || element.isTypeOnly ? 'type' : 'value',
                    moduleSpecifier,
                })
            }
            continue
        }

        const kind = declarationKind(statement)
        if (!kind) continue
        for (const name of declarationNames(statement)) {
            addLocalBinding(name, { sourceName: name, kind })
        }
    }

    const append = (item: ParsedModuleExport): void => {
        const duplicate = exports.some((candidate) =>
            candidate.publicName === item.publicName && candidate.kind === item.kind &&
            candidate.moduleSpecifier === item.moduleSpecifier,
        )
        if (!duplicate) exports.push(item)
    }

    for (const statement of sourceFile.statements) {
        if (ts.isExportDeclaration(statement)) {
            const moduleSpecifier = statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
                ? statement.moduleSpecifier.text
                : undefined
            if (!statement.exportClause) {
                append({
                    sourceName: '*',
                    publicName: '*',
                    kind: statement.isTypeOnly ? 'type' : 'value',
                    moduleSpecifier,
                    isStar: true,
                })
                continue
            }
            if (!ts.isNamedExports(statement.exportClause)) continue
            for (const element of statement.exportClause.elements) {
                const localName = element.propertyName?.text ?? element.name.text
                const localBinding = localBindings.get(localName)
                if (!moduleSpecifier && !localBinding) continue
                append({
                    sourceName: moduleSpecifier ? localName : localBinding?.sourceName ?? localName,
                    publicName: element.name.text,
                    kind: moduleSpecifier
                        ? statement.isTypeOnly || element.isTypeOnly ? 'type' : 'value'
                        : statement.isTypeOnly || element.isTypeOnly ? 'type' : localBinding?.kind ?? 'value',
                    moduleSpecifier,
                    isNamespace: localBinding?.isNamespace,
                })
            }
            continue
        }

        if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
            append({ sourceName: 'default', publicName: 'default', kind: 'value' })
            continue
        }

        if (!hasExportModifier(statement)) continue
        const kind = declarationKind(statement)
        if (!kind) continue
        if (hasDefaultModifier(statement)) {
            append({ sourceName: 'default', publicName: 'default', kind })
            continue
        }
        const name = (
            ts.isClassDeclaration(statement) ||
            ts.isEnumDeclaration(statement) ||
            ts.isFunctionDeclaration(statement) ||
            ts.isInterfaceDeclaration(statement) ||
            ts.isTypeAliasDeclaration(statement)
        ) && statement.name
            ? statement.name.text
            : undefined
        if (name) {
            append({ sourceName: name, publicName: name, kind })
            continue
        }
        if (ts.isVariableStatement(statement)) {
            for (const declaration of statement.declarationList.declarations) {
                if (ts.isIdentifier(declaration.name)) {
                    append({ sourceName: declaration.name.text, publicName: declaration.name.text, kind })
                }
            }
        }
    }
    return exports
}

/**
 * Parse module-level named exports for contract bootstrap and read-only checks.
 * SFC `script setup` declarations are implementation details; a `.vue` module
 * contributes its compiler-provided default value in addition to normal script
 * exports. Star exports stay explicit so callers can reject or resolve them.
 */
export function parseModuleExports(rawSource: string, filename: string): ParsedModuleExport[] {
    if (!filename.endsWith('.vue')) return parseTypeScriptExports(rawSource, filename)
    const descriptor = SfcAstEngine.parse(rawSource, filename)
    const exports: ParsedModuleExport[] = [
        { sourceName: 'default', publicName: 'default', kind: 'value' },
    ]
    // `<script setup>` declarations are compiled into the component and are
    // never module-level named exports. Only a normal `<script>` contributes
    // source symbols to the public contract.
    if (descriptor.script) {
        for (const item of parseTypeScriptExports(descriptor.script.content, `${filename}.${descriptor.script.lang ?? 'js'}`)) {
            const duplicate = exports.some((candidate) =>
                candidate.sourceName === item.sourceName && candidate.publicName === item.publicName && candidate.kind === item.kind,
            )
            if (!duplicate) exports.push(item)
        }
    }
    return exports
}

interface ExportSymbol {
    readonly publicName: string
    readonly kind: PublicExportKind
}

function appendExportSymbol(target: ExportSymbol[], symbol: ExportSymbol): void {
    if (symbol.publicName === 'default' && symbol.kind === 'value') {
        const duplicate = target.some((candidate) => candidate.publicName === symbol.publicName && candidate.kind === symbol.kind)
        if (!duplicate) target.push(symbol)
        return
    }
    const duplicate = target.some((candidate) => candidate.publicName === symbol.publicName && candidate.kind === symbol.kind)
    if (!duplicate) target.push(symbol)
}

function findExternalDeclaration(specifier: string, packageRoot: string): string | undefined {
    const require = createRequire(path.join(packageRoot, 'package.json'))
    let runtimePath: string | undefined
    try {
        runtimePath = require.resolve(specifier, { paths: [packageRoot] })
    } catch {
        runtimePath = undefined
    }

    const candidates: string[] = []
    if (runtimePath) {
        if (runtimePath.endsWith('.mjs') || runtimePath.endsWith('.js')) {
            candidates.push(runtimePath.replace(/\.(?:mjs|js)$/u, '.d.ts'))
        }
        candidates.push(path.join(path.dirname(runtimePath), 'index.d.ts'))
    }

    const packageName = specifier.startsWith('@')
        ? specifier.split('/').slice(0, 2).join('/')
        : specifier.split('/')[0]
    const addPackageDeclarationCandidates = (packageJsonPath: string): void => {
        try {
            const packageDirectory = path.dirname(packageJsonPath)
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as {
                types?: unknown
                typings?: unknown
            }
            for (const field of [packageJson.types, packageJson.typings]) {
                if (typeof field === 'string') candidates.push(path.resolve(packageDirectory, field))
            }
            candidates.push(path.join(packageDirectory, 'index.d.ts'))
        } catch {
            // A package may expose runtime code without a readable package manifest.
        }
    }

    try {
        addPackageDeclarationCandidates(require.resolve(`${packageName}/package.json`, { paths: [packageRoot] }))
    } catch {
        // Some packages block package.json through the exports map.
    }

    const typesPackageName = packageName.startsWith('@')
        ? `@types/${packageName.slice(1).replace('/', '__')}`
        : `@types/${packageName}`
    try {
        addPackageDeclarationCandidates(require.resolve(`${typesPackageName}/package.json`, { paths: [packageRoot] }))
    } catch {
        // The package may ship no community declaration package.
    }

    return [...new Set(candidates)].find((candidate) => fs.existsSync(candidate))
}

function sourceResolutionMessage(
    importer: string,
    specifier: string,
    resolution: ReturnType<ReturnType<typeof createModuleResolver>['resolve']>,
): string {
    const diagnostic = resolution.diagnostics[0]
    return diagnostic?.message ?? `无法解析模块引用：${specifier}（来自 ${importer}）`
}

/**
 * Validate every contract export against the real source module it names.
 *
 * The resolver supplies extension, directory, package-root and case checks;
 * the recursive export walk supplies actual named/type export checks. This is
 * intentionally read-only so generation and `--check` share the same gate.
 */
export function validateApiContractSourceExports(
    contract: ApiContract,
    options: ApiSourceValidationOptions,
): ApiSourceValidationIssue[] {
    const packageRoot = path.resolve(options.packageRoot)
    const resolver = createModuleResolver({
        rootDir: packageRoot,
        tsconfigPath: options.tsconfigPath,
        aliases: options.aliases,
        viteAliases: options.viteAliases,
    })
    const moduleCache = new Map<string, readonly ExportSymbol[]>()
    const externalCache = new Map<string, readonly ExportSymbol[] | undefined>()
    const resolving = new Set<string>()
    const moduleFailures = new Map<string, string[]>()

    const toLookupKey = (value: string): string => path.resolve(value).split(path.sep).join('/')

    const recordFailure = (modulePath: string, message: string): void => {
        const key = toLookupKey(modulePath)
        const failures = moduleFailures.get(key) ?? []
        if (!failures.includes(message)) failures.push(message)
        moduleFailures.set(key, failures)
    }

    const readModuleExports = (modulePath: string): readonly ExportSymbol[] => {
        const normalized = toLookupKey(modulePath)
        const cached = moduleCache.get(normalized)
        if (cached) return cached
        if (resolving.has(normalized)) return []
        resolving.add(normalized)

        let parsed: ParsedModuleExport[]
        try {
            parsed = parseModuleExports(fs.readFileSync(normalized, 'utf-8'), normalized)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            recordFailure(normalized, `无法解析 ${normalized}: ${message}`)
            resolving.delete(normalized)
            const empty: readonly ExportSymbol[] = []
            moduleCache.set(normalized, empty)
            return empty
        }

        const symbols: ExportSymbol[] = []
        for (const item of parsed) {
            if (!item.moduleSpecifier) {
                if (!item.isStar) appendExportSymbol(symbols, { publicName: item.publicName, kind: item.kind })
                continue
            }

            const resolution = resolver.resolve(normalized, item.moduleSpecifier)
            if (resolution.kind === 'external') {
                const targetSymbols = readExternalExports(item.moduleSpecifier)
                if (!targetSymbols) {
                    recordFailure(normalized, `外部模块无法解析声明：${item.moduleSpecifier}`)
                    continue
                }
                if (item.isNamespace) {
                    appendExportSymbol(symbols, { publicName: item.publicName, kind: 'value' })
                    continue
                }
                if (item.isStar) {
                    for (const symbol of targetSymbols) {
                        if (symbol.publicName === 'default') continue
                        if (item.kind === 'type' && symbol.kind !== 'type') continue
                        appendExportSymbol(symbols, symbol)
                    }
                    continue
                }
                const target = targetSymbols.find((symbol) => symbol.publicName === item.sourceName)
                if (target) appendExportSymbol(symbols, { publicName: item.publicName, kind: target.kind })
                continue
            }
            if (resolution.kind !== 'internal' || !resolution.resolvedPath) {
                recordFailure(normalized, sourceResolutionMessage(normalized, item.moduleSpecifier, resolution))
                continue
            }
            const targetSymbols = readModuleExports(resolution.resolvedPath)
            if (item.isNamespace) {
                appendExportSymbol(symbols, { publicName: item.publicName, kind: 'value' })
                continue
            }
            if (item.isStar) {
                for (const symbol of targetSymbols) {
                    if (symbol.publicName === 'default') continue
                    if (item.kind === 'type' && symbol.kind !== 'type') continue
                    appendExportSymbol(symbols, symbol)
                }
                continue
            }

            const target = targetSymbols.find((symbol) => symbol.publicName === item.sourceName)
            if (target) {
                appendExportSymbol(symbols, { publicName: item.publicName, kind: target.kind })
            }
        }

        resolving.delete(normalized)
        moduleCache.set(normalized, symbols)
        return symbols
    }

    const readExternalExports = (specifier: string): readonly ExportSymbol[] | undefined => {
        if (externalCache.has(specifier)) return externalCache.get(specifier)
        const declarationPath = findExternalDeclaration(specifier, packageRoot)
        if (!declarationPath) {
            externalCache.set(specifier, undefined)
            return undefined
        }
        try {
            const symbols = parseModuleExports(fs.readFileSync(declarationPath, 'utf-8'), declarationPath)
                .filter((item) => !item.isStar)
                .map((item) => ({ publicName: item.publicName, kind: item.kind }))
            externalCache.set(specifier, symbols)
            return symbols
        } catch {
            externalCache.set(specifier, undefined)
            return undefined
        }
    }

    const issues: ApiSourceValidationIssue[] = []
    const issueKeys = new Set<string>()
    const addIssue = (issue: ApiSourceValidationIssue): void => {
        const key = `${issue.entryId}:${issue.source}:${issue.sourceName}:${issue.publicName}:${issue.kind}:${issue.code}`
        if (issueKeys.has(key)) return
        issueKeys.add(key)
        issues.push(issue)
    }

    for (const entry of contract.entries) {
        if (entry.kind === 'style') continue
        const importer = path.resolve(packageRoot, getApiEntrySource(entry))
        for (const item of entry.exports) {
            const resolution = resolver.resolve(importer, item.source)
            if (resolution.kind === 'external') {
                const symbols = readExternalExports(item.source)
                const matching = symbols?.filter((symbol) => symbol.publicName === item.sourceName) ?? []
                if (!symbols) {
                    addIssue({
                        code: 'ENTRY_SOURCE_UNRESOLVED',
                        entryId: entry.id,
                        source: item.source,
                        sourceName: item.sourceName,
                        publicName: item.publicName,
                        kind: item.kind,
                        importer,
                        message: `外部模块无法解析声明：${item.source}`,
                    })
                } else if (matching.length === 0) {
                    addIssue({
                        code: 'PUBLIC_EXPORT_NOT_FOUND',
                        entryId: entry.id,
                        source: item.source,
                        sourceName: item.sourceName,
                        publicName: item.publicName,
                        kind: item.kind,
                        importer,
                        message: `外部模块未导出具名符号 ${item.sourceName}`,
                    })
                } else if (!matching.some((symbol) => symbol.kind === item.kind)) {
                    addIssue({
                        code: 'PUBLIC_EXPORT_KIND_MISMATCH',
                        entryId: entry.id,
                        source: item.source,
                        sourceName: item.sourceName,
                        publicName: item.publicName,
                        kind: item.kind,
                        importer,
                        message: `外部模块符号 ${item.sourceName} 的实际种类为 ${matching.map((symbol) => symbol.kind).join('/')}，契约声明为 ${item.kind}`,
                    })
                }
                continue
            }
            if (resolution.kind !== 'internal' || !resolution.resolvedPath) {
                addIssue({
                    code: 'ENTRY_SOURCE_UNRESOLVED',
                    entryId: entry.id,
                    source: item.source,
                    sourceName: item.sourceName,
                    publicName: item.publicName,
                    kind: item.kind,
                    importer,
                    target: resolution.candidates[0],
                    message: sourceResolutionMessage(importer, item.source, resolution),
                })
                continue
            }

            const symbols = readModuleExports(resolution.resolvedPath)
            const matching = symbols.filter((symbol) => symbol.publicName === item.sourceName)
            if (matching.length === 0) {
                const failures = moduleFailures.get(toLookupKey(resolution.resolvedPath))
                addIssue({
                    code: failures && failures.length > 0 ? 'PUBLIC_EXPORT_REEXPORT_UNRESOLVED' : 'PUBLIC_EXPORT_NOT_FOUND',
                    entryId: entry.id,
                    source: item.source,
                    sourceName: item.sourceName,
                    publicName: item.publicName,
                    kind: item.kind,
                    importer,
                    target: resolution.resolvedPath,
                    message: failures && failures.length > 0
                        ? failures.join('; ')
                        : `源码未导出具名符号 ${item.sourceName}`,
                })
                continue
            }

            if (!matching.some((symbol) => symbol.kind === item.kind)) {
                addIssue({
                    code: 'PUBLIC_EXPORT_KIND_MISMATCH',
                    entryId: entry.id,
                    source: item.source,
                    sourceName: item.sourceName,
                    publicName: item.publicName,
                    kind: item.kind,
                    importer,
                    target: resolution.resolvedPath,
                    message: `源码符号 ${item.sourceName} 的实际种类为 ${matching.map((symbol) => symbol.kind).join('/')}，契约声明为 ${item.kind}`,
                })
            }
        }
    }
    return issues
}

export function assertApiContractSourceExports(
    contract: ApiContract,
    options: ApiSourceValidationOptions,
): void {
    const issues = validateApiContractSourceExports(contract, options)
    if (issues.length === 0) return
    throw new Error(
        `API contract source validation failed (${issues.length}):\n` +
        issues.map((issue) =>
            `  - [${issue.code}] ${issue.entryId} ${issue.publicName} ← ${issue.source}#${issue.sourceName}: ${issue.message}`,
        ).join('\n'),
    )
}

/**
 * Return the explicitly declared public projection for a component.
 *
 * This function does not inspect the file system or expand a source directory.
 * A missing component ID therefore fails loudly instead of making a newly
 * discovered source file public by accident.
 */
export function projectComponentExports(
    contract: ApiContract,
    componentId: string,
): ComponentExportProjection {
    const entry = contract.entries.find(
        (candidate) => candidate.kind === 'component' && candidate.id === `component:${componentId}`,
    )
    if (!entry) {
        throw new Error(`API contract has no component projection for "${componentId}"`)
    }
    return {
        componentId,
        exports: entry.exports,
    }
}

function quote(value: string): string {
    return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function renderExport(item: PublicExport): string {
    const imported = item.sourceName === 'default'
        ? `default as ${item.publicName}`
        : item.sourceName === item.publicName
            ? item.publicName
            : `${item.sourceName} as ${item.publicName}`

    if (item.kind === 'type') {
        return `export type { ${imported} } from ${quote(item.source)}`
    }
    return `export { ${imported} } from ${quote(item.source)}`
}

/**
 * Render a named-only entry barrel from an explicit public projection.
 * Duplicate public names are rejected before output so a source rename cannot
 * silently change the consumer-facing binding.
 */
export function buildPublicEntryContent(
    exports: readonly PublicExport[],
    sideEffects: readonly string[] = [],
): string {
    const seen = new Map<string, PublicExport>()
    for (const item of exports) {
        if (!item.source || !item.sourceName || !item.publicName) {
            throw new Error('API contract export entries require source, sourceName and publicName')
        }
        const key = `${item.publicName}:${item.kind}`
        const previous = seen.get(key)
        if (previous) {
            throw new Error(
                `Duplicate public export "${item.publicName}" (${item.kind}) from ` +
                `${previous.source} and ${item.source}`,
            )
        }
        seen.set(key, item)
    }

    const lines = [
        '/**',
        ' * AUTO-GENERATED from packages/ui/api-contract.ts — DO NOT EDIT.',
        ' */',
        ...sideEffects.map((source) => `import ${quote(source)}`),
        ...exports.map(renderExport),
    ]
    return `${lines.join('\n')}\n`
}

export function assertApiContractShape(contract: ApiContract): void {
    const moduleIds = new Set<string>()
    for (const module of contract.modules) {
        if (moduleIds.has(module.id)) throw new Error(`Duplicate API contract module ID: ${module.id}`)
        moduleIds.add(module.id)
        if (!module.source || !module.owner) throw new Error(`Incomplete API contract module: ${module.id}`)
    }

    const entryIds = new Set<string>()
    const entrySubpaths = new Set<string>()
    for (const entry of contract.entries) {
        if (entryIds.has(entry.id)) throw new Error(`Duplicate API contract entry ID: ${entry.id}`)
        if (entrySubpaths.has(entry.subpath)) throw new Error(`Duplicate API contract subpath: ${entry.subpath}`)
        entryIds.add(entry.id)
        entrySubpaths.add(entry.subpath)
        for (const moduleId of entry.moduleIds) {
            if (!moduleIds.has(moduleId)) {
                throw new Error(`API entry "${entry.id}" references unknown module "${moduleId}"`)
            }
        }
        const seen = new Set<string>()
        for (const item of entry.exports) {
            const key = `${item.publicName}:${item.kind}`
            if (seen.has(key)) throw new Error(`Duplicate public export "${key}" in entry "${entry.id}"`)
            seen.add(key)
        }
    }

    const registryIds = new Set<string>()
    const componentEntryIds = new Set(
        contract.entries
            .filter((entry) => entry.kind === 'component')
            .map((entry) => entry.id),
    )
    const registeredComponentEntryIds = new Set<string>()
    for (const mapping of contract.registry) {
        const key = `${mapping.componentId}:${mapping.moduleId}:${mapping.entryId}`
        if (registryIds.has(key)) throw new Error(`Duplicate Registry mapping: ${key}`)
        registryIds.add(key)
        if (!moduleIds.has(mapping.moduleId)) {
            throw new Error(`Registry mapping references unknown module "${mapping.moduleId}"`)
        }
        if (!entryIds.has(mapping.entryId)) {
            throw new Error(`Registry mapping references unknown entry "${mapping.entryId}"`)
        }
        const componentEntryId = `component:${mapping.componentId}`
        if (!componentEntryIds.has(componentEntryId) || mapping.entryId !== componentEntryId) {
            throw new Error(`Registry mapping does not target component entry "${componentEntryId}"`)
        }
        registeredComponentEntryIds.add(componentEntryId)
    }
    for (const componentEntryId of componentEntryIds) {
        if (!registeredComponentEntryIds.has(componentEntryId)) {
            throw new Error(`Component entry "${componentEntryId}" has no Registry mapping`)
        }
    }
}
