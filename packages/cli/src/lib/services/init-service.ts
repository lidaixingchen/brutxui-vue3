import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { FileSystemAdapter } from '../fs/index.js';
import type { AliasConfig, BrutalistConfig, ProjectType, TailwindConfig } from '../types.js';
import {
    CONFIG_FILES,
    CURRENT_CONFIG_VERSION,
    SCHEMA_URL,
    UTILS_TEMPLATE,
    hasBrutxCssBlock,
} from '../constants.js';
import { CONFIG_FILE_NAME, DEFAULT_CONFIG_STYLE } from '../config.js';
import { CliError } from '../error.js';
import type { FileTransaction } from '../file-transaction.js';
import { ProjectContext } from '../project-context.js';
import {
    computeRelativeImportSpecifier,
    injectImportStatement,
    planCssTokenInjection,
    scanCssGraph,
    type CssTokenPlanContext,
} from '../css/index.js';
import { assertSafePath, isSafePath } from '../security.js';
import { generateSnippets, hasVscodeDir } from '../vscode-snippets.js';
import { planNuxtConfigInjection } from '../frameworks/nuxt-config.js';

export { injectNuxtConfig } from '../frameworks/nuxt-config.js';

export interface ProjectInitializationSettings {
    tailwind: TailwindConfig;
    aliases: AliasConfig;
    sharedBase?: string;
}

export type NuxtConfigStatus =
    | 'not-found'
    | 'manual-required'
    | 'already-configured'
    | 'updated'
    | 'write-failed'
    | 'skipped';

export interface NuxtConfigResult {
    configured: boolean;
    status: NuxtConfigStatus;
    cssPath: string;
    componentsRelDir: string;
    cssSpecifier?: string;
    componentsSpecifier?: string;
    configFile?: string;
    errorMessage?: string;
}

export interface ProjectInitializationResult {
    config: BrutalistConfig;
    utilsPath: string;
    utilsCreated: boolean;
    componentsDir: string;
    stylesAdded: boolean;
    nuxt: NuxtConfigResult;
}

export interface ProjectInitializationCallbacks {
    onUtilityHelper?: (info: { alias: string; path: string; created: boolean }) => void;
    onComponentsDirectory?: (info: { path: string }) => void;
    onStyles?: (info: { cssPath: string; added: boolean }) => void;
    onNuxtConfig?: (result: NuxtConfigResult) => void;
}

export interface ProjectInitializationOptions {
    cwd: string;
    projectType: ProjectType;
    settings: ProjectInitializationSettings;
    existingConfig?: Partial<BrutalistConfig>;
    callbacks?: ProjectInitializationCallbacks;
    context?: ProjectContext;
    fs?: FileSystemAdapter;
    transaction?: FileTransaction;
}

function buildConfig(
    settings: ProjectInitializationSettings,
    isSplitMode: boolean,
    existingConfig?: Partial<BrutalistConfig>,
): BrutalistConfig {
    const tailwind: TailwindConfig = {
        ...existingConfig?.tailwind,
        config: settings.tailwind.config,
        css: settings.tailwind.css,
    };
    const trimmedTokens = settings.tailwind.tokensFile?.trim();
    if (isSplitMode && trimmedTokens) {
        tailwind.tokensFile = trimmedTokens;
    } else {
        delete tailwind.tokensFile;
    }

    const config = {
        ...existingConfig,
        $schema: SCHEMA_URL,
        $version: CURRENT_CONFIG_VERSION,
        style: DEFAULT_CONFIG_STYLE,
        tailwind,
        aliases: { ...existingConfig?.aliases, ...settings.aliases },
        sharedBase: settings.sharedBase || undefined,
    };
    if (!config.sharedBase) delete config.sharedBase;
    return config;
}

type InitFileAction =
    | { type: 'ensure-dir'; path: string }
    | { type: 'write-json'; path: string; content: BrutalistConfig }
    | { type: 'write-file'; path: string; content: string };

