import {
    AVAILABLE_COMPONENTS,
    COMPONENT_METADATA,
    type RegistryFileType,
} from 'brutx-shared-vue';
import {
    SfcAstEngine,
    type ClassifiedModuleSpecifier,
} from 'brutx-shared-vue/ast';
import type { RewriteContext } from './types.js';

export {
    type ClassifiedModuleSpecifier,
};

/**
 * 提取代码中所有模块导入（纯字符串数组）
 */
export function extractModuleSpecifiers(code: string, filename = 'component.vue'): string[] {
    return SfcAstEngine.extractModuleSpecifiers(code, filename).map(item => item.specifier);
}

/**
 * 提取代码中分类的模块导入（含 isTypeOnly, isDynamic）
 */
export function extractClassifiedModuleSpecifiers(code: string, filename = 'component.vue'): ClassifiedModuleSpecifier[] {
    return SfcAstEngine.extractModuleSpecifiers(code, filename);
}

/**
 * 提取 Vue SFC 中所有的 <script> 块及其在源码中的绝对字符起止偏移量（基于 SfcAstEngine 单一信源）。
 */
export function extractScriptBlocksWithOffsets(code: string): Array<{ content: string; start: number; end: number }> {
    const desc = SfcAstEngine.parse(code);
    const blocks: Array<{ content: string; start: number; end: number }> = [];
    if (desc.isSfc && (desc.script || desc.scriptSetup)) {
        if (desc.script) blocks.push({ content: desc.script.content, start: desc.script.startOffset, end: desc.script.endOffset });
        if (desc.scriptSetup) blocks.push({ content: desc.scriptSetup.content, start: desc.scriptSetup.startOffset, end: desc.scriptSetup.endOffset });
    } else {
        blocks.push({ content: code, start: 0, end: code.length });
    }
    return blocks;
}

const CONTEXT_ALIAS_PREFIX: Record<RewriteContext, string> = {
    component: '@/components/ui/',
    composable: '@/composables/',
    lib: '@/lib/',
    directive: '@/directives/',
    locale: '@/locales/',
};

const KNOWN_DIR_PREFIXES: Record<string, string> = {
    composables: '@/composables/',
    lib: '@/lib/',
    locales: '@/locales/',
    directives: '@/directives/',
};

/**
 * 计算单个 import/export specifier 重写后的目标别名。
 * 若无需重写则返回原 specifier。
 */
export function resolveRewrittenSpecifier(
    specifier: string,
    componentName: string,
    context: RewriteContext = 'component',
    knownComponents: Set<string> = new Set(AVAILABLE_COMPONENTS)
): string {
    // 1. ../composables/..., ../lib/..., ../locales/..., ../directives/... (支持单层或多层 ../)
    for (const [prefix, alias] of Object.entries(KNOWN_DIR_PREFIXES)) {
        const match = new RegExp(`^(?:\\.\\./)+${prefix}/(.+)$`).exec(specifier);
        if (match && match[1]) {
            return `${alias}${match[1]}`;
        }
    }

    // 2. ../components/{name}/... (支持单层或多层 ../)
    const crossCompMatch1 = /^(?:\.\.\/)+components\/([a-zA-Z0-9-]+)\/(.+)$/.exec(specifier);
    if (crossCompMatch1 && crossCompMatch1[1] && crossCompMatch1[2]) {
        const targetComp = crossCompMatch1[1];
        if (knownComponents.has(targetComp)) {
            return `@/components/ui/${targetComp}/${crossCompMatch1[2]}`;
        }
    }

    // 3. ../{name}/...
    const crossCompMatch2 = /^(?:\.\.\/)+([a-zA-Z0-9-]+)\/(.+)$/.exec(specifier);
    if (crossCompMatch2 && crossCompMatch2[1] && crossCompMatch2[2]) {
        const targetComp = crossCompMatch2[1];
        if (knownComponents.has(targetComp)) {
            return `@/components/ui/${targetComp}/${crossCompMatch2[2]}`;
        }
    }

    // 4. ./{file} 同目录相对导入
    const sameDirMatch = /^\.\/(.+)$/.exec(specifier);
    if (sameDirMatch && sameDirMatch[1]) {
        if (context === 'component') {
            return `@/components/ui/${componentName}/${sameDirMatch[1]}`;
        }
        return `${CONTEXT_ALIAS_PREFIX[context]}${sameDirMatch[1]}`;
    }

    return specifier;
}

/**
 * 基于 SfcAstEngine 与 MagicString 保真重写源码中的相对导入路径。
 * 完全保留原始缩进、空格、换行、行内注释与 Vue SFC 模板。
 */
