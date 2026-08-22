import {
    CSS_VARS,
    BASE_THEME,
    THEME_PRESETS,
    TOKEN_TO_CSS_VAR,
    FONT_STACK,
    FONT_STACK_PARTS,
    EASING_TOKENS,
    SUBTLE_COLOR_DEFS,
    SHADOW_DEFINITIONS,
    NON_COLOR_TOKEN_KEYS,
    BRUTAL_COLOR_NAMES,
    BRUTAL_Z_INDEX_NAMES,
    Z_INDEX_CLASS_ENTRIES,
    type ThemeTokens,
} from 'brutx-shared-vue';

export const ROOT_START = '/* @brutx:root-tokens:start */';
export const ROOT_END = '/* @brutx:root-tokens:end */';
export const THEME_START = '/* @brutx:theme-tokens:start */';
export const THEME_END = '/* @brutx:theme-tokens:end */';
export const PRESETS_START = '/* @brutx:theme-presets:start */';
export const PRESETS_END = '/* @brutx:theme-presets:end */';
export const FONT_STACK_START = '/* @brutx:font-stack:start */';
export const FONT_STACK_END = '/* @brutx:font-stack:end */';
export const COLOR_NAMES_START = '/* @brutx:color-names:start */';
export const COLOR_NAMES_END = '/* @brutx:color-names:end */';
export const Z_INDEX_NAMES_START = '/* @brutx:z-index-names:start */';
export const Z_INDEX_NAMES_END = '/* @brutx:z-index-names:end */';
export const CLI_UTILS_START = '/* @brutx:cli-utils-template:start */';
export const CLI_UTILS_END = '/* @brutx:cli-utils-template:end */';
export const PATTERN_UTILS_START = '/* @brutx:pattern-utilities:start */';
export const PATTERN_UTILS_END = '/* @brutx:pattern-utilities:end */';
export const CLI_UTIL_RULES_START = '/* @brutx:utility-rules:start */';
export const CLI_UTIL_RULES_END = '/* @brutx:utility-rules:end */';

/**
 * 纹理工具类单一数据源：
 * ui 侧经 compilePatternUtilityBlock 生成 @utility 声明（Tailwind v4 编译器据此派生变体修饰符），
 * CLI 消费方经 compileCliUtilityRules 生成等价扁平 CSS 直挂规则，彻底消除双实现漂移。
 */
interface PatternUtilityDefinition {
    name: string;
    comment: string;
    declarations: string[];
    /** 伪元素/子选择器规则；ui 侧以 & 嵌套输出，CLI 侧展开为 `.name selector` */
    nestedRules?: Array<{ selector: string; declarations: string[] }>;
}