interface InitFileStep {
    label: string;
    path: string;
    action?: InitFileAction;
    skipReason?: string;
}

interface InitNuxtStep {
    step?: InitFileStep;
    result: NuxtConfigResult;
}

interface InitFilePlanOptions extends Omit<ProjectInitializationOptions, 'callbacks' | 'transaction'> {
    preserveExisting?: boolean;
    vscode?: boolean | 'auto';
}

export interface InitFilePlan {
    steps: readonly InitFileStep[];
    config: BrutalistConfig;
    utility: InitFileStep;
    utilityAlias: string;
    components: InitFileStep;
    cssPath: string;
    tokensPath: string | null;
    stylesAdded: boolean;
    nuxt: InitNuxtStep;
}

async function planNuxtConfig(
    cwd: string,
    cssFile: string,
    componentsDir: string,
    plannedPaths: readonly string[],
    projectType: ProjectType,
    fs: FileSystemAdapter,
): Promise<InitNuxtStep> {
    const componentScanDir = path.dirname(componentsDir);
    const relativePath = (filename: string) => path.relative(cwd, filename).replace(/\\/g, '/');
    const details = { cssPath: relativePath(cssFile), componentsRelDir: relativePath(componentScanDir) };
    if (projectType !== 'nuxt') {
        return { result: { ...details, configured: false, status: 'skipped' } };
    }

    for (const configFile of CONFIG_FILES.nuxt) {
        const configPath = path.join(cwd, configFile);
        if (!(await fs.pathExists(configPath))) continue;

        await assertSafePath(configPath, cwd, fs);
        const original = await fs.readFile(configPath, 'utf-8');
        const { cssSpecifier, componentsSpecifier, ...injection } = await planNuxtConfigInjection(original, {
            directory: cwd,
            cssFile,
            componentsDir,
            componentScanDir,
            plannedPaths,
            fs,
        });
        const result = { ...details, cssSpecifier, componentsSpecifier, configFile };

        switch (injection.status) {
            case 'manual-required':
                return { result: { ...result, configured: false, status: 'manual-required' } };
            case 'unchanged':
                return {
                    result: { ...result, configured: true, status: 'already-configured' },
                    step: { label: 'Nuxt configuration', path: configPath },
                };
            case 'injected':
                return {
                    result: { ...result, configured: true, status: 'updated' },
                    step: {
                        label: 'Nuxt configuration',
                        path: configPath,
                        action: { type: 'write-file', path: configPath, content: injection.content },
                    },
                };
        }
    }

    return { result: {
        ...details,
        cssSpecifier: `~~/${details.cssPath}`,
        componentsSpecifier: `~~/${details.componentsRelDir}`,
        configured: false,
        status: 'not-found',
    } };
}

async function planStyles(context: CssTokenPlanContext, preserveExisting: boolean) {
    const plan = await planCssTokenInjection(context);
    const steps: InitFileStep[] = [];

    for (const filePath of [plan.mainCssPath, plan.tokensPath]) {
        if (!filePath) continue;
        const label = filePath === plan.tokensPath ? 'Design tokens' : 'Global CSS';
        const write = plan.actions.find(action => action.type === 'write-file' && action.filePath === filePath);
        let action: InitFileAction | undefined;

        if (write?.type === 'write-file') {
            const original = preserveExisting && await context.fs.pathExists(filePath)
                ? await context.fs.readFile(filePath, 'utf-8')
                : undefined;
            let content = write.content;

            if (original !== undefined && hasBrutxCssBlock(original)) {
                content = original;
                // 分离模式下保留用户维护的内联样式，仅补上缺失的令牌文件导入。
                if (filePath === plan.mainCssPath && plan.tokensPath) {
                    const graph = await scanCssGraph(filePath, context, original);
                    if (!graph.nodes.has(plan.tokensPath)) {
                        content = injectImportStatement(original, computeRelativeImportSpecifier(filePath, plan.tokensPath));
                    }
                }
            }

            if (content !== original) {
                action = { type: 'write-file', path: filePath, content };
            }
        }

        steps.push({ label, path: filePath, action });
    }

    return { steps, mainCssPath: plan.mainCssPath, tokensPath: plan.tokensPath };
}

