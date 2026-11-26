import { posix as path, win32 } from 'node:path';
import { parseSource } from 'brutx-shared-vue/ast';
import { toPosixPath } from 'brutx-shared-vue/path';
import MagicString from 'magic-string';
import ts from 'typescript';
import type { FileSystemAdapter } from '../fs/index.js';

export interface NuxtConfigInjectionOptions {
    readonly cssPath: string;
    readonly componentsRelDir: string;
}

export interface ConfigInjectionResult {
    readonly content: string;
    readonly changed: boolean;
    readonly status: 'injected' | 'unchanged' | 'manual-required';
}

type PropertyValues = Map<string, ts.Expression | undefined>;
type Coverage = 'covered' | 'missing' | 'unknown';
type PathKind = 'components' | 'css';

interface Paths {
    readonly root: string;
    readonly source: string;
    readonly assets: string;
    readonly aliases: PropertyValues;
    readonly project?: NuxtLayout;
}

interface NuxtLayout {
    readonly directory: string;
    readonly source: string;
    readonly major: number | undefined;
}

interface NuxtProjectTargets {
    readonly directory: string;
    readonly cssFile: string;
    readonly componentsDir: string;
    readonly componentScanDir: string;
    readonly plannedPaths: readonly string[];
    readonly fs: FileSystemAdapter;
}

interface NuxtSpecifiers {
    readonly cssSpecifier: string;
    readonly componentsSpecifier: string;
}

const DEFAULT_COMPONENTS_DIR = 'components';
const DEFAULT_ASSETS_DIR = 'assets';
const DEFAULT_INDENT = '    ';
const APP_DIR = 'app';
const NUXT_LEGACY_MAJOR = 3;
const SOURCE_LAYOUT_COMPATIBILITY = 4;
const LEGACY_LAYOUT_PATHS = ['assets', 'layouts', 'middleware', 'pages', 'plugins'] as const;

function unwrap(expression: ts.Expression): ts.Expression {
    while (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression)
        || ts.isSatisfiesExpression(expression) || ts.isTypeAssertionExpression(expression)) {
        expression = expression.expression;
    }
    return expression;
}

function readString(expression: ts.Expression | undefined): string | undefined {
    if (!expression) return undefined;
    const value = unwrap(expression);
    return ts.isStringLiteralLike(value) ? value.text : undefined;
}

function readArray(expression: ts.Expression | undefined): ts.ArrayLiteralExpression | undefined {
    if (!expression) return undefined;
    const value = unwrap(expression);
    return ts.isArrayLiteralExpression(value) ? value : undefined;
}

function readProperties(object: ts.ObjectLiteralExpression): PropertyValues | undefined {
    const properties: PropertyValues = new Map();
    for (const property of object.properties) {
        if (ts.isSpreadAssignment(property)) return undefined;
        const name = property.name;
        const key = ts.isComputedPropertyName(name) ? readString(name.expression) : name.text;
        if (key === undefined) return undefined;
        properties.set(key, ts.isPropertyAssignment(property) ? property.initializer : undefined);
    }
    return properties;
}

function readObject(expression: ts.Expression | undefined): ts.ObjectLiteralExpression | undefined {
    if (!expression) return undefined;
    const value = unwrap(expression);
    return ts.isObjectLiteralExpression(value) ? value : undefined;
}

function findConfig(source: ts.SourceFile): ts.ObjectLiteralExpression | undefined {
    const assignment = source.statements.find(statement => ts.isExportAssignment(statement) && !statement.isExportEquals);
    if (!assignment || !ts.isExportAssignment(assignment)) return undefined;

    const call = unwrap(assignment.expression);
    if (!ts.isCallExpression(call) || !ts.isIdentifier(call.expression) || call.expression.text !== 'defineNuxtConfig'
        || call.arguments.length !== 1) return undefined;

    const argument = unwrap(call.arguments[0]);
    const value = ts.isArrowFunction(argument) && !ts.isBlock(argument.body) ? argument.body : argument;
    return readObject(value);
}

function isAbsolutePath(value: string): boolean {
    return path.isAbsolute(value) || /^[a-z]:\//i.test(value);
}

function joinPath(base: string, value: string): string {
    const portable = toPosixPath(value);
    if (/^[a-z]:\//i.test(portable) || /^[a-z]:\//i.test(base)) {
        return toPosixPath(win32.resolve(base, portable)).replace(/(?<!:)\/$/, '');
    }
    const joined = isAbsolutePath(portable) ? path.normalize(portable) : path.join(base, portable);
    return joined.replace(/\/$/, '') || '/';
}