export function rewriteImports(
    code: string,
    componentName: string,
    context: RewriteContext = 'component',
    knownComponents?: Set<string>,
    filename?: string
): string {
    const known = knownComponents ?? new Set(AVAILABLE_COMPONENTS);
    const actualFilename = filename ?? (context === 'component' ? 'component.vue' : `${context}.ts`);
    return SfcAstEngine.transformImports(code, ctx => {
        return resolveRewrittenSpecifier(ctx.specifier, componentName, context, known);
    }, actualFilename);
}

/**
 * 提取代码中指定前缀目录（如 'lib', 'composables', 'locales'）的相对文件依赖。
 */
export function extractDeps(code: string, dirPrefix: string): string[] {
    const specifiers = extractModuleSpecifiers(code);
    const prefix = `@/${dirPrefix}/`;
    const deps = new Set<string>();

    for (const spec of specifiers) {
        if (spec.startsWith(prefix)) {
            const remainder = spec.slice(prefix.length).split(/[?#]/)[0];
            if (remainder) {
                const normalized = remainder.endsWith('.ts') || remainder.endsWith('.vue') || remainder.endsWith('.css')
                    ? remainder
                    : `${remainder}.ts`;
                deps.add(normalized);
            }
        }
    }

    return Array.from(deps);
}

/**
 * 提取代码中引用的其他注册表组件依赖（不含当前组件自身，跳过纯类型导入，仅收集已知组件）。
 */
export function extractRegistryDeps(code: string, componentName: string, knownComponents?: Set<string>): string[] {
    const items = extractClassifiedModuleSpecifiers(code);
    const prefix = '@/components/ui/';
    const deps = new Set<string>();

    for (const item of items) {
        if (item.isTypeOnly) continue;
        const spec = item.specifier;
        if (spec.startsWith(prefix)) {
            const remainder = spec.slice(prefix.length);
            const comp = remainder.split('/')[0];
            if (comp && comp !== componentName) {
                const isKnown = knownComponents ? knownComponents.has(comp) : Boolean(COMPONENT_METADATA[comp]);
                if (isKnown) {
                    deps.add(comp);
                }
            }
        }
    }

    return Array.from(deps);
}

/**
 * 提取同一组件内部的其它源文件依赖（相对组件目录的相对文件名）。
 */
export function extractComponentFileDeps(code: string, componentName: string): string[] {
    const specifiers = extractModuleSpecifiers(code);
    const prefix = `@/components/ui/${componentName}/`;
    const files = new Set<string>();

    for (const spec of specifiers) {
        if (spec.startsWith(prefix)) {
            const file = spec.slice(prefix.length);
            if (file && file !== 'index.ts' && file !== 'index') {
                const normalized = file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.css')
                    ? file
                    : `${file}.ts`;
                files.add(normalized);
            }
        }
    }

    return Array.from(files);
}

/**
 * 提取代码中未在 COMPONENT_METADATA 中声明的未知组件别名。
 */
export function extractUnknownRegistryDeps(code: string): string[] {
    const specifiers = extractModuleSpecifiers(code);
    const prefix = '@/components/ui/';
    const unknowns = new Set<string>();

    for (const spec of specifiers) {
        if (spec.startsWith(prefix)) {
            const remainder = spec.slice(prefix.length);
            const comp = remainder.split('/')[0];
            if (comp && !COMPONENT_METADATA[comp]) {
                unknowns.add(comp);
            }
        }
    }

    return Array.from(unknowns);
}

/**
 * 断言代码中所有组件导入均属于合法已注册组件，否则抛出附带源上下文的错误。
 */
export function assertKnownRegistryDeps(code: string, ownerName: string, sourceLabel: string): string[] {
    const unknowns = extractUnknownRegistryDeps(code);
    if (unknowns.length > 0) {
        throw new Error(
            `Unknown registry component import(s) in "${ownerName}" (${sourceLabel}): ${unknowns.join(', ')}`
        );
    }
    return unknowns;
}

/**
 * 依据路径推导 RegistryFileType。
 */
export function getFileType(filePath: string): RegistryFileType {
    const posix = filePath.replace(/\\/g, '/');
    if (posix.startsWith('composables/') || posix.includes('/composables/')) return 'registry:hook';
    if (posix.startsWith('directives/') || posix.includes('/directives/')) return 'registry:directive';
    if (posix.startsWith('lib/') || posix.includes('/lib/')) return 'registry:lib';
    if (posix.endsWith('.vue') || posix.endsWith('.css')) return 'registry:ui';
    return 'registry:lib';
}
