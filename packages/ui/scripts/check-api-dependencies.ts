import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadConfigFromFile } from 'vite';
import {
    analyzeModuleSource,
    createModuleResolver,
    normalizeModulePath,
    type ModuleAlias,
    type ModuleReference,
    type ModuleResolution,
    type ModuleResolver,
} from 'brutx-shared-vue/module-resolver';
import {
    getApiEntrySource,
    type ApiContract,
    type ApiLayer,
} from 'brutx-shared-vue/api-contract';

export const MODULE_LAYERS = Object.freeze([
    'runtime/helper',
    'foundation',
    'composite',
    'effect',
    'block',
] as const);

export type ModuleLayer = ApiLayer;
export type ApiDependencyContract = ApiContract;

export interface ApiDependencyCheckOptions {
    readonly packageRoot: string;
    readonly sourceRoot?: string;
    readonly files?: readonly string[];
    readonly contract: ApiContract;
    readonly tsconfigPath?: string;
    readonly viteAliases?: readonly ModuleAlias[];
    readonly extensions?: readonly string[];
    readonly enforceCaseSensitive?: boolean;
}

export interface DependencyEdge {
    readonly importer: string;
    readonly specifier: string;
    readonly target?: string;
    readonly kind: ModuleReference['kind'];
    readonly isTypeOnly: boolean;
    readonly isDynamic: boolean;
    readonly range: ModuleReference['range'];
    readonly resolution: ModuleResolution;
}

export interface DependencyDiagnostic {
    readonly code: string;
    readonly severity: 'error' | 'warning';
    readonly message: string;
    readonly importer?: string;
    readonly specifier?: string;
    readonly target?: string;
    readonly path?: readonly string[];
    readonly range?: ModuleReference['range'];
}

export interface DependencyGraph {
    readonly nodes: readonly string[];
    readonly edges: readonly DependencyEdge[];
}

export interface ApiDependencyCheckResult {
    readonly passed: boolean;
    readonly diagnostics: readonly DependencyDiagnostic[];
    readonly graph: DependencyGraph;
}

interface LayerRule {
    readonly path: string;
    readonly layer: ModuleLayer;
    readonly directory: boolean;
}

interface DynamicRule {
    readonly importer?: string;
    readonly specifier?: string;
}

interface ContractNormalization {
    readonly layerRules: readonly LayerRule[];
    readonly dynamicRules: readonly DynamicRule[];
    readonly projectionPaths: ReadonlySet<string>;
    readonly diagnostics: readonly DependencyDiagnostic[];
}

interface MutableGraph {
    readonly nodes: string[];
    readonly edges: DependencyEdge[];
}