function readPaths(properties: PropertyValues, project?: NuxtLayout): Paths | undefined {
    const rootDir = readString(properties.get('rootDir'));
    const srcDir = readString(properties.get('srcDir'));
    if ((properties.has('rootDir') && rootDir === undefined) || (properties.has('srcDir') && srcDir === undefined)) {
        return undefined;
    }

    const alias = readObject(properties.get('alias'));
    const aliases = alias ? readProperties(alias) : new Map();
    if ((properties.has('alias') && !alias) || !aliases) return undefined;

    const dir = readObject(properties.get('dir'));
    const directories = dir ? readProperties(dir) : new Map();
    if ((properties.has('dir') && !dir) || !directories) return undefined;
    const assetsDir = readString(directories.get('assets'));
    if (directories.has('assets') && assetsDir === undefined) return undefined;

    const root = joinPath(project?.directory ?? '.', rootDir ?? '.');
    const source = project?.source ?? joinPath(root, srcDir ?? '.');
    return { root, source, aliases, assets: joinPath(source, assetsDir ?? DEFAULT_ASSETS_DIR), project };
}

function resolveConfigPath(value: string, paths: Paths, kind: PathKind): string | undefined {
    const portable = toPosixPath(value);
    const matchingAlias = [...paths.aliases.keys()].sort((a, b) => b.length - a.length)
        .find(key => portable === key || portable.startsWith(`${key}/`));
    if (matchingAlias !== undefined) {
        const target = readString(paths.aliases.get(matchingAlias));
        if (target === undefined || !isAbsolutePath(toPosixPath(target))) return undefined;
        return joinPath(target, portable.slice(matchingAlias.length + 1));
    }

    const [prefix, ...rest] = portable.split('/');
    switch (prefix) {
        case '~':
        case '@':
            return joinPath(paths.source, rest.join('/'));
        case '~~':
        case '@@':
            return joinPath(paths.root, rest.join('/'));
        default:
            return (kind === 'css' || paths.project?.major === NUXT_LEGACY_MAJOR) && prefix === path.basename(paths.assets)
                ? joinPath(paths.assets, rest.join('/'))
                : joinPath(kind === 'css' ? '.' : paths.source, portable);
    }
}

function includesDirectory(parent: string, target: string): boolean {
    return target === parent || target.startsWith(parent.endsWith('/') ? parent : `${parent}/`)
        || parent === '.' && !target.startsWith('../') && target !== '..' && !isAbsolutePath(target);
}

function coversComponents(entry: ts.Expression, target: string, paths: Paths): Coverage {
    const directory = readObject(entry);
    const properties = directory ? readProperties(directory) : undefined;
    if (properties?.has('dirs')) return 'unknown';
    const value = directory ? readString(properties?.get('path')) : readString(entry);
    const resolved = value && resolveConfigPath(value, paths, 'components');
    if (!resolved) return 'unknown';
    if (!includesDirectory(resolved, target)) return 'missing';

    if (properties?.has('pattern') && readString(properties.get('pattern')) !== '**/*.vue') return 'unknown';
    if (properties?.has('ignore') && readArray(properties.get('ignore'))?.elements.length !== 0) return 'unknown';
    if (properties?.has('extensions')) {
        const extensions = readArray(properties.get('extensions'))?.elements;
        if (!extensions?.some(extension => readString(extension)?.replace(/^\./, '') === 'vue')) return 'unknown';
    }
    return 'covered';
}

function coversCss(entry: ts.Expression, target: string, paths: Paths): Coverage {
    const value = readString(entry);
    const resolved = value && resolveConfigPath(value, paths, 'css');
    if (!resolved) return 'unknown';
    return resolved === target ? 'covered' : 'missing';
}

type NuxtPackage = { version?: string };
type ProjectManifest = {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
};