const PATTERN_UTILITIES: PatternUtilityDefinition[] = [
    {
        name: 'bg-pattern-dots',
        comment: '半色调点阵：报刊网点印花、胶印网屏',
        declarations: [
            'background-image: radial-gradient(color-mix(in srgb, var(--brutal-border-color, #000000) 18%, transparent) 1.5px, transparent 1.5px);',
            'background-size: 12px 12px;',
        ],
    },
    {
        name: 'bg-pattern-grid',
        comment: '蓝图方格：毫米坐标纸、CAD 工程图',
        declarations: [
            'background-image: linear-gradient(to right, color-mix(in srgb, var(--brutal-border-color, #000000) 12%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--brutal-border-color, #000000) 12%, transparent) 1px, transparent 1px);',
            'background-size: 16px 16px;',
        ],
    },
    {
        name: 'bg-pattern-hazard',
        comment: '警戒斜纹：工业警示柱、施工重型机械',
        declarations: [
            'background-image: repeating-linear-gradient(-45deg, var(--brutal-accent, #FFE66D), var(--brutal-accent, #FFE66D) 10px, var(--brutal-border-color, #000000) 10px, var(--brutal-border-color, #000000) 20px);',
        ],
    },
    {
        name: 'bg-pattern-hatch',
        comment: '细斜线填充：工程制图剖面线、表头底纹',
        declarations: [
            'background-image: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--brutal-border-color, #000000) 12%, transparent) 0, color-mix(in srgb, var(--brutal-border-color, #000000) 12%, transparent) 1px, transparent 1px, transparent 8px);',
        ],
    },
    {
        name: 'bg-pattern-scanlines',
        comment: '扫描线：CRT 终端扫描余辉',
        declarations: [
            'background-image: repeating-linear-gradient(0deg, color-mix(in srgb, var(--brutal-border-color, #000000) 15%, transparent) 0, color-mix(in srgb, var(--brutal-border-color, #000000) 15%, transparent) 1px, transparent 1px, transparent 6px);',
        ],
    },
    {
        name: 'scrollbar-brutal',
        comment: '工控滚动条：工业仪器刻度导轨',
        declarations: [
            'scrollbar-color: var(--brutal-fg, #000000) var(--brutal-bg, #ffffff);',
        ],
        nestedRules: [
            {
                selector: '&::-webkit-scrollbar',
                declarations: ['width: 16px;', 'height: 16px;'],
            },
            {
                selector: '&::-webkit-scrollbar-track',
                declarations: [
                    'background: var(--brutal-bg, #ffffff);',
                    'border-left: 3px solid var(--brutal-border-color, #000000);',
                ],
            },
            {
                selector: '&::-webkit-scrollbar-thumb',
                declarations: [
                    'background: var(--brutal-fg, #000000);',
                    'border: 2px solid var(--brutal-bg, #ffffff);',
                ],
            },
        ],
    },
    {
        name: 'button-ticket-notch',
        comment: '票据撕口：左右中缝半圆缺口（ticket 变体专用形态工具类）',
        declarations: [
            '-webkit-mask-image: radial-gradient(circle 6px at 0 center, transparent 5px, black 6px), radial-gradient(circle 6px at 100% center, transparent 5px, black 6px);',
            'mask-image: radial-gradient(circle 6px at 0 center, transparent 5px, black 6px), radial-gradient(circle 6px at 100% center, transparent 5px, black 6px);',
            '-webkit-mask-composite: source-in;',
            'mask-composite: intersect;',
        ],
    },
    {
        name: 'hud-crosshairs',
        comment: 'HUD 四角十字准星：工业仪器标定对齐感（::before 承载，不与背景纹理类的 background-image 冲突）',
        declarations: [
            'position: relative;',
        ],
        nestedRules: [
            {
                selector: '&::before',
                declarations: [
                    'content: "";',
                    'position: absolute;',
                    'inset: 0;',
                    'pointer-events: none;',
                    'background-image: linear-gradient(var(--brutal-border-color, #000000), var(--brutal-border-color, #000000)), linear-gradient(var(--brutal-border-color, #000000), var(--brutal-border-color, #000000)), linear-gradient(var(--brutal-border-color, #000000), var(--brutal-border-color, #000000)), linear-gradient(var(--brutal-border-color, #000000), var(--brutal-border-color, #000000)), linear-gradient(var(--brutal-border-color, #000000), var(--brutal-border-color, #000000)), linear-gradient(var(--brutal-border-color, #000000), var(--brutal-border-color, #000000)), linear-gradient(var(--brutal-border-color, #000000), var(--brutal-border-color, #000000)), linear-gradient(var(--brutal-border-color, #000000), var(--brutal-border-color, #000000));',
                    'background-repeat: no-repeat;',
                    'background-size: 18px 2px, 2px 18px, 18px 2px, 2px 18px, 18px 2px, 2px 18px, 18px 2px, 2px 18px;',
                    'background-position: 5px 13px, 13px 5px, right 5px top 13px, right 13px top 5px, 5px bottom 13px, 13px bottom 5px, right 5px bottom 13px, right 13px bottom 5px;',
                ],
            },
        ],
    },
];

interface ThemeEntry {
    themeVar: string;
    build: (l: ThemeTokens) => string;
}

interface ThemeGroup {
    comment: string;
    entries: ThemeEntry[];
}

interface SubtleEntry {
    varName: string;
    buildLight: (l: ThemeTokens) => string;
    buildDark: (d: ThemeTokens) => string;
}

const SHADOW_ENTRIES: ThemeEntry[] = SHADOW_DEFINITIONS.map(def => ({
    themeVar: def.themeVar,
    build: def.build,
}));

