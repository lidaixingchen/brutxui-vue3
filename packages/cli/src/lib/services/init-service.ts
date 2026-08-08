import fs from 'fs-extra';
import path from 'path';
import type { AliasConfig, BrutalistConfig, ProjectType, TailwindConfig } from '../types.js';
import {
    CONFIG_FILES,
    CURRENT_CONFIG_VERSION,
    BRUTX_CSS_START_MARKER,
    BRUTX_CSS_END_MARKER,
    getBrutalistCssStyles,
    SCHEMA_URL,
    UTILS_TEMPLATE,
} from '../constants.js';
import { FileTransaction } from '../file-transaction.js';
import { isSafePath, resolveAliasPath, resolveUtilsFilePath } from '../project.js';

export interface ProjectInitializationSettings {
    tailwind: TailwindConfig;
    aliases: AliasConfig;
    sharedBase?: string;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    configFile?: string;
    /** write-failed 时的底层失败原因（权限/磁盘空间等），避免外层只报通用文案 */
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
    onUtilityHelper?: (result: { alias: string; path: string; created: boolean }) => void;
    onComponentsDirectory?: (result: { path: string }) => void;
    onStyles?: (result: { cssPath: string; added: boolean }) => void;
    onNuxtConfig?: (result: NuxtConfigResult) => void;
}

export interface ProjectInitializationOptions {
    cwd: string;
    projectType: ProjectType;
    settings: ProjectInitializationSettings;
    callbacks?: ProjectInitializationCallbacks;
}

async function createConfigFile(
    cwd: string,
    settings: ProjectInitializationSettings,
    transaction: FileTransaction
): Promise<BrutalistConfig> {
    const config: BrutalistConfig = {
        $schema: SCHEMA_URL,
        $version: CURRENT_CONFIG_VERSION,
        style: 'brutalism',
        tailwind: settings.tailwind,
        aliases: settings.aliases,
        ...(settings.sharedBase ? { sharedBase: settings.sharedBase } : {}),
    };

    await transaction.writeJson(path.join(cwd, 'components.json'), config, { spaces: 2 });
    return config;
}

async function addBrutalistStyles(cwd: string, cssPath: string, transaction: FileTransaction): Promise<boolean> {
    const fullPath = path.join(cwd, cssPath);

    if (!(await isSafePath(fullPath, cwd))) {
        throw new Error(`Security Error: CSS path traversal detected. Access denied to path "${fullPath}".`);
    }

    await transaction.ensureDir(path.dirname(fullPath));

    const brutalistCss = await getBrutalistCssStyles();
    const brutxBlock = `${BRUTX_CSS_START_MARKER}\n${brutalistCss}\n${BRUTX_CSS_END_MARKER}`;

    let content: string;
    if (await fs.pathExists(fullPath)) {
        content = await fs.readFile(fullPath, 'utf-8');
        const markerPattern = new RegExp(
            `${escapeRegex(BRUTX_CSS_START_MARKER)}[\\s\\S]*?${escapeRegex(BRUTX_CSS_END_MARKER)}`
        );
        if (markerPattern.test(content)) {
            content = content.replace(markerPattern, brutxBlock);
        } else if (
            content.includes('--color-brutal-bg')
            && content.includes('.bg-brutal-primary')
            && content.includes('.animate-in')
        ) {
            return false;
        } else {
            if (!content.endsWith('\n') && content.length > 0) {
                content += '\n';
            }
            content += brutxBlock;
        }
    } else {
        content = `@import "tailwindcss";\n${brutxBlock}`;
    }

    await transaction.writeFile(fullPath, content);
    return true;
}

async function findNuxtConfig(cwd: string): Promise<string | null> {
    for (const file of CONFIG_FILES.nuxt) {
        const fullPath = path.join(cwd, file);
        if (await fs.pathExists(fullPath)) {
            return fullPath;
        }
    }
    return null;
}

/**
 * 定位 defineNuxtConfig(...) 参数对象 `{ ... }` 根块的首尾索引。
 *
 * 从 `defineNuxtConfig` 之后开始扫描，跳过字符串字面量、模板字符串、注释，
 * 以及参数括号前的泛型参数段（`defineNuxtConfig<{...}>`），避免：
 *   - 字符串/注释里的括号（如 head: { script: [{ innerHTML: 'if (x) { y }' }] }）干扰配对深度
 *   - 泛型参数里的 `{`（如 defineNuxtConfig<{ modules: string[] }>）被误认为根块起点
 *
 * 返回 { start, end }（根块首尾 `{`/`}` 的索引），未找到返回 null。
 * 与 hasRootObjectKey 相同的已知限制：模板字符串内嵌套反引号与正则字面量不识别，Nuxt 配置中罕见。
 */
