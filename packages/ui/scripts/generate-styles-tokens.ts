/**
 * 从 packages/shared/src/design-tokens.ts 生成样式文件的四处注入块：
 *
 * 1. styles.css @theme 块内的变量声明（含 fallback，取自 BASE_THEME.light）
 *    标记：/* @brutx:theme-tokens:start *\/ ... /* @brutx:theme-tokens:end *\/
 *
 * 2. styles.css @layer base 内的 :root / .dark 块（无 fallback，纯运行时值）
 *    标记：/* @brutx:root-tokens:start *\/ ... /* @brutx:root-tokens:end *\/
 *
 * 3. styles.css @layer base 内的 .theme-pastel / .theme-mono / .theme-warm 预设块
 *    标记：/* @brutx:theme-presets:start *\/ ... /* @brutx:theme-presets:end *\/
 *
 * 4. preflight.css body 的 font-family 兜底（源自 FONT_STACK 常量，见下方定义）
 *    标记：/* @brutx:font-stack:start *\/ ... /* @brutx:font-stack:end *\/
 *
 * 模式：
 *   - 默认：写回 styles.css 与 preflight.css（prebuild）
 *   - --check：仅比对磁盘与生成结果，不一致则退出非零并打印差异摘要（CI 门禁）
 *
 * 运行：pnpm --filter brutx-ui-vue prebuild:tokens
 * 消除 styles.css / preflight.css 与 design-tokens.ts / FONT_STACK 之间的硬编码漂移风险。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    CSS_VARS,
    BASE_THEME,
    THEME_PRESETS,
    TOKEN_TO_CSS_VAR,
    type ThemeTokens,
} from 'brutx-shared-vue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STYLES_PATH = path.resolve(__dirname, '..', 'src', 'styles.css');
const PREFLIGHT_PATH = path.resolve(__dirname, '..', 'src', 'preflight.css');

const ROOT_START = '/* @brutx:root-tokens:start */';
const ROOT_END = '/* @brutx:root-tokens:end */';
const THEME_START = '/* @brutx:theme-tokens:start */';
const THEME_END = '/* @brutx:theme-tokens:end */';
const PRESETS_START = '/* @brutx:theme-presets:start */';
const PRESETS_END = '/* @brutx:theme-presets:end */';
const FONT_STACK_START = '/* @brutx:font-stack:start */';
const FONT_STACK_END = '/* @brutx:font-stack:end */';

/**
 * 全局默认字体栈（单一事实来源）：数组为唯一真相，字符串由数组派生。
 * 下游两处均由本脚本生成、禁止手改：styles.css @theme 的 `--default-font-family`
 * 与 preflight.css body 的 `var(--default-font-family, <FONT_STACK>)` 兜底。
 */
const FONT_STACK_PARTS = [
    '"Inter"',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans"',
    'sans-serif',
] as const;

const FONT_STACK = FONT_STACK_PARTS.join(', ');

interface ThemeEntry {
    themeVar: string;
    build: (l: ThemeTokens) => string;
}

interface ThemeGroup {
    comment: string;
    entries: ThemeEntry[];
}

