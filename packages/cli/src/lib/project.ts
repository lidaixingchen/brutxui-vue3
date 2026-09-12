import { DiskFileSystemAdapter, type FileSystemAdapter } from './fs/index.js';
import { SfcAstEngine } from 'brutx-shared-vue/ast';
import type { BrutalistConfig } from './types.js';
import { ProjectContext } from './project-context.js';

const defaultDiskFs = new DiskFileSystemAdapter();

export {
    clearProjectTypeCache,
    detectProjectType,
    detectWorkspaceRoot,
    detectPackageManager,
    resolveTsConfigExtendsPath,
    readTsConfigFile,
    readTsConfig,
    findTailwindConfig,
    findCssFile,
    getAliasFromTsConfig,
    getDefaultAliases,
} from './env-detector.js';

export async function resolveAliasPath(alias: string, cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<string> {
    const ctx = await ProjectContext.loadUninitialized(cwd, { fs: fsAdapter });
    return ctx.resolveAliasPath(alias);
}

export async function resolveUtilsFilePath(
    config: { sharedBase?: string; aliases: { utils: string } },
    cwd: string,
    fsAdapter: FileSystemAdapter = defaultDiskFs
): Promise<string> {
    const ctx = await ProjectContext.loadUninitialized(cwd, { configOverride: config as BrutalistConfig, fs: fsAdapter });
    return ctx.resolveUtilsFilePath();
}

export function extractScriptBlocks(content: string): Array<{ start: number; end: number; code: string }> {
    return ProjectContext.extractScriptBlocks(content);
}

export function resolveImportAlias(content: string, config: BrutalistConfig, filename = 'component.vue'): string {
    const sharedBase = config.sharedBase;
    const composablesAlias = config.aliases.composables ?? config.aliases.utils.replace(/\/utils$/, '/composables');
    const localesAlias = config.aliases.locales ?? `${composablesAlias.replace(/\/[^/]+$/, '')}/locales`;
    const directivesAlias = config.aliases.directives ?? `${composablesAlias.replace(/\/[^/]+$/, '')}/directives`;
    const libAlias = config.aliases.utils.replace(/\/[^/]+$/, '');

    return SfcAstEngine.transformImports(content, ctx => {
        const spec = ctx.specifier;
        if (!spec.startsWith('@/')) return spec;

        if (spec === '@/lib/utils') {
            return sharedBase ? `${sharedBase}/utils` : config.aliases.utils;
        }
        if (spec.startsWith('@/components/')) {
            return spec.replace('@/components', config.aliases.components);
        }
        if (spec.startsWith('@/composables/')) {
            return sharedBase
                ? spec.replace('@/composables', `${sharedBase}/hooks`)
                : spec.replace('@/composables', composablesAlias);
        }
        if (spec.startsWith('@/lib/')) {
            return sharedBase
                ? spec.replace('@/lib', `${sharedBase}/lib`)
                : spec.replace('@/lib', libAlias);
        }
        if (spec.startsWith('@/locales/')) {
            return spec.replace('@/locales', localesAlias);
        }
        if (spec.startsWith('@/directives/')) {
            return spec.replace('@/directives', directivesAlias);
        }
        return spec;
    }, filename);
}

export { assertSafePath, isSafePath, verifyWrittenPath } from './security.js';