async function detectNuxtMajor(directory: string, fs: FileSystemAdapter): Promise<number | undefined> {
    const project = await fs.readJson<ProjectManifest>(joinPath(directory, 'package.json')).catch(() => undefined);
    const declared = project?.dependencies?.nuxt ?? project?.devDependencies?.nuxt ?? project?.optionalDependencies?.nuxt;
    const pathImpl = /^[a-z]:\//i.test(directory) ? win32 : path;
    for (let current = directory; ;) {
        const manifestPath = joinPath(current, 'node_modules/nuxt/package.json');
        const installed = await fs.readJson<NuxtPackage>(manifestPath).catch(() => undefined);
        const major = typeof installed?.version === 'string' && installed.version.match(/^(\d+)\./)?.[1];
        if (major) return Number(major);
        const parent = toPosixPath(pathImpl.dirname(current));
        if (parent === current) break;
        current = parent;
    }
    const declaredMajor = typeof declared === 'string'
        && declared.match(/^(?:npm:nuxt(?:-nightly)?@)?[~^]?(\d+)(?:\.(?:\d+|x|\*)){0,2}(?:-[\w.-]+)?$/)?.[1];
    return declaredMajor ? Number(declaredMajor) : undefined;
}

async function resolveNuxtLayout(properties: PropertyValues, targets: NuxtProjectTargets): Promise<NuxtLayout | undefined> {
    if (['extends', '_extends', 'theme', '$development', '$production', '$test', '$env'].some(key => properties.has(key))) {
        return undefined;
    }
    const { fs } = targets;
    const plannedPaths = targets.plannedPaths.map(toPosixPath);
    const directory = joinPath('.', targets.directory);
    const rootDir = readString(properties.get('rootDir'));
    const srcDir = readString(properties.get('srcDir'));
    if ((properties.has('rootDir') && rootDir === undefined) || (properties.has('srcDir') && srcDir === undefined)) {
        return undefined;
    }
    const root = joinPath(directory, rootDir ?? '.');
    const major = await detectNuxtMajor(directory, fs);
    if (srcDir) return { directory, source: joinPath(root, srcDir), major };

    const app = joinPath(root, APP_DIR);
    const existsAfterInit = async (entry: string) => plannedPaths.some(file => includesDirectory(entry, file)) || await fs.pathExists(entry);
    if (!(await existsAfterInit(app))) return { directory, source: root, major };

    if (major === NUXT_LEGACY_MAJOR) {
        const futureObject = readObject(properties.get('future'));
        const future = futureObject && readProperties(futureObject);
        if (properties.has('future') && !future) return undefined;
        const compatibility = future?.get('compatibilityVersion');
        const value = compatibility && unwrap(compatibility);
        if (future?.has('compatibilityVersion') && (!value || !ts.isNumericLiteral(value))) return undefined;
        if (!value || Number(value.getText()) !== SOURCE_LAYOUT_COMPATIBILITY) return { directory, source: root, major };
    } else if (major !== SOURCE_LAYOUT_COMPATIBILITY) {
        return undefined;
    }

    // Nuxt checks the source layout after the planned project files are present.
    const newAppEntries = plannedPaths.filter(file => file !== app && includesDirectory(app, file))
        .map(file => file.slice(app.length + 1).split('/')[0]);
    const existingAppEntries = await fs.pathExists(app) ? await fs.readdir(app).catch(() => undefined) : [];
    if (!existingAppEntries) return undefined;
    const usesApp = [...existingAppEntries, ...newAppEntries]
        .some(entry => entry !== 'spa-loading-template.html' && !entry.startsWith('router.options'));
    if (usesApp) return { directory, source: app, major };

    const configuredDir = readObject(properties.get('dir'));
    const dirs = configuredDir ? readProperties(configuredDir) : new Map();
    if ((properties.has('dir') && !configuredDir) || !dirs) return undefined;
    const legacyPaths = ['app.vue', 'App.vue'];
    for (const key of LEGACY_LAYOUT_PATHS) {
        const value = readString(dirs.get(key));
        if (dirs.has(key) && value === undefined) return undefined;
        legacyPaths.push(value ?? key);
    }
    const legacyLayout = (await Promise.all(legacyPaths.map(entry => existsAfterInit(joinPath(root, entry))))).some(Boolean);
    return { directory, source: legacyLayout ? root : app, major };
}

function quote(value: string): string {
    return `'${JSON.stringify(value).slice(1, -1).replace(/'/g, "\\'")}'`;
}

function lineStart(source: ts.SourceFile, offset: number): number {
    return source.getPositionOfLineAndCharacter(source.getLineAndCharacterOfPosition(offset).line, 0);
}

function indentation(source: ts.SourceFile, offset: number): string {
    return /^[\t ]*/.exec(source.text.slice(lineStart(source, offset)))?.[0] ?? '';
}