function findNuxtRootBlock(content: string, start: number): { start: number; end: number } | null {
    let braceIndex = -1;
    let depth = 0;
    let i = start;
    let inGenerics = false;
    let genericsDepth = 0;
    let inParameters = false;

    while (i < content.length) {
        const ch = content[i];
        const next = content[i + 1];

        if (ch === '/' && next === '/') {
            const nl = content.indexOf('\n', i + 2);
            i = nl === -1 ? content.length : nl + 1;
            continue;
        }
        if (ch === '/' && next === '*') {
            const end = content.indexOf('*/', i + 2);
            i = end === -1 ? content.length : end + 2;
            continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
            const quote = ch;
            i++;
            while (i < content.length) {
                if (content[i] === '\\') { i += 2; continue; }
                if (content[i] === quote) { i++; break; }
                i++;
            }
            continue;
        }

        if (!inParameters) {
            // 参数括号之前：`<` 视为泛型段开始（Nuxt 配置中此处无比较运算），
            // 泛型内只计数 <>，{ } 与字符串均不参与根块配对
            if (ch === '<') {
                inGenerics = true;
                genericsDepth = 1;
                i++;
                continue;
            }
            if (inGenerics) {
                if (ch === '<') genericsDepth++;
                else if (ch === '>') {
                    genericsDepth--;
                    if (genericsDepth === 0) inGenerics = false;
                }
                i++;
                continue;
            }
            if (ch === '(') {
                inParameters = true;
                i++;
                continue;
            }
            i++;
            continue;
        }

        if (ch === '{') {
            if (braceIndex === -1) braceIndex = i;
            depth++;
            i++;
            continue;
        }
        if (ch === '}') {
            depth--;
            if (depth === 0 && braceIndex !== -1) {
                return { start: braceIndex, end: i };
            }
            i++;
            continue;
        }
        i++;
    }
    return null;
}

/**
 * 检测 rootBlock（形如 `{ ... }` 的根对象文本）第一层是否存在指定键。
 * 跳过字符串、注释与嵌套对象，避免 /\bkey\s*:/ 因 \s* 跨行而误命中
 * 嵌套对象（如 vite: { css: ... }）或注释里的字面量，导致根级配置漏注入。
 *
 * 已知限制：不识别正则字面量（如 `/}/`、`/{/` 中的花括号会计入深度）以及模板字符串
 * 内嵌套反引号（`` `a${`b`}c` ``）；此类写法在 Nuxt 配置中罕见，可接受。
 */
function hasRootObjectKey(rootBlock: string, key: string): boolean {
    let depth = 0;
    let i = 0;
    while (i < rootBlock.length) {
        const ch = rootBlock[i];
        const next = rootBlock[i + 1];

        if (ch === '/' && next === '/') {
            while (i < rootBlock.length && rootBlock[i] !== '\n') i++;
            continue;
        }
        if (ch === '/' && next === '*') {
            const end = rootBlock.indexOf('*/', i + 2);
            i = end === -1 ? rootBlock.length : end + 2;
            continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
            const quote = ch;
            i++;
            while (i < rootBlock.length) {
                if (rootBlock[i] === '\\') { i += 2; continue; }
                if (rootBlock[i] === quote) { i++; break; }
                i++;
            }
            continue;
        }
        if (ch === '{') { depth++; i++; continue; }
        if (ch === '}') { depth--; i++; continue; }

        // 仅匹配根对象第一层（depth === 1，rootBlock 以外层 { 开头）
        if (depth === 1 && ch === key[0] && rootBlock.startsWith(key, i)) {
            const prev = i > 0 ? rootBlock[i - 1] : '';
            const isWordBoundary = prev === '' || !/[a-zA-Z0-9_$]/.test(prev);
            const after = rootBlock.slice(i + key.length);
            // 允许键名与冒号之间存在空白或块注释（如 `components /* 目录 */ :` 这类合法写法）
            if (isWordBoundary && /^(?:\s|\/\*[\s\S]*?\*\/)*:/.test(after)) {
                return true;
            }
        }
        i++;
    }
    return false;
}