const SUBTLE_ENTRIES: SubtleEntry[] = SUBTLE_COLOR_DEFS.map(({ key, lightPct, darkPct }) => ({
    varName: `brutal-${key}-subtle`,
    buildLight: (l: ThemeTokens) => `color-mix(in srgb, var(--brutal-${key}, ${l[key]}) ${lightPct}%, var(--brutal-bg, #ffffff))`,
    buildDark: (d: ThemeTokens) => `color-mix(in srgb, var(--brutal-${key}, ${d[key]}) ${darkPct}%, var(--brutal-bg, #141414))`,
}));

const EASING_ENTRIES: ThemeEntry[] = Object.entries(EASING_TOKENS).map(([key, val]) => ({
    themeVar: `--ease-brutal-${key}`,
    build: () => val,
}));

const Z_INDEX_ENTRIES: ThemeEntry[] = Z_INDEX_CLASS_ENTRIES.map(def => ({
    themeVar: `--z-index-${def.name}`,
    build: () => String(def.value),
}));

const DYNAMIC_COLOR_ENTRIES: ThemeEntry[] = (Object.keys(TOKEN_TO_CSS_VAR) as Array<keyof ThemeTokens>)
    .filter(key => !NON_COLOR_TOKEN_KEYS.has(key))
    .map(key => {
        const cssVarName = TOKEN_TO_CSS_VAR[key];
        return {
            themeVar: `--color-${cssVarName}`,
            build: (l: ThemeTokens) => `var(--${cssVarName}, ${l[key]})`,
        };
    });

const THEME_GROUPS: ThemeGroup[] = [
    {
        comment:
            'Dynamic color tokens derived from design-tokens.ts:\n       Resolve at runtime via --brutal-* for dark mode and theme presets support.\n       Fallbacks sourced from BASE_THEME.light.',
        entries: DYNAMIC_COLOR_ENTRIES,
    },
    {
        comment: 'Dynamic: subtle backgrounds derived via color-mix',
        entries: SUBTLE_ENTRIES.map(e => ({
            themeVar: `--color-${e.varName}`,
            build: (l: ThemeTokens) => `var(--${e.varName}, ${e.buildLight(l)})`,
        })),
    },
    {
        comment: 'Dynamic: border/radius use --brutal-* for theme support',
        entries: [
            { themeVar: '--border-width-3', build: (l: ThemeTokens) => `var(--brutal-border-width, ${l.borderWidth})` },
            { themeVar: '--radius-brutal', build: (l: ThemeTokens) => `var(--brutal-radius, ${l.radius})` },
        ],
    },
    {
        comment: 'Default font family (preflight html/body 继承，可被消费方 @theme 覆盖)',
        entries: [
            {
                themeVar: '--default-font-family',
                build: () => FONT_STACK,
            },
        ],
    },
    {
        comment: 'brutal shadows：经 @theme 派生标准组装工具类，与 :root 双发射',
        entries: SHADOW_ENTRIES,
    },
    {
        comment: 'Mechanical motion easing curves',
        entries: EASING_ENTRIES,
    },
    {
        comment: 'Z-Index scale hierarchy derived from design-tokens.ts',
        entries: Z_INDEX_ENTRIES,
    },
];

export interface PatchResult {
    content: string;
    changed: boolean;
}

export class TokenStyleCompiler {
    public formatVarsBlock(selector: string, vars: Record<string, string>, indentSpaces = 4): string {
        const baseIndent = ' '.repeat(indentSpaces);
        const varIndent = ' '.repeat(indentSpaces + 4);
        const lines = Object.entries(vars).map(
            ([key, value]) => `${varIndent}--${key}: ${value};`,
        );
        return `${baseIndent}${selector} {\n${lines.join('\n')}\n${baseIndent}}`;
    }

    public compileRootBlock(indentSpaces = 4): string {
        const lightVars: Record<string, string> = { ...CSS_VARS.light };
        for (const entry of SHADOW_ENTRIES) {
            lightVars[entry.themeVar.slice(2)] = entry.build(BASE_THEME.light);
        }
        for (const entry of SUBTLE_ENTRIES) {
            lightVars[entry.varName] = entry.buildLight(BASE_THEME.light);
        }
        for (const entry of Z_INDEX_CLASS_ENTRIES) {
            lightVars[`z-index-${entry.name}`] = String(entry.value);
        }

        const darkVars: Record<string, string> = { ...CSS_VARS.dark };
        for (const entry of SUBTLE_ENTRIES) {
            darkVars[entry.varName] = entry.buildDark(BASE_THEME.dark);
        }
        for (const entry of Z_INDEX_CLASS_ENTRIES) {
            darkVars[`z-index-${entry.name}`] = String(entry.value);
        }

        const lightBlock = this.formatVarsBlock(':root', lightVars, indentSpaces);
        const darkBlock = this.formatVarsBlock('.dark', darkVars, indentSpaces);
        return `${lightBlock}\n\n${darkBlock}`;
    }