function appendArrayEntry(edit: MagicString, source: ts.SourceFile, array: ts.ArrayLiteralExpression, value: string): void {
    const last = array.elements.at(-1);
    const trailingComma = array.elements.hasTrailingComma;
    if (last && !trailingComma) edit.appendLeft(last.end, ',');

    const closingBracket = array.end - 1;
    const start = lineStart(source, closingBracket);
    if (start > array.getStart(source) && /^[\t ]*$/.test(source.text.slice(start, closingBracket))) {
        const closingIndent = indentation(source, closingBracket);
        const indent = last ? indentation(source, last.getStart(source)) : closingIndent + indentUnit(closingIndent);
        edit.appendLeft(start, `${indent}${value}${trailingComma ? ',' : ''}${source.text.includes('\r\n') ? '\r\n' : '\n'}`);
    } else {
        edit.appendLeft(closingBracket, `${last ? ' ' : ''}${value}${trailingComma ? ',' : ''}`);
    }
}

function indentUnit(indent: string): string {
    return indent.endsWith('\t') ? '\t' : DEFAULT_INDENT;
}

function componentArray(expression: ts.Expression | undefined): ts.ArrayLiteralExpression | undefined {
    const object = readObject(expression);
    if (!object) return readArray(expression);
    return readArray(readProperties(object)?.get('dirs'));
}

function readConfig(content: string) {
    const { diagnostics, scriptBlocks } = parseSource({ filename: 'nuxt.config.ts', source: content });
    if (diagnostics.some(diagnostic => diagnostic.severity === 'error')) return undefined;

    const source = scriptBlocks[0].sourceFile;
    const config = findConfig(source);
    const properties = config && readProperties(config);
    return config && properties ? { source, config, properties } : undefined;
}

function manualResult(content: string): ConfigInjectionResult {
    return { content, changed: false, status: 'manual-required' };
}

function createRootSpecifier(target: string, paths: Paths, kind: PathKind): string {
    const relative = /^[a-z]:\//i.test(paths.root)
        ? toPosixPath(win32.relative(paths.root, target))
        : path.relative(paths.root, target);
    return ['~~', '@@'].map(alias => relative ? `${alias}/${relative}` : alias)
        .find(value => resolveConfigPath(value, paths, kind) === target) ?? target;
}

function applyInjection(
    content: string,
    parsed: NonNullable<ReturnType<typeof readConfig>>,
    paths: Paths,
    targetComponents: string,
    targetCss: string,
    newComponents: string | undefined,
    newCss: string | undefined,
): ConfigInjectionResult {
    const manual = manualResult(content);
    const { source, config, properties } = parsed;

    const edit = new MagicString(content);
    const newProperties: string[] = [];
    const components = properties.get('components');
    const css = properties.get('css');
    const defaultComponents = joinPath(paths.source, DEFAULT_COMPONENTS_DIR);
    if (components && unwrap(components).kind === ts.SyntaxKind.TrueKeyword) {
        if (!includesDirectory(defaultComponents, targetComponents)) return manual;
    } else if (properties.has('components')) {
        if (!components) return manual;
        const array = componentArray(components);
        const entries = array?.elements ?? [components];
        const coverage = entries.map(entry => coversComponents(entry, targetComponents, paths));
        if (coverage.includes('unknown')) return manual;
        if (!coverage.includes('covered')) {
            if (!newComponents) return manual;
            if (array) {
                appendArrayEntry(edit, source, array, quote(newComponents));
            } else if (readString(components)) {
                edit.appendLeft(components.getStart(source), '[');
                edit.appendLeft(components.end, `, ${quote(newComponents)}]`);
            } else {
                return manual;
            }
        }
    } else if (!paths.project || !includesDirectory(defaultComponents, targetComponents)) {
        if (!newComponents) return manual;
        const entries = [quote(newComponents)];
        if (paths.project) {
            const defaultEntry = (directory: string) => quote(createRootSpecifier(directory, paths, 'components'));
            entries.unshift(
                `{ path: ${defaultEntry(joinPath(defaultComponents, 'islands'))}, island: true }`,
                `{ path: ${defaultEntry(joinPath(defaultComponents, 'global'))}, global: true }`,
                defaultEntry(defaultComponents),
            );
        }
        newProperties.push(`components: [${entries.join(', ')}],`);
    }

    if (properties.has('css')) {
        const array = readArray(css);
        const coverage = array?.elements.map(entry => coversCss(entry, targetCss, paths));
        if (!array || !coverage || coverage.includes('unknown')) return manual;
        if (!coverage.includes('covered')) {
            if (!newCss) return manual;
            appendArrayEntry(edit, source, array, quote(newCss));
        }
    } else {
        if (!newCss) return manual;
        newProperties.push(`css: [${quote(newCss)}],`);
    }

    if (newProperties.length > 0) {
        const start = config.getStart(source) + 1;
        const firstProperty = config.properties[0];
        const firstOffset = firstProperty?.getStart(source) ?? config.end - 1;
        const multiline = lineStart(source, firstOffset) > lineStart(source, start);
        const baseIndent = indentation(source, start);
        const indent = multiline && firstProperty ? indentation(source, firstOffset) : baseIndent + indentUnit(baseIndent);
        const newline = content.includes('\r\n') ? '\r\n' : '\n';
        const suffix = multiline ? '' : newline + (firstProperty ? indent : baseIndent);
        edit.appendLeft(start, newProperties.map(property => newline + indent + property).join('') + suffix);
    }

    const updated = edit.toString();
    return updated === content
        ? { content, changed: false, status: 'unchanged' }
        : { content: updated, changed: true, status: 'injected' };
}

