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
} from '../design-tokens.js';
import { PATTERN_UTILITIES } from './pattern-tokens.js';

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

const DEFAULT_INDENT_SPACES: number = 4;
const CSS_VAR_PREFIX_PATTERN: RegExp = /^--/;

const SHADOW_ENTRIES: ThemeEntry[] = SHADOW_DEFINITIONS.map(def => ({
    themeVar: def.themeVar,
    build: def.build,
}));

const CLI_SHADOW_STATE_SELECTORS: Record<string, readonly string[]> = {
    '--shadow-brutal': [String.raw`.hover\:shadow-brutal:hover`, String.raw`.focus\:shadow-brutal:focus`],
    '--shadow-brutal-sm': [String.raw`.hover\:shadow-brutal-sm:hover`, String.raw`.data-\[state\=active\]\:shadow-brutal-sm[data-state="active"]`],
    '--shadow-brutal-lg': [String.raw`.hover\:shadow-brutal-lg:hover`, String.raw`.focus\:shadow-brutal-lg:focus`],
    '--shadow-brutal-primary': [String.raw`.focus\:shadow-brutal-primary:focus`],
    '--shadow-brutal-secondary': [String.raw`.focus\:shadow-brutal-secondary:focus`],
};

const SUBTLE_ENTRIES: SubtleEntry[] = SUBTLE_COLOR_DEFS.map(({ key, lightPct, darkPct }) => ({
    varName: `brutal-${key}-subtle`,
    buildLight: (l: ThemeTokens): string =>
        `color-mix(in srgb, var(--brutal-${key}, ${l[key]}) ${lightPct}%, var(--brutal-bg, ${l.bg}))`,
    buildDark: (d: ThemeTokens): string =>
        `color-mix(in srgb, var(--brutal-${key}, ${d[key]}) ${darkPct}%, var(--brutal-bg, ${d.bg}))`,
}));

const EASING_ENTRIES: ThemeEntry[] = Object.entries(EASING_TOKENS).map(([key, val]) => ({
    themeVar: `--ease-brutal-${key}`,
    build: (): string => val,
}));

const Z_INDEX_ENTRIES: ThemeEntry[] = Z_INDEX_CLASS_ENTRIES.map(def => ({
    themeVar: `--z-index-${def.name}`,
    build: (): string => String(def.value),
}));

const DYNAMIC_COLOR_ENTRIES: ThemeEntry[] = (
    Object.keys(TOKEN_TO_CSS_VAR) as Array<keyof ThemeTokens>
)
    .filter(key => !NON_COLOR_TOKEN_KEYS.has(key))
    .map(key => {
        const cssVarName: string = TOKEN_TO_CSS_VAR[key];
        return {
            themeVar: `--color-${cssVarName}`,
            build: (l: ThemeTokens): string => `var(--${cssVarName}, ${l[key]})`,
        };
    });

const INLINE_THEME_GROUPS: ThemeGroup[] = [
    {
        comment:
            'Dynamic color tokens derived from design-tokens.ts:\n       Resolve at runtime via --brutal-* for dark mode and theme presets support.\n       Fallbacks sourced from BASE_THEME.light.',
        entries: DYNAMIC_COLOR_ENTRIES,
    },
    {
        comment: 'Dynamic: subtle backgrounds derived via color-mix',
        entries: SUBTLE_ENTRIES.map(e => ({
            themeVar: `--color-${e.varName}`,
            build: (l: ThemeTokens): string => `var(--${e.varName}, ${e.buildLight(l)})`,
        })),
    },
    {
        comment: 'Dynamic: border/radius resolve in the consuming element scope',
        entries: [
            {
                themeVar: '--border-width-3',
                build: (l: ThemeTokens): string => `var(--brutal-border-width, ${l.borderWidth})`,
            },
            {
                themeVar: '--radius-brutal',
                build: (l: ThemeTokens): string => `var(--brutal-radius, ${l.radius})`,
            },
        ],
    },
];

