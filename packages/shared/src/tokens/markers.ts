export const ROOT_START: string = '/* @brutx:root-tokens:start */';
export const ROOT_END: string = '/* @brutx:root-tokens:end */';
export const THEME_START: string = '/* @brutx:theme-tokens:start */';
export const THEME_END: string = '/* @brutx:theme-tokens:end */';
export const PRESETS_START: string = '/* @brutx:theme-presets:start */';
export const PRESETS_END: string = '/* @brutx:theme-presets:end */';
export const FONT_STACK_START: string = '/* @brutx:font-stack:start */';
export const FONT_STACK_END: string = '/* @brutx:font-stack:end */';
export const COLOR_NAMES_START: string = '/* @brutx:color-names:start */';
export const COLOR_NAMES_END: string = '/* @brutx:color-names:end */';
export const Z_INDEX_NAMES_START: string = '/* @brutx:z-index-names:start */';
export const Z_INDEX_NAMES_END: string = '/* @brutx:z-index-names:end */';
export const CLI_UTILS_START: string = '/* @brutx:cli-utils-template:start */';
export const CLI_UTILS_END: string = '/* @brutx:cli-utils-template:end */';
export const PATTERN_UTILS_START: string = '/* @brutx:pattern-utilities:start */';
export const PATTERN_UTILS_END: string = '/* @brutx:pattern-utilities:end */';
export const CLI_UTIL_RULES_START: string = '/* @brutx:utility-rules:start */';
export const CLI_UTIL_RULES_END: string = '/* @brutx:utility-rules:end */';

/**
 * 纯内存文本区间打补丁工具函数
 */
export function replaceBetweenMarkers(
    content: string,
    startMarker: string,
    endMarker: string,
    replacement: string,
    sourceLabel?: string,
): string {
    const startIdx: number = content.indexOf(startMarker);
    const endIdx: number = content.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
        const target: string = sourceLabel ? `在 ${sourceLabel} 中` : '';
        throw new Error(
            `无法${target}找到注入标记。请确认存在 "${startMarker}" 与 "${endMarker}"。`,
        );
    }
    const startLineStart: number = content.lastIndexOf('\n', startIdx) + 1;
    const indent: string = content.slice(startLineStart, startIdx);
    const before: string = content.slice(0, startIdx + startMarker.length);
    const after: string = content.slice(endIdx);
    return `${before}\n${replacement}\n${indent}${after}`;
}