export function injectNuxtConfig(content: string, cssPath: string, componentsRelDir: string): string | null {
    // 只定位函数名，不匹配调用括号：泛型形式 defineNuxtConfig<{...}>(...) 下
    // 括号与泛型段统一由 findNuxtRootBlock 扫描处理
    const defineMatch = content.match(/defineNuxtConfig\b/);
    if (!defineMatch || defineMatch.index === undefined) {
        return null;
    }

    const afterDefine = defineMatch.index + defineMatch[0].length;
    const block = findNuxtRootBlock(content, afterDefine);
    if (!block) {
        return null;
    }
    const { start: braceIndex, end: rootEnd } = block;
    const rootBlock = content.slice(braceIndex, rootEnd + 1);
    // 只检测根对象第一层的键名（跳过字符串/注释/嵌套对象），避免误判导致根级配置漏注入
    const hasComponents = hasRootObjectKey(rootBlock, 'components');
    const hasCss = hasRootObjectKey(rootBlock, 'css');

    if (hasComponents && hasCss) {
        return content;
    }

    const insertions: string[] = [];

    if (!hasComponents) {
        insertions.push(`\n    components: ['~/${componentsRelDir}'],`);
    }

    if (!hasCss) {
        insertions.push(`\n    css: ['${cssPath}'],`);
    }

    const before = content.slice(0, braceIndex + 1);
    const after = content.slice(braceIndex + 1);

    return before + insertions.join('') + after;
}

async function configureNuxtConfig(
    cwd: string,
    cssPath: string,
    componentsDir: string,
    transaction: FileTransaction
): Promise<NuxtConfigResult> {
    const configPath = await findNuxtConfig(cwd);
    const componentsRelDir = path.relative(cwd, componentsDir).replace(/\\/g, '/');

    if (!configPath) {
        return {
            configured: false,
            status: 'not-found',
            cssPath,
            componentsRelDir,
        };
    }

    const original = await fs.readFile(configPath, 'utf-8');
    const result = injectNuxtConfig(original, cssPath, componentsRelDir);
    const configFile = path.basename(configPath);

    if (result === null) {
        return {
            configured: false,
            status: 'manual-required',
            cssPath,
            componentsRelDir,
            configFile,
        };
    }

    if (result === original) {
        return {
            configured: true,
            status: 'already-configured',
            cssPath,
            componentsRelDir,
            configFile,
        };
    }

    try {
        await transaction.writeFile(configPath, result);
        return {
            configured: true,
            status: 'updated',
            cssPath,
            componentsRelDir,
            configFile,
        };
    } catch (error) {
        // 携带底层失败原因（权限/磁盘空间等），避免外层只报固定文案
        return {
            configured: false,
            status: 'write-failed',
            cssPath,
            componentsRelDir,
            configFile,
            errorMessage: error instanceof Error ? error.message : String(error),
        };
    }
}

export async function initializeProjectFiles(options: ProjectInitializationOptions): Promise<ProjectInitializationResult> {
    const { cwd, projectType, settings, callbacks } = options;
    const transaction = new FileTransaction();

    try {
        const config = await createConfigFile(cwd, settings, transaction);

        const utilsPath = await resolveUtilsFilePath(settings, cwd);
        await transaction.ensureDir(path.dirname(utilsPath));
        const utilsCreated = !(await fs.pathExists(utilsPath));
        if (utilsCreated) {
            await transaction.writeFile(utilsPath, UTILS_TEMPLATE);
        }
        callbacks?.onUtilityHelper?.({
            alias: settings.sharedBase ? `${settings.sharedBase}/utils` : settings.aliases.utils,
            path: utilsPath,
            created: utilsCreated,
        });

        const componentsDir = await resolveAliasPath(settings.aliases.components, cwd);
        await transaction.ensureDir(path.join(componentsDir, 'ui'));
        callbacks?.onComponentsDirectory?.({ path: componentsDir });

        const stylesAdded = await addBrutalistStyles(cwd, settings.tailwind.css, transaction);
        callbacks?.onStyles?.({ cssPath: settings.tailwind.css, added: stylesAdded });

        const nuxt = projectType === 'nuxt'
            ? await configureNuxtConfig(cwd, settings.tailwind.css, componentsDir, transaction)
            : {
                configured: false,
                status: 'skipped' as const,
                cssPath: settings.tailwind.css,
                componentsRelDir: path.relative(cwd, componentsDir).replace(/\\/g, '/'),
            };
        callbacks?.onNuxtConfig?.(nuxt);

        if (nuxt.status === 'write-failed') {
            const detail = nuxt.errorMessage ? `: ${nuxt.errorMessage}` : '';
            throw new Error(`Failed to write Nuxt config at ${nuxt.configFile}${detail}`);
        }

        await transaction.commit();

        return {
            config,
            utilsPath,
            utilsCreated,
            componentsDir,
            stylesAdded,
            nuxt,
        };
    } catch (error) {
        const rollbackFailures = await transaction.rollback();
        return Promise.reject(Object.assign(error instanceof Error ? error : new Error(String(error)), {
            rollbackFailures,
        }));
    }
}