// 阴影派生令牌：经 @theme 派生标准 5 层 --tw-shadow 组装工具类；同时在 :root 运行时发射派生变量（双发射），
// 供消费方自定义 CSS 引用及门禁提取。只发 :root 不发 .dark——引用运行时 --brutal-*，亮/暗同一份，
// fallback 取自 BASE_THEME.light。
const SHADOW_ENTRIES: ThemeEntry[] = [
    {
        themeVar: '--shadow-brutal',
        build: l => `var(--brutal-shadow-offset-x, ${l.shadowOffsetX}) var(--brutal-shadow-offset-y, ${l.shadowOffsetY}) 0px 0px var(--brutal-shadow-color, ${l.shadowColor})`,
    },
    {
        themeVar: '--shadow-brutal-sm',
        build: l => `calc(var(--brutal-shadow-offset-x, ${l.shadowOffsetX}) / 2) calc(var(--brutal-shadow-offset-y, ${l.shadowOffsetY}) / 2) 0px 0px var(--brutal-shadow-color, ${l.shadowColor})`,
    },
    {
        themeVar: '--shadow-brutal-lg',
        build: l => `calc(var(--brutal-shadow-offset-x, ${l.shadowOffsetX}) * 1.5) calc(var(--brutal-shadow-offset-y, ${l.shadowOffsetY}) * 1.5) 0px 0px var(--brutal-shadow-color, ${l.shadowColor})`,
    },
    {
        themeVar: '--shadow-brutal-xl',
        build: l => `calc(var(--brutal-shadow-offset-x, ${l.shadowOffsetX}) * 2) calc(var(--brutal-shadow-offset-y, ${l.shadowOffsetY}) * 2) 0px 0px var(--brutal-shadow-color, ${l.shadowColor})`,
    },
    {
        themeVar: '--shadow-brutal-primary',
        build: l => `var(--brutal-shadow-offset-x, ${l.shadowOffsetX}) var(--brutal-shadow-offset-y, ${l.shadowOffsetY}) 0px 0px var(--brutal-primary, ${l.primary})`,
    },
    {
        themeVar: '--shadow-brutal-secondary',
        build: l => `var(--brutal-shadow-offset-x, ${l.shadowOffsetX}) var(--brutal-shadow-offset-y, ${l.shadowOffsetY}) 0px 0px var(--brutal-secondary, ${l.secondary})`,
    },
    // 危险态半透明红阴影：30% 透明 color-mix 派生
    {
        themeVar: '--shadow-brutal-destructive',
        build: l => `var(--brutal-shadow-offset-x, ${l.shadowOffsetX}) var(--brutal-shadow-offset-y, ${l.shadowOffsetY}) 0px 0px color-mix(in srgb, var(--brutal-destructive, ${l.destructive}) 30%, transparent)`,
    },
];

interface SubtleEntry {
    varName: string;
    buildLight: (l: ThemeTokens) => string;
    buildDark: (d: ThemeTokens) => string;
}

interface SubtleColorDef {
    key: keyof ThemeTokens;
    lightPct: number;
    darkPct: number;
}

// 浅色衍生背景令牌配置表：
// 语义色按比例与背景底色 var(--brutal-bg) 融合，自动联动各主题预设（如 .theme-warm/.theme-mono）的实际底色。
// 注：accent(黄色系) 在浅色模式下混合比例提升至 20%（其余为 12%），以确保浅底上有足够的视觉对比度；暗色统一 20%。
const SUBTLE_COLOR_DEFS: SubtleColorDef[] = [
    { key: 'primary', lightPct: 12, darkPct: 20 },
    { key: 'secondary', lightPct: 12, darkPct: 20 },
    { key: 'accent', lightPct: 20, darkPct: 20 },
    { key: 'destructive', lightPct: 12, darkPct: 20 },
    { key: 'success', lightPct: 12, darkPct: 20 },
    { key: 'info', lightPct: 12, darkPct: 20 },
];

const SUBTLE_ENTRIES: SubtleEntry[] = SUBTLE_COLOR_DEFS.map(({ key, lightPct, darkPct }) => ({
    varName: `brutal-${key}-subtle`,
    buildLight: l => `color-mix(in srgb, var(--brutal-${key}, ${l[key]}) ${lightPct}%, var(--brutal-bg, #ffffff))`,
    buildDark: d => `color-mix(in srgb, var(--brutal-${key}, ${d[key]}) ${darkPct}%, var(--brutal-bg, #141414))`,
}));