    public compileThemeBlock(): string {
        const light = BASE_THEME.light;
        const lines: string[] = [];
        for (let gi = 0; gi < THEME_GROUPS.length; gi++) {
            const group = THEME_GROUPS[gi];
            lines.push(`    /* ${group.comment} */`);
            for (const entry of group.entries) {
                lines.push(`    ${entry.themeVar}: ${entry.build(light)};`);
            }
            if (gi < THEME_GROUPS.length - 1) {
                lines.push('');
            }
        }
        return lines.join('\n');
    }

    public collectPresetVars(overrides: Partial<ThemeTokens>, presetName: string): Record<string, string> {
        const vars: Record<string, string> = {};
        for (const [tokenKey, value] of Object.entries(overrides)) {
            if (value === undefined) continue;
            const varName = TOKEN_TO_CSS_VAR[tokenKey as keyof ThemeTokens];
            if (!varName) {
                console.warn(`[TokenStyleCompiler] 预设 "${presetName}" 的 token "${tokenKey}" 缺少 CSS 变量映射，已跳过`);
                continue;
            }
            vars[varName] = value;
        }
        return vars;
    }

    public compileThemePresetsBlock(indentSpaces = 4): string {
        const blocks: string[] = [];
        const baseIndent = ' '.repeat(indentSpaces);
        for (const preset of Object.values(THEME_PRESETS)) {
            if (preset.description) {
                blocks.push(`${baseIndent}/* ${preset.description} */`);
            }
            const selector = `.theme-${preset.name}`;
            const darkSelector = `.dark .theme-${preset.name}, .theme-${preset.name}.dark`;

            const lightVars = this.collectPresetVars(preset.light, preset.name);
            blocks.push(this.formatVarsBlock(selector, lightVars, indentSpaces));

            const darkVars = this.collectPresetVars(preset.dark, preset.name);
            blocks.push(this.formatVarsBlock(darkSelector, darkVars, indentSpaces));
        }
        return blocks.join('\n\n');
    }

    public compileFontStackBlock(): string {
        const lines: string[] = [
            '        font-family: var(',
            '            --default-font-family,',
        ];
        for (let i = 0; i < FONT_STACK_PARTS.length; i++) {
            const comma = i < FONT_STACK_PARTS.length - 1 ? ',' : '';
            lines.push(`            ${FONT_STACK_PARTS[i]}${comma}`);
        }
        lines.push('        );');
        return lines.join('\n');
    }

    /**
     * ui 侧 @utility 声明块：由 PATTERN_UTILITIES 单一数据源生成，
     * Tailwind v4 编译器据此派生 hover:/dark:/md: 等变体修饰符
     */
    public compilePatternUtilityBlock(indentSpaces = 0): string {
        const baseIndent = ' '.repeat(indentSpaces);
        const innerIndent = ' '.repeat(indentSpaces + 4);
        const blocks: string[] = [];
        for (const utility of PATTERN_UTILITIES) {
            const lines: string[] = [`${baseIndent}/* ${utility.comment} */`];
            lines.push(`${baseIndent}@utility ${utility.name} {`);
            for (const declaration of utility.declarations) {
                lines.push(`${innerIndent}${declaration}`);
            }
            for (const nested of utility.nestedRules ?? []) {
                lines.push(`${innerIndent}${nested.selector} {`);
                for (const declaration of nested.declarations) {
                    lines.push(`${' '.repeat(indentSpaces + 8)}${declaration}`);
                }
                lines.push(`${innerIndent}}`);
            }
            lines.push(`${baseIndent}}`);
            blocks.push(lines.join('\n'));
        }
        return blocks.join('\n\n');
    }