interface ExportTrace {
    readonly leaf: string;
    readonly path: readonly string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE_DIRECTORY = 'src';
const PUBLIC_ROOT_ENTRY = 'src/index.ts';
const DEFAULT_TSCONFIG_FILE = 'tsconfig.json';
const DEFAULT_VITE_CONFIG_FILE = 'vite.config.ts';
const SOURCE_FILE_PATTERN = /\.(vue|ts|tsx|js|jsx|mjs|cjs)$/;
const TEST_FILE_PATTERN = /\.(test|spec)\.[^.]+$/;
const DECLARATION_FILE_PATTERN = /\.d\.ts$/;
const EXCLUDED_DIRECTORY_NAMES = new Set(['node_modules', 'dist', 'coverage']);
const TEST_SUPPORT_DIRECTORY_NAMES = new Set(['test', 'test-utils']);
const DYNAMIC_WILDCARDS = new Set(['*', '<dynamic>', 'dynamic', 'non-literal']);
const FORBIDDEN_RUNTIME_PACKAGES = new Set([
    'typescript',
    '@vue/compiler-sfc',
    'magic-string',
    'vite',
    'rollup',
    'esbuild',
    '@types/node',
]);
const BUILD_TOOL_PATH_PARTS = new Set(['ast', 'compiler', 'node', 'scripts', 'build']);
const ALLOWED_INTERNAL_LAYERS: Readonly<Record<ModuleLayer, readonly ModuleLayer[]>> = Object.freeze({
    'runtime/helper': ['runtime/helper'],
    foundation: ['runtime/helper', 'foundation'],
    composite: ['runtime/helper', 'foundation', 'composite'],
    effect: ['runtime/helper', 'foundation', 'effect'],
    block: ['runtime/helper', 'foundation', 'composite', 'effect', 'block'],
});

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeAbsolute(value: string): string {
    return path.resolve(value).split(path.sep).join('/');
}

function isInside(rootDir: string, targetPath: string): boolean {
    const relative = path.relative(path.resolve(rootDir), path.resolve(targetPath));
    return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function isSourceFile(filePath: string): boolean {
    const segments = filePath.split(path.sep);
    return SOURCE_FILE_PATTERN.test(filePath)
        && !TEST_FILE_PATTERN.test(filePath)
        && !DECLARATION_FILE_PATTERN.test(filePath)
        && !segments.some((segment) => TEST_SUPPORT_DIRECTORY_NAMES.has(segment))
        && !path.basename(filePath).startsWith('vitest.');
}

function discoverSourceFiles(sourceRoot: string): string[] {
    const files: string[] = [];
    const visit = (directory: string): void => {
        const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
        for (const entry of entries) {
            if (EXCLUDED_DIRECTORY_NAMES.has(entry.name)) continue;
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(entryPath);
                continue;
            }
            if (entry.isFile() && isSourceFile(entryPath)) files.push(normalizeAbsolute(entryPath));
        }
    };
    visit(sourceRoot);
    return files;
}

function resolveContractPath(packageRoot: string, declaredPath: string): string | undefined {
    const absolute = path.isAbsolute(declaredPath)
        ? normalizeAbsolute(declaredPath)
        : normalizeAbsolute(path.resolve(packageRoot, declaredPath));
    if (!isInside(packageRoot, absolute)) return undefined;
    return absolute;
}

function isDirectoryDeclaration(declaredPath: string): boolean {
    return declaredPath.endsWith('/') || path.extname(declaredPath) === '';
}

function addLayerRule(
    packageRoot: string,
    rules: LayerRule[],
    diagnostics: DependencyDiagnostic[],
    declaredPath: string,
    layer: ModuleLayer,
): void {
    const resolvedPath = resolveContractPath(packageRoot, declaredPath);
    if (!resolvedPath) {
        diagnostics.push({
            code: 'CONTRACT_MODULE_PATH_OUTSIDE_ROOT',
            severity: 'error',
            message: `模块层级声明越过包根目录：${declaredPath}`,
            target: declaredPath,
        });
        return;
    }
    const directory = isDirectoryDeclaration(declaredPath);
    const existing = rules.find((rule) => rule.path === resolvedPath && rule.directory === directory);
    if (existing) {
        if (existing.layer !== layer) {
            diagnostics.push({
                code: 'CONTRACT_MODULE_LAYER_AMBIGUOUS',
                severity: 'error',
                message: `模块存在互相冲突的层级声明：${declaredPath}`,
                target: declaredPath,
            });
        }
        return;
    }
    rules.push({ path: resolvedPath, layer, directory });
}

function normalizeContract(packageRoot: string, contract: ApiContract): ContractNormalization {
    const rules: LayerRule[] = [];
    const dynamicRules: DynamicRule[] = [];
    const projectionPaths = new Set<string>();
    const diagnostics: DependencyDiagnostic[] = [];
    for (const module of contract.modules) {
        addLayerRule(packageRoot, rules, diagnostics, module.source, module.layer);
    }
    for (const dependency of contract.dynamicDependencies ?? []) {
        dynamicRules.push({
            importer: dependency.importer
                ? resolveContractPath(packageRoot, dependency.importer)
                : undefined,
            specifier: dependency.specifier,
        });
    }
    for (const entry of contract.entries) {
        projectionPaths.add(normalizeAbsolute(path.resolve(packageRoot, getApiEntrySource(entry))));
    }
    return { layerRules: rules, dynamicRules, projectionPaths, diagnostics };
}

function findLayer(rules: readonly LayerRule[], filePath: string): ModuleLayer | undefined {
    const normalized = normalizeAbsolute(filePath);
    let best: LayerRule | undefined;
    for (const rule of rules) {
        const matches = rule.directory
            ? normalized === rule.path || normalized.startsWith(`${rule.path}/`)
            : normalized === rule.path;
        if (!matches) continue;
        if (!best || rule.path.length > best.path.length) best = rule;
    }
    return best?.layer;
}

function findModuleLayer(rules: readonly LayerRule[], filePath: string): ModuleLayer | undefined {
    return findLayer(rules, filePath);
}

function isExplicitDynamic(
    packageRoot: string,
    rules: readonly DynamicRule[],
    importer: string,
): boolean {
    const normalizedImporter = normalizeAbsolute(importer);
    return rules.some((rule) => {
        const importerMatches = !rule.importer || normalizeAbsolute(resolveContractPath(packageRoot, rule.importer) ?? rule.importer) === normalizedImporter;
        return importerMatches && DYNAMIC_WILDCARDS.has(rule.specifier ?? '*');
    });
}

function createDiagnosticFromResolution(
    code: string,
    message: string,
    importer: string,
    specifier: string,
    target?: string,
    pathValue?: readonly string[],
    range?: ModuleReference['range'],
): DependencyDiagnostic {
    return { code, severity: 'error', message, importer, specifier, target, path: pathValue, range };
}

function toPathDisplay(packageRoot: string, filePath: string): string {
    return normalizeModulePath(packageRoot, filePath);
}

function scanDependencyGraph(
    packageRoot: string,
    initialFiles: readonly string[],
    resolver: ModuleResolver,
    dynamicRules: readonly DynamicRule[],
): { graph: DependencyGraph; diagnostics: DependencyDiagnostic[] } {
    const graph: MutableGraph = { nodes: [], edges: [] };
    const diagnostics: DependencyDiagnostic[] = [];
    const queued = new Set<string>();
    const scanned = new Set<string>();
    const queue = initialFiles.map(normalizeAbsolute);
    for (const file of queue) queued.add(file);

    while (queue.length > 0) {
        const importer = queue.shift();
        if (!importer || scanned.has(importer)) continue;
        scanned.add(importer);
        graph.nodes.push(importer);
        let source: string;
        try {
            source = fs.readFileSync(importer, 'utf8');
        } catch (error) {
            diagnostics.push({
                code: 'MODULE_SOURCE_READ_ERROR',
                severity: 'error',
                message: `无法读取模块源码：${error instanceof Error ? error.message : String(error)}`,
                importer,
            });
            continue;
        }

        const sourceAnalysis = analyzeModuleSource(source, importer);
        const requireCandidateDiagnostics = sourceAnalysis.analysis.diagnostics.filter(
            (diagnostic) => diagnostic.code === 'AST_REQUIRE_CANDIDATE',
        );
        const literalRequireCount = sourceAnalysis.analysis.references.filter(
            (reference) => reference.kind === 'require',
        ).length;
        for (const sourceDiagnostic of sourceAnalysis.analysis.diagnostics) {
            if (sourceDiagnostic.code === 'AST_DYNAMIC_IMPORT_NON_LITERAL') {
                if (!isExplicitDynamic(packageRoot, dynamicRules, importer)) {
                    diagnostics.push({
                        code: 'MODULE_DYNAMIC_IMPORT_UNDECLARED',
                        severity: 'error',
                        message: `无法静态解析的动态引用必须在 API_CONTRACT 中显式声明：${toPathDisplay(packageRoot, importer)}`,
                        importer,
                        range: sourceDiagnostic.range,
                    });
                }
                continue;
            }
            diagnostics.push({
                code: sourceDiagnostic.code,
                severity: sourceDiagnostic.severity === 'error' ? 'error' : 'warning',
                message: sourceDiagnostic.message,
                importer,
                range: sourceDiagnostic.range,
            });
        }
        if (requireCandidateDiagnostics.length > literalRequireCount && !isExplicitDynamic(packageRoot, dynamicRules, importer)) {
            diagnostics.push({
                code: 'MODULE_DYNAMIC_REQUIRE_UNDECLARED',
                severity: 'error',
                message: `无法静态解析的 CommonJS require 必须在 API_CONTRACT 中显式声明：${toPathDisplay(packageRoot, importer)}`,
                importer,
                range: requireCandidateDiagnostics[literalRequireCount]?.range,
            });
        }

        for (const reference of sourceAnalysis.analysis.references) {
            const resolution = resolver.resolve(importer, reference.specifier);
            const target = resolution.kind === 'internal' ? resolution.resolvedPath : undefined;
            graph.edges.push({
                importer,
                specifier: reference.specifier,
                target,
                kind: reference.kind,
                isTypeOnly: reference.isTypeOnly,
                isDynamic: reference.isDynamic,
                range: reference.range,
                resolution,
            });
            for (const resolutionDiagnostic of resolution.diagnostics) {
                diagnostics.push({
                    code: resolutionDiagnostic.code,
                    severity: 'error',
                    message: resolutionDiagnostic.message,
                    importer,
                    specifier: reference.specifier,
                    target: resolutionDiagnostic.candidates?.[0],
                    range: reference.range,
                });
            }
            if (target && !scanned.has(target) && !queued.has(target) && isSourceFile(target)) {
                queue.push(target);
                queued.add(target);
            }
        }
    }

    return {
        graph: {
            nodes: [...graph.nodes].sort(),
            edges: [...graph.edges].sort((left, right) => `${left.importer}:${left.specifier}`.localeCompare(`${right.importer}:${right.specifier}`)),
        },
        diagnostics,
    };
}

function hasAllowedLayer(sourceLayer: ModuleLayer, targetLayer: ModuleLayer): boolean {
    return ALLOWED_INTERNAL_LAYERS[sourceLayer].includes(targetLayer);
}

function isForbiddenRuntimeDependency(packageRoot: string, sourceLayer: ModuleLayer, edge: DependencyEdge): boolean {
    if (sourceLayer !== 'runtime/helper') return false;
    if (edge.resolution.kind === 'external') {
        if (edge.resolution.isNodeBuiltin) return true;
        if (FORBIDDEN_RUNTIME_PACKAGES.has(edge.resolution.packageName ?? '')) return true;
        return edge.specifier.includes('/ast') || edge.specifier.includes('/compiler') || edge.specifier.includes('/scripts');
    }
    if (edge.target) {
        const relative = normalizeModulePath(packageRoot, edge.target);
        const segments = relative.split('/');
        return segments.some((segment) => BUILD_TOOL_PATH_PARTS.has(segment));
    }
    return false;
}

function buildExportIndex(graph: DependencyGraph): Map<string, DependencyEdge[]> {
    const index = new Map<string, DependencyEdge[]>();
    for (const edge of graph.edges) {
        if (edge.kind !== 'export-declaration' || !edge.target) continue;
        const list = index.get(edge.importer) ?? [];
        list.push(edge);
        index.set(edge.importer, list);
    }
    return index;
}

function traceExportLeaves(
    node: string,
    exportIndex: ReadonlyMap<string, readonly DependencyEdge[]>,
    active: ReadonlySet<string> = new Set(),
): ExportTrace[] {
    const outgoing = exportIndex.get(node) ?? [];
    if (outgoing.length === 0) return [{ leaf: node, path: [node] }];
    if (active.has(node)) return [{ leaf: node, path: [node] }];
    const nextActive = new Set(active);
    nextActive.add(node);
    const traces: ExportTrace[] = [];
    for (const edge of outgoing) {
        if (!edge.target) continue;
        for (const trace of traceExportLeaves(edge.target, exportIndex, nextActive)) {
            traces.push({ leaf: trace.leaf, path: [node, ...trace.path] });
        }
    }
    return traces.length > 0 ? traces : [{ leaf: node, path: [node] }];
}

function checkStronglyConnectedComponents(
    graph: DependencyGraph,
    packageRoot: string,
    projectionPaths: ReadonlySet<string>,
): DependencyDiagnostic[] {
    const adjacency = new Map<string, string[]>();
    for (const node of graph.nodes) adjacency.set(node, []);
    for (const edge of graph.edges) {
        if (projectionPaths.has(edge.importer)) continue;
        if (!edge.target || !adjacency.has(edge.importer) || !adjacency.has(edge.target)) continue;
        adjacency.get(edge.importer)?.push(edge.target);
    }

    let index = 0;
    const indexes = new Map<string, number>();
    const lowLinks = new Map<string, number>();
    const stack: string[] = [];
    const onStack = new Set<string>();
    const components: string[][] = [];

    const visit = (node: string): void => {
        indexes.set(node, index);
        lowLinks.set(node, index);
        index += 1;
        stack.push(node);
        onStack.add(node);

        for (const target of adjacency.get(node) ?? []) {
            if (!indexes.has(target)) {
                visit(target);
                lowLinks.set(node, Math.min(lowLinks.get(node) ?? 0, lowLinks.get(target) ?? 0));
            } else if (onStack.has(target)) {
                lowLinks.set(node, Math.min(lowLinks.get(node) ?? 0, indexes.get(target) ?? 0));
            }
        }

        if (lowLinks.get(node) !== indexes.get(node)) return;
        const component: string[] = [];
        let current: string | undefined;
        do {
            current = stack.pop();
            if (!current) break;
            onStack.delete(current);
            component.push(current);
        } while (current !== node);
        components.push(component.sort());
    };

    for (const node of graph.nodes) {
        if (!indexes.has(node)) visit(node);
    }

    return components
        .filter((component) => component.length > 1 || (adjacency.get(component[0] ?? '') ?? []).includes(component[0] ?? ''))
        .sort((left, right) => (left[0] ?? '').localeCompare(right[0] ?? ''))
        .map((component) => ({
            code: 'DEPENDENCY_CYCLE',
            severity: 'error' as const,
            message: `检测到完整模块循环：${component.map((node) => toPathDisplay(packageRoot, node)).join(' -> ')}`,
            path: component.map((node) => toPathDisplay(packageRoot, node)),
        }));
}

function checkGraph(
    packageRoot: string,
    graph: DependencyGraph,
    normalization: ContractNormalization,
): DependencyDiagnostic[] {
    const diagnostics: DependencyDiagnostic[] = [];
    const layers = new Map<string, ModuleLayer | undefined>();
    for (const node of graph.nodes) {
        const layer = findModuleLayer(normalization.layerRules, node);
        layers.set(node, layer);
        if (!layer) {
            diagnostics.push({
                code: 'MODULE_LAYER_UNDECLARED',
                severity: 'error',
                message: `模块没有声明层级：${toPathDisplay(packageRoot, node)}`,
                target: node,
            });
        }
    }

    const exportIndex = buildExportIndex(graph);
    for (const edge of graph.edges) {
        const sourceLayer = layers.get(edge.importer);
        if (!sourceLayer) continue;
        if (normalization.projectionPaths.has(edge.importer) || toPathDisplay(packageRoot, edge.importer) === PUBLIC_ROOT_ENTRY) continue;
        if (edge.target) {
            const targetLayer = layers.get(edge.target) ?? findModuleLayer(normalization.layerRules, edge.target);
            if (!targetLayer) {
                diagnostics.push({
                    code: 'MODULE_LAYER_UNDECLARED',
                    severity: 'error',
                    message: `依赖目标没有声明层级：${toPathDisplay(packageRoot, edge.target)}`,
                    importer: edge.importer,
                    specifier: edge.specifier,
                    target: edge.target,
                    range: edge.range,
                });
                continue;
            }
            if (!hasAllowedLayer(sourceLayer, targetLayer)) {
                diagnostics.push(createDiagnosticFromResolution(
                    'DEPENDENCY_LAYER_VIOLATION',
                    `禁止 ${sourceLayer} 依赖 ${targetLayer}：${toPathDisplay(packageRoot, edge.importer)} -> ${toPathDisplay(packageRoot, edge.target)}`,
                    edge.importer,
                    edge.specifier,
                    edge.target,
                    undefined,
                    edge.range,
                ));
            }

            for (const trace of traceExportLeaves(edge.target, exportIndex)) {
                if (trace.path.length <= 1) continue;
                const leafLayer = layers.get(trace.leaf) ?? findModuleLayer(normalization.layerRules, trace.leaf);
                if (!leafLayer || hasAllowedLayer(sourceLayer, leafLayer)) continue;
                diagnostics.push({
                    code: 'DEPENDENCY_BARREL_BYPASS',
                    severity: 'error',
                    message: `barrel 重导出越过层级：${[edge.importer, ...trace.path].map((node) => toPathDisplay(packageRoot, node)).join(' -> ')}`,
                    importer: edge.importer,
                    specifier: edge.specifier,
                    target: trace.leaf,
                    path: [edge.importer, ...trace.path].map((node) => toPathDisplay(packageRoot, node)),
                    range: edge.range,
                });
            }
        }
        if (isForbiddenRuntimeDependency(packageRoot, sourceLayer, edge)) {
            diagnostics.push({
                code: 'RUNTIME_BUILD_DEPENDENCY',
                severity: 'error',
                message: `runtime/helper 禁止依赖 Node、Shared AST 或编译工具：${edge.specifier}`,
                importer: edge.importer,
                specifier: edge.specifier,
                target: edge.target,
                range: edge.range,
            });
        }
    }

    diagnostics.push(...checkStronglyConnectedComponents(graph, packageRoot, normalization.projectionPaths));
    return diagnostics;
}

export function checkApiDependencies(options: ApiDependencyCheckOptions): ApiDependencyCheckResult {
    const packageRoot = normalizeAbsolute(options.packageRoot);
    const sourceRoot = normalizeAbsolute(options.sourceRoot ?? path.join(packageRoot, DEFAULT_SOURCE_DIRECTORY));
    const normalization = normalizeContract(packageRoot, options.contract);
    const resolver = createModuleResolver({
        rootDir: packageRoot,
        tsconfigPath: options.tsconfigPath,
        viteAliases: options.viteAliases,
        extensions: options.extensions,
        enforceCaseSensitive: options.enforceCaseSensitive ?? true,
    });
    const files = options.files?.map(normalizeAbsolute) ?? discoverSourceFiles(sourceRoot);
    const scanned = scanDependencyGraph(packageRoot, files, resolver, normalization.dynamicRules);
    const diagnostics = [
        ...normalization.diagnostics,
        ...scanned.diagnostics,
        ...checkGraph(packageRoot, scanned.graph, normalization),
    ];
    return {
        passed: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
        diagnostics,
        graph: scanned.graph,
    };
}

export function formatDependencyDiagnostics(result: ApiDependencyCheckResult, packageRoot = PACKAGE_ROOT): string {
    if (result.diagnostics.length === 0) return '✓ API 依赖分层检查通过';
    return result.diagnostics
        .map((diagnostic) => {
            const sourceLocation = diagnostic.importer
                ? toPathDisplay(packageRoot, diagnostic.importer)
                + (diagnostic.range ? `:${diagnostic.range.startLine}:${diagnostic.range.startColumn}` : '')
                : '';
            const location = sourceLocation ? ` ${sourceLocation}` : '';
            const specifier = diagnostic.specifier ? ` [${diagnostic.specifier}]` : '';
            return `${diagnostic.severity === 'error' ? '✗' : '⚠'} ${diagnostic.code}${location}${specifier}: ${diagnostic.message}`;
        })
        .join('\n');
}

async function loadContract(contractPath: string): Promise<ApiContract> {
    const loaded = await import(pathToFileURL(contractPath).href);
    if (!loaded.API_CONTRACT) throw new Error(`API contract at ${contractPath} must export API_CONTRACT`);
    return loaded.API_CONTRACT as ApiContract;
}

export async function loadViteAliases(viteConfigPath: string): Promise<readonly ModuleAlias[]> {
    const baseDir = path.dirname(viteConfigPath);
    const loaded = await loadConfigFromFile(
        { command: 'build', mode: 'production' },
        viteConfigPath,
        path.dirname(viteConfigPath),
        'silent',
    );
    if (!loaded) throw new Error(`无法加载 Vite 配置：${viteConfigPath}`);
    const config = loaded.config;
    const aliases = config?.resolve?.alias;
    if (!aliases) return [];
    if (Array.isArray(aliases)) {
        return aliases.map((alias: unknown) => {
            if (!isRecord(alias) || typeof alias.find !== 'string' || typeof alias.replacement !== 'string') {
                throw new Error('Vite alias 必须是可静态解析的字符串 find/replacement。');
            }
            return { find: alias.find, replacement: alias.replacement, baseDir };
        });
    }
    if (!isRecord(aliases)) throw new Error('Vite resolve.alias 配置格式无法解析。');
    return Object.entries(aliases).map(([find, replacement]) => {
        if (typeof replacement !== 'string') throw new Error(`Vite alias "${find}" 的 replacement 无法解析。`);
        return { find, replacement, baseDir };
    });
}

async function runCli(): Promise<void> {
    const json = process.argv.includes('--json');
    const contractPath = path.resolve(PACKAGE_ROOT, 'api-contract.ts');
    const tsconfigPath = path.resolve(PACKAGE_ROOT, DEFAULT_TSCONFIG_FILE);
    const viteConfigPath = path.resolve(PACKAGE_ROOT, DEFAULT_VITE_CONFIG_FILE);
    const contract = await loadContract(contractPath);
    const viteAliases = await loadViteAliases(viteConfigPath);
    const result = checkApiDependencies({
        packageRoot: PACKAGE_ROOT,
        sourceRoot: path.resolve(PACKAGE_ROOT, DEFAULT_SOURCE_DIRECTORY),
        contract,
        tsconfigPath,
        viteAliases,
    });
    if (json) {
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log(formatDependencyDiagnostics(result));
        console.log(`扫描 ${result.graph.nodes.length} 个模块、${result.graph.edges.length} 条依赖边`);
    }
    if (!result.passed) process.exitCode = 1;
}

if (process.argv[1] && normalizeAbsolute(process.argv[1]) === normalizeAbsolute(__filename)) {
    runCli().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    });
}