async function planSnippets(
    cwd: string,
    fs: FileSystemAdapter,
    vscode: InitFilePlanOptions['vscode'],
    preserveExisting: boolean
): Promise<InitFileStep | undefined> {
    if (!vscode || (vscode === 'auto' && !(await hasVscodeDir(cwd, fs)))) return undefined;

    const snippetPath = path.join(cwd, '.vscode', 'brutx.code-snippets');
    const vscodeDir = path.dirname(snippetPath);
    const step: InitFileStep = { label: 'VS Code snippets', path: snippetPath };
    if (vscode === 'auto') {
        if (!(await isSafePath(vscodeDir, cwd, fs)) || !(await isSafePath(snippetPath, cwd, fs))) {
            return { ...step, skipReason: 'The snippets path resolves outside the project directory.' };
        }
        if (!(await fs.stat(vscodeDir)).isDirectory()) {
            return { ...step, skipReason: 'The .vscode path is not a directory.' };
        }
    } else {
        await assertSafePath(vscodeDir, cwd, fs);
        await assertSafePath(snippetPath, cwd, fs);
    }
    const exists = await fs.pathExists(snippetPath);
    if (!exists || !preserveExisting) {
        const content = generateSnippets();
        if (!exists || content !== await fs.readFile(snippetPath, 'utf-8')) {
            step.action = { type: 'write-file', path: snippetPath, content };
        }
    }
    return step;
}

export async function planProjectInitializationFiles(
    options: InitFilePlanOptions
): Promise<InitFilePlan> {
    const { cwd, projectType, settings, existingConfig, preserveExisting = false } = options;
    const context = options.context ?? await ProjectContext.loadUninitialized(cwd, {
        fs: options.fs,
        optionalConfig: true,
    });
    const fs = context.fs;
    const styles = await planStyles({
        cwd,
        tailwind: settings.tailwind,
        fs,
        resolveAlias: specifier => context.resolveAliasPath(specifier),
        tsConfig: context.tsConfig,
    }, preserveExisting);
    const proposedConfig = buildConfig(settings, styles.tokensPath !== null, existingConfig);
    const config = preserveExisting && existingConfig
        ? {
            ...proposedConfig,
            ...existingConfig,
            tailwind: { ...proposedConfig.tailwind, ...existingConfig.tailwind },
            aliases: { ...proposedConfig.aliases, ...existingConfig.aliases },
        }
        : proposedConfig;
    const configPath = path.join(cwd, CONFIG_FILE_NAME);
    await assertSafePath(configPath, cwd, fs);
    const configBefore = await fs.pathExists(configPath) ? await fs.readJson(configPath).catch(() => null) : null;
    const configStep: InitFileStep = {
        label: 'Project configuration',
        path: configPath,
        action: isDeepStrictEqual(configBefore, config)
            ? undefined
            : { type: 'write-json', path: configPath, content: config },
    };

    context.bindConfig(config);
    const utilsPath = await context.resolveUtilsFilePath();
    const utility: InitFileStep = {
        label: 'Utility helper',
        path: utilsPath,
        action: await fs.pathExists(utilsPath)
            ? undefined
            : { type: 'write-file', path: utilsPath, content: UTILS_TEMPLATE },
    };
    const componentsDir = path.join(await context.resolveComponentsDir(), 'ui');
    await assertSafePath(componentsDir, cwd, fs);
    const components: InitFileStep = {
        label: 'Component directory',
        path: componentsDir,
        action: await fs.pathExists(componentsDir) && (await fs.stat(componentsDir)).isDirectory()
            ? undefined
            : { type: 'ensure-dir', path: componentsDir },
    };
    const plannedPaths = [utility, components, ...styles.steps].flatMap(step => step.action ? [step.path] : []);
    const nuxt = await planNuxtConfig(cwd, styles.mainCssPath, componentsDir, plannedPaths, projectType, fs);
    const snippets = await planSnippets(cwd, fs, options.vscode, preserveExisting);
    const steps = [configStep, utility, components, ...styles.steps];
    if (nuxt.step) steps.push(nuxt.step);
    if (snippets) steps.push(snippets);

    return {
        steps: await includeParentDirectories(steps, fs),
        config,
        utility,
        utilityAlias: config.sharedBase ? `${config.sharedBase}/utils` : config.aliases.utils,
        components,
        cssPath: settings.tailwind.css,
        tokensPath: styles.tokensPath,
        stylesAdded: styles.steps.some(step => step.action !== undefined),
        nuxt,
    };
}