    /**
     * CLI 消费方直挂规则块：
     * - 阴影档位遍历 SHADOW_DEFINITIONS 全量产出（含既有档位收敛纳管）；
     * - 纹理类从 PATTERN_UTILITIES 展开为扁平 CSS 规则（& 子选择器展开为完整选择器）。
     * CLI 无 Tailwind 编译管道，直挂实现是与 ui 组装并存的刻意双实现，一致性由本生成器与门禁兜底。
     */
    public compileCliUtilityRules(): string {
        const shadowRules: string[] = [
            '/* ===== brutal 阴影档位直挂（由 prebuild:tokens 从 SHADOW_DEFINITIONS 生成）===== */',
        ];
        for (const def of SHADOW_DEFINITIONS) {
            const className = `.${def.themeVar.replace(/^--/, '')}`;
            shadowRules.push(`${className} {`);
            shadowRules.push(`    box-shadow: var(${def.themeVar});`);
            shadowRules.push('}');
            shadowRules.push('');
        }

        const patternRules: string[] = [
            '/* ===== 纹理工具类直挂（由 prebuild:tokens 从 PATTERN_UTILITIES 生成）===== */',
        ];
        for (const utility of PATTERN_UTILITIES) {
            patternRules.push(`/* ${utility.comment} */`);
            patternRules.push(`.${utility.name} {`);
            for (const declaration of utility.declarations) {
                patternRules.push(`    ${declaration}`);
            }
            patternRules.push('}');
            for (const nested of utility.nestedRules ?? []) {
                patternRules.push(`.${utility.name}${nested.selector.replace(/^&/, '')} {`);
                for (const declaration of nested.declarations) {
                    patternRules.push(`    ${declaration}`);
                }
                patternRules.push('}');
            }
            patternRules.push('');
        }

        return [...shadowRules, ...patternRules].join('\n').trimEnd();
    }

    public patchBetweenMarkers(
        content: string,
        startMarker: string,
        endMarker: string,
        generated: string,
        sourceLabel?: string,
    ): string {
        const startIdx = content.indexOf(startMarker);
        const endIdx = content.indexOf(endMarker);
        if (startIdx === -1 || endIdx === -1) {
            const target = sourceLabel ? `在 ${sourceLabel} 中` : '';
            throw new Error(
                `无法${target}找到注入标记。请确认存在 "${startMarker}" 与 "${endMarker}"。`,
            );
        }
        const startLineStart = content.lastIndexOf('\n', startIdx) + 1;
        const indent = content.slice(startLineStart, startIdx);
        const before = content.slice(0, startIdx + startMarker.length);
        const after = content.slice(endIdx);
        return `${before}\n${generated}\n${indent}${after}`;
    }

    public patchStylesCss(content: string): PatchResult {
        let current = content;
        current = this.patchBetweenMarkers(current, THEME_START, THEME_END, this.compileThemeBlock(), 'styles.css');
        current = this.patchBetweenMarkers(current, ROOT_START, ROOT_END, this.compileRootBlock(4), 'styles.css');
        current = this.patchBetweenMarkers(current, PRESETS_START, PRESETS_END, this.compileThemePresetsBlock(4), 'styles.css');
        current = this.patchBetweenMarkers(
            current,
            PATTERN_UTILS_START,
            PATTERN_UTILS_END,
            this.compilePatternUtilityBlock(0),
            'styles.css',
        );
        return { content: current, changed: current !== content };
    }

    public patchPreflightCss(content: string): PatchResult {
        const patched = this.patchBetweenMarkers(content, FONT_STACK_START, FONT_STACK_END, this.compileFontStackBlock(), 'preflight.css');
        return { content: patched, changed: patched !== content };
    }

    public patchCliBrutalistCss(content: string): PatchResult {
        let current = content;
        current = this.patchBetweenMarkers(current, THEME_START, THEME_END, this.compileThemeBlock(), 'brutalist.css');
        current = this.patchBetweenMarkers(current, ROOT_START, ROOT_END, this.compileRootBlock(0), 'brutalist.css');
        current = this.patchBetweenMarkers(current, PRESETS_START, PRESETS_END, this.compileThemePresetsBlock(0), 'brutalist.css');
        current = this.patchBetweenMarkers(
            current,
            CLI_UTIL_RULES_START,
            CLI_UTIL_RULES_END,
            this.compileCliUtilityRules(),
            'brutalist.css',
        );
        return { content: current, changed: current !== content };
    }