function injectStaticConfig(content: string, options: NuxtConfigInjectionOptions): ConfigInjectionResult {
    const parsed = readConfig(content);
    const paths = parsed && readPaths(parsed.properties);
    if (!parsed || !paths) return manualResult(content);

    const targetComponents = joinPath('.', options.componentsRelDir);
    const targetCss = /^[~@]{1,2}\//.test(options.cssPath)
        ? resolveConfigPath(options.cssPath, paths, 'css')
        : joinPath('.', options.cssPath);
    if (!targetCss) return manualResult(content);

    const newComponents = ['~', '~~', '@@'].map(alias => `${alias}/${options.componentsRelDir}`)
        .find(value => resolveConfigPath(value, paths, 'components') === targetComponents);
    const cssPrefix = options.cssPath.split('/')[0];
    const cssUsesAlias = /^[~@]{1,2}$/.test(cssPrefix) || cssPrefix === path.basename(paths.assets)
        || paths.aliases.has(cssPrefix);
    const newCss = [
        ...(cssUsesAlias || isAbsolutePath(options.cssPath) ? [options.cssPath] : []),
        `~~/${options.cssPath}`,
        `@@/${options.cssPath}`,
    ]
        .find(value => resolveConfigPath(value, paths, 'css') === targetCss);

    return applyInjection(content, parsed, paths, targetComponents, targetCss, newComponents, newCss);
}

export async function planNuxtConfigInjection(
    content: string,
    targets: NuxtProjectTargets,
): Promise<ConfigInjectionResult & NuxtSpecifiers> {
    const cssFile = joinPath('.', targets.cssFile);
    const componentsDir = joinPath('.', targets.componentsDir);
    const componentScanDir = joinPath('.', targets.componentScanDir);
    const parsed = readConfig(content);
    const layout = parsed && await resolveNuxtLayout(parsed.properties, targets);
    const paths = layout && readPaths(parsed.properties, layout);
    if (!parsed || !paths) {
        return { ...manualResult(content), cssSpecifier: cssFile, componentsSpecifier: componentScanDir };
    }

    const componentsSpecifier = createRootSpecifier(componentScanDir, paths, 'components');
    const cssSpecifier = createRootSpecifier(cssFile, paths, 'css');
    const result = applyInjection(content, parsed, paths, componentsDir, cssFile, componentsSpecifier, cssSpecifier);
    return { ...result, componentsSpecifier, cssSpecifier };
}

export function injectNuxtConfig(content: string, options: NuxtConfigInjectionOptions): ConfigInjectionResult;
export function injectNuxtConfig(content: string, cssPath: string, componentsRelDir: string): string | null;
export function injectNuxtConfig(
    content: string,
    optionsOrCssPath: NuxtConfigInjectionOptions | string,
    componentsRelDir?: string,
): ConfigInjectionResult | string | null {
    if (typeof optionsOrCssPath !== 'string') return injectStaticConfig(content, optionsOrCssPath);
    const result = injectStaticConfig(content, { cssPath: optionsOrCssPath, componentsRelDir: componentsRelDir ?? '' });
    return result.status === 'manual-required' ? null : result.content;
}