async function includeParentDirectories(steps: InitFileStep[], fs: FileSystemAdapter): Promise<InitFileStep[]> {
    const result: InitFileStep[] = [];
    const plannedDirs = new Set<string>();

    for (const step of steps) {
        const { action } = step;
        if (action?.type === 'ensure-dir') {
            plannedDirs.add(action.path);
        } else if (action) {
            const parent = path.dirname(action.path);
            if (!plannedDirs.has(parent) && !(await fs.pathExists(parent))) {
                plannedDirs.add(parent);
                result.push({ label: 'Parent directory', path: parent, action: { type: 'ensure-dir', path: parent } });
            }
        }
        result.push(step);
    }
    return result;
}

export async function applyProjectInitializationFiles(
    plan: InitFilePlan,
    transaction: FileTransaction,
    callbacks?: ProjectInitializationCallbacks,
): Promise<ProjectInitializationResult> {
    for (const step of plan.steps) {
        const { action } = step;
        if (!action) continue;

        try {
            switch (action.type) {
                case 'ensure-dir':
                    await transaction.ensureDir(action.path);
                    break;
                case 'write-json':
                    await transaction.writeJson(action.path, action.content, { spaces: 2 });
                    break;
                case 'write-file':
                    await transaction.writeFile(action.path, action.content);
                    break;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (step === plan.nuxt.step) {
                callbacks?.onNuxtConfig?.({ ...plan.nuxt.result, configured: false, status: 'write-failed', errorMessage });
            }
            const message = `Failed to apply ${step.label} at ${step.path}: ${errorMessage}`;
            const details = error instanceof CliError ? { code: error.code, exitCode: error.exitCode } : {};
            throw new CliError(message, { code: 'WRITE_FAILED', ...details, cause: error });
        }
    }

    const utilsCreated = plan.utility.action !== undefined;
    const componentsDir = path.dirname(plan.components.path);
    callbacks?.onUtilityHelper?.({ alias: plan.utilityAlias, path: plan.utility.path, created: utilsCreated });
    callbacks?.onComponentsDirectory?.({ path: componentsDir });
    callbacks?.onStyles?.({
        cssPath: plan.cssPath,
        added: plan.stylesAdded,
        ...(plan.tokensPath ? { tokensPath: plan.tokensPath } : {}),
    });
    callbacks?.onNuxtConfig?.(plan.nuxt.result);

    return {
        config: plan.config,
        utilsPath: plan.utility.path,
        utilsCreated,
        componentsDir,
        stylesAdded: plan.stylesAdded,
        nuxt: plan.nuxt.result,
    };
}

export async function initializeProjectFiles(options: ProjectInitializationOptions): Promise<ProjectInitializationResult> {
    const context = options.context ?? await ProjectContext.loadUninitialized(options.cwd, {
        fs: options.fs,
        optionalConfig: true,
    });
    const transaction = options.transaction ?? context.createTransaction();

    try {
        await transaction.lockProjectWrites();
        const plan = await planProjectInitializationFiles({ ...options, context });
        const result = await applyProjectInitializationFiles(plan, transaction, options.callbacks);
        await transaction.commit();
        return result;
    } catch (error) {
        const rollbackFailures = await transaction.rollback();
        throw Object.assign(error instanceof Error ? error : new Error(String(error)), { rollbackFailures });
    }
}