    public compileColorNamesBlock(): string {
        const lines = BRUTAL_COLOR_NAMES.map(name => `    '${name}',`);
        return `const BRUTAL_COLOR_NAMES = [\n${lines.join('\n')}\n];`;
    }

    public compileZIndexNamesBlock(): string {
        const lines = BRUTAL_Z_INDEX_NAMES.map(name => `    '${name}',`);
        return `const BRUTAL_Z_INDEX_NAMES = [\n${lines.join('\n')}\n];`;
    }

    public compileCliUtilsTemplate(): string {
        const colorLines = BRUTAL_COLOR_NAMES.map(name => `    '${name}',`).join('\n');
        const zIndexLines = BRUTAL_Z_INDEX_NAMES.map(name => `    '${name}',`).join('\n');
        const utilsTemplateStr = [
            'import { type ClassValue, clsx } from "clsx";',
            'import { extendTailwindMerge } from "tailwind-merge";',
            '',
            'const BRUTAL_COLOR_NAMES = [',
            colorLines,
            '] as const;',
            '',
            'const BRUTAL_Z_INDEX_NAMES = [',
            zIndexLines,
            '] as const;',
            '',
            'const customTwMerge = extendTailwindMerge({',
            '    extend: {',
            '        theme: {',
            '            color: [...BRUTAL_COLOR_NAMES],',
            '        },',
            '        classGroups: {',
            '            z: [{ z: [...BRUTAL_Z_INDEX_NAMES] }],',
            '        },',
            '    },',
            '});',
            '',
            'export const FOCUS_RING_CLASSES =',
            '    "focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden";',
            '',
            'export function cn(...inputs: ClassValue[]) {',
            '    return customTwMerge(clsx(inputs));',
            '}',
            '',
        ].join('\n');

        const bodyTemplateStr = [
            'const BRUTAL_COLOR_NAMES = [',
            colorLines,
            '] as const;',
            '',
            'const BRUTAL_Z_INDEX_NAMES = [',
            zIndexLines,
            '] as const;',
            '',
            'const customTwMerge = extendTailwindMerge({',
            '    extend: {',
            '        theme: {',
            '            color: [...BRUTAL_COLOR_NAMES],',
            '        },',
            '        classGroups: {',
            '            z: [{ z: [...BRUTAL_Z_INDEX_NAMES] }],',
            '        },',
            '    },',
            '});',
            '',
            'export const FOCUS_RING_CLASSES =',
            '    "focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden";',
            '',
            'export function cn(...inputs: ClassValue[]) {',
            '    return customTwMerge(clsx(inputs));',
            '}',
            '',
        ].join('\n');

        return [
            `export const UTILS_TEMPLATE = \`${utilsTemplateStr}\`;`,
            '',
            '// 与 UTILS_TEMPLATE 逐字节一致，复用其定义保持单一数据源（须置于 UTILS_TEMPLATE 之后避免 TDZ）。',
            '// doctor 的 AddCnFunction 用它追加到全新的 utils 文件（自带 import，保证自包含）。',
            'export const CN_FUNCTION_TEMPLATE = UTILS_TEMPLATE;',
            '',
            '// 仅函数体（无 import）：doctor 追加到已导入 clsx/tailwind-merge 的文件时使用，',
            '// 避免同名 import 重复绑定导致 SyntaxError',
            `export const CN_FUNCTION_BODY_TEMPLATE = \`${bodyTemplateStr}\`;`,
        ].join('\n');
    }

    public patchUtilsTs(content: string): PatchResult {
        let current = content;
        current = this.patchBetweenMarkers(
            current,
            COLOR_NAMES_START,
            COLOR_NAMES_END,
            this.compileColorNamesBlock(),
            'utils.ts',
        );
        current = this.patchBetweenMarkers(
            current,
            Z_INDEX_NAMES_START,
            Z_INDEX_NAMES_END,
            this.compileZIndexNamesBlock(),
            'utils.ts',
        );
        return { content: current, changed: current !== content };
    }

    public patchCliConstants(content: string): PatchResult {
        const patched = this.patchBetweenMarkers(
            content,
            CLI_UTILS_START,
            CLI_UTILS_END,
            this.compileCliUtilsTemplate(),
            'constants.ts',
        );
        return { content: patched, changed: patched !== content };
    }
}