const THEME_GROUPS: ThemeGroup[] = [
    {
        comment: 'Default font family (preflight html/body 继承，可被消费方 @theme 覆盖)',
        entries: [
            {
                themeVar: '--default-font-family',
                build: (): string => FONT_STACK,
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

export class TokenStyleCompiler {
    public formatVarsBlock(
        selector: string,
        vars: Record<string, string>,
        indentSpaces: number = DEFAULT_INDENT_SPACES,
    ): string {
        const baseIndent: string = ' '.repeat(indentSpaces);
        const varIndent: string = ' '.repeat(indentSpaces + DEFAULT_INDENT_SPACES);
        const lines: string[] = Object.entries(vars).map(
            ([key, value]: [string, string]): string => `${varIndent}--${key}: ${value};`,
        );
        return `${baseIndent}${selector} {\n${lines.join('\n')}\n${baseIndent}}`;
    }

    public compileRootBlock(indentSpaces: number = DEFAULT_INDENT_SPACES): string {
        const lightVars: Record<string, string> = { ...CSS_VARS.light };
        for (const entry of SHADOW_ENTRIES) {
            const varKey: string = entry.themeVar.replace(CSS_VAR_PREFIX_PATTERN, '');
            lightVars[varKey] = entry.build(BASE_THEME.light);
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

        const lightBlock: string = this.formatVarsBlock(':root', lightVars, indentSpaces);
        const darkBlock: string = this.formatVarsBlock('.dark', darkVars, indentSpaces);
        return `${lightBlock}\n\n${darkBlock}`;
    }

    public compileThemeBlock(): string {
        const light: ThemeTokens = BASE_THEME.light;
        const compileGroups = (directive: string, groups: ThemeGroup[]): string => {
            const lines: string[] = [`${directive} {`];
            for (let gi: number = 0; gi < groups.length; gi++) {
                const group: ThemeGroup = groups[gi];
                lines.push(`    /* ${group.comment} */`);
                for (const entry of group.entries) {
                    lines.push(`    ${entry.themeVar}: ${entry.build(light)};`);
                }
                if (gi < groups.length - 1) {
                    lines.push('');
                }
            }
            lines.push('}');
            return lines.join('\n');
        };

        return [
            compileGroups('@theme inline', INLINE_THEME_GROUPS),
            compileGroups('@theme', THEME_GROUPS),
        ].join('\n\n');
    }

    public collectPresetVars(
        overrides: Partial<ThemeTokens>,
        presetName: string,
    ): Record<string, string> {
        const vars: Record<string, string> = {};
        for (const [tokenKey, value] of Object.entries(overrides)) {
            if (value === undefined) continue;
            const varName: string | undefined = TOKEN_TO_CSS_VAR[tokenKey as keyof ThemeTokens];
            if (!varName) {
                console.warn(
                    `[TokenStyleCompiler] 预设 "${presetName}" 的 token "${tokenKey}" 缺少 CSS 变量映射，已跳过`,
                );
                continue;
            }
            vars[varName] = value;
        }
        return vars;
    }

    public compileThemePresetsBlock(indentSpaces: number = DEFAULT_INDENT_SPACES): string {
        const blocks: string[] = [];
        const baseIndent: string = ' '.repeat(indentSpaces);
        for (const preset of Object.values(THEME_PRESETS)) {
            if (preset.description) {
                blocks.push(`${baseIndent}/* ${preset.description} */`);
            }
            const selector: string = `.theme-${preset.name}`;
            const darkSelector: string = `.dark .theme-${preset.name}, .theme-${preset.name}.dark`;

            const lightVars: Record<string, string> = this.collectPresetVars(preset.light, preset.name);
            for (const entry of SUBTLE_ENTRIES) {
                lightVars[entry.varName] = entry.buildLight(BASE_THEME.light);
            }
            blocks.push(this.formatVarsBlock(selector, lightVars, indentSpaces));

            const darkVars: Record<string, string> = this.collectPresetVars(preset.dark, preset.name);
            for (const entry of SUBTLE_ENTRIES) {
                darkVars[entry.varName] = entry.buildDark(BASE_THEME.dark);
            }
            blocks.push(this.formatVarsBlock(darkSelector, darkVars, indentSpaces));
        }
        return blocks.join('\n\n');
    }

    public compileFontStackBlock(): string {
        const lines: string[] = [
            '        font-family: var(',
            '            --default-font-family,',
        ];
        for (let i: number = 0; i < FONT_STACK_PARTS.length; i++) {
            const comma: string = i < FONT_STACK_PARTS.length - 1 ? ',' : '';
            lines.push(`            ${FONT_STACK_PARTS[i]}${comma}`);
        }
        lines.push('        );');
        return lines.join('\n');
    }

    public compilePatternUtilityBlock(indentSpaces: number = 0): string {
        const baseIndent: string = ' '.repeat(indentSpaces);
        const innerIndent: string = ' '.repeat(indentSpaces + DEFAULT_INDENT_SPACES);
        const nestedIndent: string = ' '.repeat(indentSpaces + DEFAULT_INDENT_SPACES * 2);
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
                    lines.push(`${nestedIndent}${declaration}`);
                }
                lines.push(`${innerIndent}}`);
            }
            lines.push(`${baseIndent}}`);
            blocks.push(lines.join('\n'));
        }
        return blocks.join('\n\n');
    }

    public compileCliUtilityRules(): string {
        const shadowRules: string[] = [
            '/* ===== brutal 阴影档位直挂（由 prebuild:tokens 从 SHADOW_DEFINITIONS 生成）===== */',
        ];
        for (const def of SHADOW_DEFINITIONS) {
            const className: string = `.${def.themeVar.replace(CSS_VAR_PREFIX_PATTERN, '')}`;
            for (const selector of [className, ...(CLI_SHADOW_STATE_SELECTORS[def.themeVar] ?? [])]) {
                shadowRules.push(`${selector} {`);
                shadowRules.push(`    box-shadow: ${def.build(BASE_THEME.light)};`);
                shadowRules.push('}');
                shadowRules.push('');
            }
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

    public compileColorNamesBlock(): string {
        const lines: string[] = BRUTAL_COLOR_NAMES.map((name: string): string => `    '${name}',`);
        return `const BRUTAL_COLOR_NAMES = [\n${lines.join('\n')}\n];`;
    }

    public compileZIndexNamesBlock(): string {
        const lines: string[] = BRUTAL_Z_INDEX_NAMES.map((name: string): string => `    '${name}',`);
        return `const BRUTAL_Z_INDEX_NAMES = [\n${lines.join('\n')}\n];`;
    }
}
