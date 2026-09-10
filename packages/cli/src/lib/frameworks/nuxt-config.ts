export interface NuxtConfigInjectionOptions {
    cssPath: string;
    componentsRelDir: string;
}

export interface ConfigInjectionResult {
    content: string;
    changed: boolean;
    status: 'injected' | 'unchanged' | 'manual-required';
}

function findDefineNuxtConfigCall(content: string): number | null {
    let i = 0;
    const target = 'defineNuxtConfig';
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

        if (content.startsWith(target, i)) {
            const prev = i > 0 ? content[i - 1] : '';
            const isWordBoundaryBefore = prev === '' || !/[a-zA-Z0-9_$]/.test(prev);
            const afterIndex = i + target.length;
            const nextChar = afterIndex < content.length ? content[afterIndex] : '';
            const isWordBoundaryAfter = nextChar === '' || !/[a-zA-Z0-9_$]/.test(nextChar);

            if (isWordBoundaryBefore && isWordBoundaryAfter) {
                let j = afterIndex;
                while (j < content.length) {
                    const c = content[j];
                    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
                        j++;
                        continue;
                    }
                    if (c === '/' && content[j + 1] === '*') {
                        const end = content.indexOf('*/', j + 2);
                        if (end === -1) break;
                        j = end + 2;
                        continue;
                    }
                    break;
                }
                if (j < content.length && (content[j] === '<' || content[j] === '(')) {
                    return afterIndex;
                }
            }
        }
        i++;
    }
    return null;
}

function findNuxtRootBlock(content: string, start: number): { start: number; end: number } | null {
    let braceIndex = -1;
    let depth = 0;
    let i = start;
    let inGenerics = false;
    let genericsDepth = 0;
    let inParameters = false;
    let hasArrow = false;
    let hasParenAfterArrow = false;

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
            if (ch === '<') {
                inGenerics = true;
                genericsDepth = 1;
                i++;
                continue;
            }
            if (inGenerics) {
                if (ch === '<') genericsDepth++;
                else if (ch === '>' && content[i - 1] !== '=') {
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

        if (depth === 0) {
            if (content.startsWith('function', i) && (i === 0 || !/[a-zA-Z0-9_$]/.test(content[i - 1]))) {
                const afterFunc = i + 8;
                if (afterFunc >= content.length || !/[a-zA-Z0-9_$]/.test(content[afterFunc])) {
                    return null;
                }
            }
            if (ch === '=' && next === '>') {
                hasArrow = true;
                i += 2;
                continue;
            }
            if (hasArrow && ch === '(') {
                hasParenAfterArrow = true;
                i++;
                continue;
            }
        }

        if (ch === '{') {
            if (hasArrow && !hasParenAfterArrow) {
                return null;
            }
            if (braceIndex === -1) braceIndex = i;
            depth++;
            i++;
            continue;
        }
        if (ch === '}') {
            if (braceIndex === -1) {
                return null;
            }
            depth--;
            if (depth === 0) {
                return { start: braceIndex, end: i };
            }
            i++;
            continue;
        }
        i++;
    }
    return null;
}

function isColonNext(str: string, startIndex: number): boolean {
    let j = startIndex;
    while (j < str.length) {
        const ch = str[j];
        if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
            j++;
            continue;
        }
        if (ch === '/' && str[j + 1] === '/') {
            const nl = str.indexOf('\n', j + 2);
            j = nl === -1 ? str.length : nl + 1;
            continue;
        }
        if (ch === '/' && str[j + 1] === '*') {
            const end = str.indexOf('*/', j + 2);
            if (end === -1) {
                return false;
            }
            j = end + 2;
            continue;
        }
        return ch === ':';
    }
    return false;
}

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
            const strStart = i + 1;
            i++;
            while (i < rootBlock.length) {
                if (rootBlock[i] === '\\') { i += 2; continue; }
                if (rootBlock[i] === quote) { break; }
                i++;
            }
            const strContent = rootBlock.slice(strStart, i);
            if (i < rootBlock.length) i++;

            if (depth === 1 && (quote === '"' || quote === "'") && strContent === key) {
                if (isColonNext(rootBlock, i)) {
                    return true;
                }
            }
            continue;
        }
        if (ch === '{') { depth++; i++; continue; }
        if (ch === '}') { depth--; i++; continue; }

        if (depth === 1 && ch === key[0] && rootBlock.startsWith(key, i)) {
            const prev = i > 0 ? rootBlock[i - 1] : '';
            const isWordBoundary = prev === '' || !/[a-zA-Z0-9_$]/.test(prev);
            if (isWordBoundary && isColonNext(rootBlock, i + key.length)) {
                return true;
            }
        }
        i++;
    }
    return false;
}

export function injectNuxtConfig(
    content: string,
    options: NuxtConfigInjectionOptions
): ConfigInjectionResult;
export function injectNuxtConfig(
    content: string,
    cssPath: string,
    componentsRelDir: string
): string | null;
export function injectNuxtConfig(
    content: string,
    optionsOrCssPath: NuxtConfigInjectionOptions | string,
    maybeComponentsRelDir?: string
): ConfigInjectionResult | string | null {
    const isLegacy = typeof optionsOrCssPath === 'string';
    const cssPath = isLegacy ? optionsOrCssPath : optionsOrCssPath.cssPath;
    const componentsRelDir = isLegacy ? (maybeComponentsRelDir ?? '') : optionsOrCssPath.componentsRelDir;

    const afterDefine = findDefineNuxtConfigCall(content);
    if (afterDefine === null) {
        if (isLegacy) return null;
        return {
            content,
            changed: false,
            status: 'manual-required',
        };
    }

    const block = findNuxtRootBlock(content, afterDefine);
    if (!block) {
        if (isLegacy) return null;
        return {
            content,
            changed: false,
            status: 'manual-required',
        };
    }

    const { start: braceIndex, end: rootEnd } = block;
    const rootBlock = content.slice(braceIndex, rootEnd + 1);
    const hasComponents = hasRootObjectKey(rootBlock, 'components');
    const hasCss = hasRootObjectKey(rootBlock, 'css');

    if (hasComponents && hasCss) {
        if (isLegacy) return content;
        return {
            content,
            changed: false,
            status: 'unchanged',
        };
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
    const newContent = before + insertions.join('') + after;

    if (isLegacy) return newContent;
    return {
        content: newContent,
        changed: true,
        status: 'injected',
    };
}