// 机械弹性动效缓动曲线令牌
const EASING_ENTRIES: ThemeEntry[] = [
    {
        themeVar: '--ease-brutal-snap',
        build: () => 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    {
        themeVar: '--ease-brutal-bounce',
        build: () => 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
];

const NON_COLOR_TOKEN_KEYS = new Set<keyof ThemeTokens>([
    'borderWidth',
    'borderColor',
    'shadowOffsetX',
    'shadowOffsetY',
    'shadowColor',
    'radius',
]);

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
            build: l => `var(--${e.varName}, ${e.buildLight(l)})`,
        })),
    },
    {
        comment: 'Dynamic: border/radius use --brutal-* for theme support',
        entries: [
            { themeVar: '--border-width-3', build: l => `var(--brutal-border-width, ${l.borderWidth})` },
            { themeVar: '--radius-brutal', build: l => `var(--brutal-radius, ${l.radius})` },
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
];

function formatVarsBlock(selector: string, vars: Record<string, string>): string {
    const lines = Object.entries(vars).map(
        ([key, value]) => `        --${key}: ${value};`,
    );
    return `    ${selector} {\n${lines.join('\n')}\n    }`;
}

function generateRootBlock(): string {
    const lightVars: Record<string, string> = { ...CSS_VARS.light };
    for (const entry of SHADOW_ENTRIES) {
        lightVars[entry.themeVar.slice(2)] = entry.build(BASE_THEME.light);
    }
    for (const entry of SUBTLE_ENTRIES) {
        lightVars[entry.varName] = entry.buildLight(BASE_THEME.light);
    }

    const darkVars: Record<string, string> = { ...CSS_VARS.dark };
    for (const entry of SUBTLE_ENTRIES) {
        darkVars[entry.varName] = entry.buildDark(BASE_THEME.dark);
    }

    const lightBlock = formatVarsBlock(':root', lightVars);
    const darkBlock = formatVarsBlock('.dark', darkVars);
    return `${lightBlock}\n\n${darkBlock}`;
}

function generateThemeBlock(): string {
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

function collectPresetVars(overrides: Partial<ThemeTokens>, presetName: string): Record<string, string> {
    const vars: Record<string, string> = {};
    for (const [tokenKey, value] of Object.entries(overrides)) {
        if (value === undefined) continue;
        const varName = TOKEN_TO_CSS_VAR[tokenKey as keyof ThemeTokens];
        if (!varName) {
            console.warn(`[generate-styles-tokens] 预设 "${presetName}" 的 token "${tokenKey}" 缺少 CSS 变量映射，已跳过`);
            continue;
        }
        vars[varName] = value;
    }
    return vars;
}

/** 生成主题预设规则块（.theme-pastel / .theme-mono / .theme-warm 的 light 与 dark） */
function generateThemePresetsBlock(): string {
    const blocks: string[] = [];
    for (const preset of Object.values(THEME_PRESETS)) {
        if (preset.description) {
            blocks.push(`    /* ${preset.description} */`);
        }
        const selector = `.theme-${preset.name}`;
        const darkSelector = `.dark .theme-${preset.name}, .theme-${preset.name}.dark`;

        const lightVars = collectPresetVars(preset.light, preset.name);
        blocks.push(formatVarsBlock(selector, lightVars));

        const darkVars = collectPresetVars(preset.dark, preset.name);
        blocks.push(formatVarsBlock(darkSelector, darkVars));
    }
    return blocks.join('\n\n');
}

/** 生成 preflight.css body 的 font-family 声明（含 --default-font-family 兜底），缩进与 body 规则体一致。 */
function generateFontStackBlock(): string {
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

/** 打印某注入区间「磁盘现状 vs 生成期望」的差异摘要（供 --check 模式使用）。 */
function printBlockDiff(
    content: string,
    startMarker: string,
    endMarker: string,
    generated: string,
    label: string,
): void {
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1) return;
    const oldBlock = content.slice(startIdx + startMarker.length, endIdx);
    console.error(`--- 现有（磁盘）${label}`);
    console.error(oldBlock);
    console.error(`+++ 期望（生成）${label}`);
    console.error(`\n${generated}`);
}

function injectBetweenMarkers(
    content: string,
    startMarker: string,
    endMarker: string,
    generated: string,
    filePath: string,
): string {
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1) {
        throw new Error(
            `无法在 ${filePath} 中找到注入标记。请确认存在 "${startMarker}" 与 "${endMarker}"。`,
        );
    }
    const startLineStart = content.lastIndexOf('\n', startIdx) + 1;
    const indent = content.slice(startLineStart, startIdx);
    const before = content.slice(0, startIdx + startMarker.length);
    const after = content.slice(endIdx);
    return `${before}\n${generated}\n${indent}${after}`;
}

function main(): void {
    const isCheckMode = process.argv.slice(2).includes('--check');

    // --- styles.css 令牌块与预设块 ---
    const stylesOriginal = fs.readFileSync(STYLES_PATH, 'utf-8');
    let stylesContent = stylesOriginal;

    const themeBlock = generateThemeBlock();
    const themeNext = injectBetweenMarkers(stylesContent, THEME_START, THEME_END, themeBlock, STYLES_PATH);
    const themeChanged = themeNext !== stylesContent;
    if (themeChanged) {
        stylesContent = themeNext;
    }

    const rootBlock = generateRootBlock();
    const rootNext = injectBetweenMarkers(stylesContent, ROOT_START, ROOT_END, rootBlock, STYLES_PATH);
    const rootChanged = rootNext !== stylesContent;
    if (rootChanged) {
        stylesContent = rootNext;
    }

    const presetsBlock = generateThemePresetsBlock();
    const presetsNext = injectBetweenMarkers(stylesContent, PRESETS_START, PRESETS_END, presetsBlock, STYLES_PATH);
    const presetsChanged = presetsNext !== stylesContent;
    if (presetsChanged) {
        stylesContent = presetsNext;
    }

    const stylesChanged = themeChanged || rootChanged || presetsChanged;

    // --- preflight.css 字体栈 ---
    const preflightOriginal = fs.readFileSync(PREFLIGHT_PATH, 'utf-8');
    const fontStackBlock = generateFontStackBlock();
    const preflightNext = injectBetweenMarkers(
        preflightOriginal,
        FONT_STACK_START,
        FONT_STACK_END,
        fontStackBlock,
        PREFLIGHT_PATH,
    );
    const preflightChanged = preflightNext !== preflightOriginal;
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v') || process.env.BRUTX_VERBOSE === '1';

    if (!stylesChanged && !preflightChanged) {
        if (isVerbose || isCheckMode) {
            console.log('✓ styles.css 令牌块与 preflight.css 字体栈已是最新');
        }
        return;
    }

    if (isCheckMode) {
        console.error('✗ 生成内容与磁盘不一致，需运行 `pnpm prebuild:tokens` 重新生成。');
        if (themeChanged) {
            printBlockDiff(stylesOriginal, THEME_START, THEME_END, themeBlock, 'styles.css @theme 令牌块');
        }
        if (rootChanged) {
            printBlockDiff(stylesOriginal, ROOT_START, ROOT_END, rootBlock, 'styles.css :root/.dark 区块');
        }
        if (presetsChanged) {
            printBlockDiff(stylesOriginal, PRESETS_START, PRESETS_END, presetsBlock, 'styles.css 主题预设区块');
        }
        if (preflightChanged) {
            printBlockDiff(preflightOriginal, FONT_STACK_START, FONT_STACK_END, fontStackBlock, 'preflight.css 字体栈');
        }
        process.exit(1);
    }

    if (stylesChanged) {
        fs.writeFileSync(STYLES_PATH, stylesContent, 'utf-8');
    }
    if (preflightChanged) {
        fs.writeFileSync(PREFLIGHT_PATH, preflightNext, 'utf-8');
    }
    console.log('✓ styles.css 令牌块与 preflight.css 字体栈已从 design-tokens.ts / FONT_STACK 重新生成');
}

main();
