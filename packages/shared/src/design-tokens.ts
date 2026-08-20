/**
 * Design tokens single source of truth.
 *
 * All brutalist design token values (border, shadow, radius, colors, etc.)
 * Consumers derive their format-specific output:
 * - `packages/registry/scripts/build-registry.ts` -> registry JSON `cssVars` field
 * - `packages/ui/src/styles.css` -> `@theme` (with fallbacks) + `:root` / `.dark` blocks (build-time injection via `packages/ui/scripts/generate-styles-tokens.ts`)
 * - CSS `var(--brutal-*, fallback)` fallbacks sourced from `BASE_THEME.light`
 *
 * Keep this file free of imports so it can be consumed by both the ui and
 * registry packages without creating cross-package dependencies.
 */

export type ThemeMode = 'light' | 'dark';

/**
 * 原始色板：black/yellow 作为品牌基础色，供本文件内的主题令牌引用（单一事实来源）。
 * 与语义令牌（border/fg/accent 等）重合处统一引用此处的常量，避免调整主题色时
 * 多处置放导致漂移。外部如需原始色值，通过 BASE_THEME 的语义令牌读取。
 */
const PALETTE_BLACK = '#000000';
const PALETTE_YELLOW = '#FFE66D';

export interface ThemeTokens {
    borderWidth: string;
    borderColor: string;
    shadowOffsetX: string;
    shadowOffsetY: string;
    shadowColor: string;
    radius: string;
    bg: string;
    fg: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    success: string;
    successForeground: string;
    muted: string;
    mutedForeground: string;
    ring: string;
    info: string;
    infoForeground: string;
    statusSuccess: string;
    statusSuccessForeground: string;
    statusWarning: string;
    statusWarningForeground: string;
    statusInfo: string;
    statusInfoForeground: string;
    statusError: string;
    statusErrorForeground: string;
    overlay: string;
    overlaySubtle: string;
    placeholder: string;
    black: string;
    yellow: string;
}

export const BASE_THEME: Readonly<Record<ThemeMode, Readonly<ThemeTokens>>> = Object.freeze({
    light: Object.freeze({
        borderWidth: '3px',
        borderColor: PALETTE_BLACK,
        shadowOffsetX: '4px',
        shadowOffsetY: '4px',
        shadowColor: PALETTE_BLACK,
        radius: '0px',
        bg: '#ffffff',
        fg: PALETTE_BLACK,
        primary: '#FF6B6B',
        primaryForeground: PALETTE_BLACK,
        secondary: '#4ECDC4',
        secondaryForeground: PALETTE_BLACK,
        accent: PALETTE_YELLOW,
        accentForeground: PALETTE_BLACK,
        destructive: '#EF476F',
        destructiveForeground: PALETTE_BLACK,
        success: '#7FB069',
        successForeground: PALETTE_BLACK,
        muted: '#f3f4f6',
        mutedForeground: '#4B5563',
        ring: PALETTE_BLACK,
        info: '#4A90D9',
        // 黑字对比度 6.28:1 满足 WCAG AA（4.5:1），与 primary/secondary 黑字风格一致
        infoForeground: PALETTE_BLACK,
        // 状态色为恒定辨识信号，亮暗一致（维持 Result 现状渲染）；success/info 黑字对比 8.6:1 / 5.8:1 过 AA
        statusSuccess: '#22c55e',
        statusSuccessForeground: PALETTE_BLACK,
        statusWarning: PALETTE_YELLOW,
        statusWarningForeground: PALETTE_BLACK,
        statusInfo: '#3b82f6',
        statusInfoForeground: PALETTE_BLACK,
        statusError: '#EF476F',
        statusErrorForeground: PALETTE_BLACK,
        overlay: 'rgba(0, 0, 0, 0.5)',
        // 5% 微妙叠色（拖拽指示等浅层覆盖，取代硬编码 bg-black/5，见审查报告 §3.4）
        overlaySubtle: 'rgba(0, 0, 0, 0.05)',
        placeholder: '#9CA3AF',
        black: PALETTE_BLACK,
        yellow: PALETTE_YELLOW,
    }),
    dark: Object.freeze({
        borderWidth: '3px',
        borderColor: '#ffffff',
        shadowOffsetX: '4px',
        shadowOffsetY: '4px',
        shadowColor: '#ffffff',
        radius: '0px',
        bg: '#141414',
        fg: '#ffffff',
        primary: '#FF6B6B',
        primaryForeground: PALETTE_BLACK,
        secondary: '#4ECDC4',
        secondaryForeground: PALETTE_BLACK,
        accent: PALETTE_YELLOW,
        accentForeground: PALETTE_BLACK,
        destructive: '#EF476F',
        destructiveForeground: PALETTE_BLACK,
        success: '#7FB069',
        successForeground: PALETTE_BLACK,
        muted: '#1e1e1e',
        mutedForeground: '#9CA3AF',
        ring: '#ffffff',
        info: '#3B82F6',
        // 黑字对比度 5.71:1 满足 WCAG AA（4.5:1）
        infoForeground: PALETTE_BLACK,
        // 状态色恒定，亮暗一致（见 light 注释）
        statusSuccess: '#22c55e',
        statusSuccessForeground: PALETTE_BLACK,
        statusWarning: PALETTE_YELLOW,
        statusWarningForeground: PALETTE_BLACK,
        statusInfo: '#3b82f6',
        statusInfoForeground: PALETTE_BLACK,
        statusError: '#EF476F',
        statusErrorForeground: PALETTE_BLACK,
        overlay: 'rgba(0, 0, 0, 0.7)',
        // 5% 微妙叠色（dark 下为白叠色，见 light 注释）
        overlaySubtle: 'rgba(255, 255, 255, 0.05)',
        placeholder: '#6B7280',
        black: PALETTE_BLACK,
        yellow: PALETTE_YELLOW,
    }),
});

export const TOKEN_TO_CSS_VAR: Record<keyof ThemeTokens, string> = {
    borderWidth: 'brutal-border-width',
    borderColor: 'brutal-border-color',
    shadowOffsetX: 'brutal-shadow-offset-x',
    shadowOffsetY: 'brutal-shadow-offset-y',
    shadowColor: 'brutal-shadow-color',
    radius: 'brutal-radius',
    bg: 'brutal-bg',
    fg: 'brutal-fg',
    primary: 'brutal-primary',
    primaryForeground: 'brutal-primary-foreground',
    secondary: 'brutal-secondary',
    secondaryForeground: 'brutal-secondary-foreground',
    accent: 'brutal-accent',
    accentForeground: 'brutal-accent-foreground',
    destructive: 'brutal-destructive',
    destructiveForeground: 'brutal-destructive-foreground',
    success: 'brutal-success',
    successForeground: 'brutal-success-foreground',
    muted: 'brutal-muted',
    mutedForeground: 'brutal-muted-foreground',
    ring: 'brutal-ring',
    info: 'brutal-info',
    infoForeground: 'brutal-info-foreground',
    statusSuccess: 'brutal-status-success',
    statusSuccessForeground: 'brutal-status-success-foreground',
    statusWarning: 'brutal-status-warning',
    statusWarningForeground: 'brutal-status-warning-foreground',
    statusInfo: 'brutal-status-info',
    statusInfoForeground: 'brutal-status-info-foreground',
    statusError: 'brutal-status-error',
    statusErrorForeground: 'brutal-status-error-foreground',
    overlay: 'brutal-overlay',
    overlaySubtle: 'brutal-overlay-subtle',
    placeholder: 'brutal-placeholder',
    black: 'brutal-black',
    yellow: 'brutal-yellow',
};

export interface ThemePresetOverrides {
    name: string;
    description?: string;
    light: Partial<ThemeTokens>;
    dark: Partial<ThemeTokens>;
}

export const THEME_PRESETS: Readonly<Record<string, Readonly<ThemePresetOverrides>>> = Object.freeze({
    pastel: Object.freeze({
        name: 'pastel',
        description: 'Pastel theme: 柔和粉彩配色与 8px 微圆角',
        light: Object.freeze({
            borderWidth: '2px',
            borderColor: '#1e1e24',
            shadowOffsetX: '3px',
            shadowOffsetY: '3px',
            shadowColor: '#1e1e24',
            radius: '8px',
            bg: '#faf9f6',
            fg: '#1e1e24',
            primary: '#d6c6e1',
            primaryForeground: '#1e1e24',
            secondary: '#c5ded9',
            secondaryForeground: '#1e1e24',
            accent: '#fbe3b5',
            accentForeground: '#1e1e24',
            destructive: '#f3b0b0',
            destructiveForeground: '#1e1e24',
            success: '#cce2cb',
            successForeground: '#1e1e24',
            muted: '#eae8e1',
            mutedForeground: '#5e5e6b',
            ring: '#1e1e24',
            info: '#a8c8e8',
            infoForeground: '#1e1e24',
            overlay: 'rgba(0, 0, 0, 0.4)',
            placeholder: '#b0aeb5',
        }),
        dark: Object.freeze({
            borderWidth: '2px',
            borderColor: '#5c5c72',
            shadowOffsetX: '3px',
            shadowOffsetY: '3px',
            shadowColor: '#5c5c72',
            radius: '8px',
            bg: '#16161e',
            fg: '#f0f0f5',
            primary: '#e8988a',
            primaryForeground: '#16161e',
            secondary: '#e0b8b0',
            secondaryForeground: '#16161e',
            accent: '#9ac4b6',
            accentForeground: '#16161e',
            destructive: '#db6e60',
            destructiveForeground: '#16161e',
            success: '#7cbfa0',
            successForeground: '#16161e',
            muted: '#20202c',
            mutedForeground: '#9898b0',
            ring: '#9ac4b6',
            info: '#88b8e6',
            infoForeground: '#16161e',
            overlay: 'rgba(0, 0, 0, 0.6)',
            placeholder: '#666677',
        }),
    }),
    mono: Object.freeze({
        name: 'mono',
        description: 'Mono theme: 纯粹黑白、4px 粗边框与 5px 大阴影',
        light: Object.freeze({
            borderWidth: '4px',
            borderColor: '#000000',
            shadowOffsetX: '5px',
            shadowOffsetY: '5px',
            shadowColor: '#000000',
            radius: '0px',
            bg: '#ffffff',
            fg: '#000000',
            primary: '#000000',
            primaryForeground: '#ffffff',
            secondary: '#ffffff',
            secondaryForeground: '#000000',
            accent: '#707070',
            accentForeground: '#ffffff',
            destructive: '#333333',
            destructiveForeground: '#ffffff',
            success: '#dddddd',
            successForeground: '#000000',
            muted: '#f0f0f0',
            mutedForeground: '#555555',
            ring: '#000000',
            info: '#666666',
            infoForeground: '#ffffff',
            overlay: 'rgba(0, 0, 0, 0.5)',
            placeholder: '#888888',
        }),
        dark: Object.freeze({
            borderWidth: '4px',
            borderColor: '#ffffff',
            shadowOffsetX: '5px',
            shadowOffsetY: '5px',
            shadowColor: '#ffffff',
            radius: '0px',
            bg: '#000000',
            fg: '#ffffff',
            primary: '#ffffff',
            primaryForeground: '#000000',
            secondary: '#000000',
            secondaryForeground: '#ffffff',
            accent: '#888888',
            accentForeground: '#000000',
            destructive: '#cccccc',
            destructiveForeground: '#000000',
            success: '#222222',
            successForeground: '#ffffff',
            muted: '#1a1a1a',
            mutedForeground: '#aaaaaa',
            ring: '#ffffff',
            info: '#999999',
            infoForeground: '#000000',
            overlay: 'rgba(0, 0, 0, 0.7)',
            placeholder: '#777777',
        }),
    }),
    warm: Object.freeze({
        name: 'warm',
        description: 'Warm Brutalism theme: raw/原始感与温暖的视觉体验',
        light: Object.freeze({
            borderWidth: '3px',
            borderColor: '#5c3d2e',
            shadowOffsetX: '4px',
            shadowOffsetY: '4px',
            shadowColor: '#5c3d2e',
            radius: '4px',
            bg: '#fff8f0',
            fg: '#2d1810',
            primary: '#e8722a',
            primaryForeground: '#2d1810',
            secondary: '#856a44',
            secondaryForeground: '#fff8f0',
            accent: '#f2c078',
            accentForeground: '#2d1810',
            destructive: '#c0392b',
            destructiveForeground: '#fff8f0',
            success: '#82943e',
            successForeground: '#2d1810',
            muted: '#f5ede3',
            mutedForeground: '#6b5b4f',
            ring: '#e8722a',
            info: '#d4956a',
            infoForeground: '#2d1810',
            overlay: 'rgba(45, 24, 16, 0.5)',
            placeholder: '#b8a898',
        }),
        dark: Object.freeze({
            borderWidth: '3px',
            borderColor: '#c4a882',
            shadowOffsetX: '4px',
            shadowOffsetY: '4px',
            shadowColor: '#c4a882',
            radius: '4px',
            bg: '#1a1410',
            fg: '#f5e6d3',
            primary: '#f59e4c',
            primaryForeground: '#1a1410',
            secondary: '#b8956a',
            secondaryForeground: '#1a1410',
            accent: '#ffd89b',
            accentForeground: '#1a1410',
            destructive: '#e74c3c',
            destructiveForeground: '#1a1410',
            success: '#a3b556',
            successForeground: '#1a1410',
            muted: '#2a2018',
            mutedForeground: '#b8a898',
            ring: '#f59e4c',
            info: '#e0a97e',
            infoForeground: '#1a1410',
            overlay: 'rgba(0, 0, 0, 0.7)',
            placeholder: '#8c7a6b',
        }),
    }),
});

export function toCssVars(tokens: ThemeTokens): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key of Object.keys(TOKEN_TO_CSS_VAR) as Array<keyof ThemeTokens>) {
        const value = tokens[key];
        if (value === undefined || value === null) {
            // 缺值/null 会静默产出 "--brutal-*: undefined/null" 的脏样式，显式抛错暴露调用方数据问题
            throw new Error(`Missing design token value for key: ${key}`);
        }
        result[TOKEN_TO_CSS_VAR[key]] = value;
    }
    return result;
}

export const CSS_VARS: Record<ThemeMode, Record<string, string>> = {
    light: toCssVars(BASE_THEME.light),
    dark: toCssVars(BASE_THEME.dark),
};

/**
 * 全局默认字体栈（单一事实来源）：数组为唯一真相，字符串由数组派生。
 * 下游由生成脚本生成、禁止手改：styles.css @theme 的 `--default-font-family`
 * 与 preflight.css body 的 `var(--default-font-family, <FONT_STACK>)` 兜底。
 */
export const FONT_STACK_PARTS = [
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

export const FONT_STACK = FONT_STACK_PARTS.join(', ');

/** 机械弹性动效缓动曲线令牌 */
export const EASING_TOKENS = {
    snap: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export interface SubtleColorDef {
    key: keyof ThemeTokens;
    lightPct: number;
    darkPct: number;
}

/**
 * 浅色衍生背景令牌配置表：
 * 语义色按比例与背景底色 var(--brutal-bg) 融合，自动联动各主题预设的实际底色。
 * 注：accent(黄色系) 在浅色模式下混合比例提升至 20%（其余为 12%），以确保浅底上有足够的视觉对比度；暗色统一 20%。
 */
export const SUBTLE_COLOR_DEFS: readonly SubtleColorDef[] = [
    { key: 'primary', lightPct: 12, darkPct: 20 },
    { key: 'secondary', lightPct: 12, darkPct: 20 },
    { key: 'accent', lightPct: 20, darkPct: 20 },
    { key: 'destructive', lightPct: 12, darkPct: 20 },
    { key: 'success', lightPct: 12, darkPct: 20 },
    { key: 'info', lightPct: 12, darkPct: 20 },
] as const;

export interface ShadowTokenDefinition {
    themeVar: string;
    build: (tokens: ThemeTokens) => string;
}

/**
 * 阴影派生令牌定义：
 * 经 @theme 派生标准 5 层 --tw-shadow 组装工具类；同时在 :root 运行时发射派生变量。
 */
export const SHADOW_DEFINITIONS: readonly ShadowTokenDefinition[] = [
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
    {
        themeVar: '--shadow-brutal-destructive',
        build: l => `var(--brutal-shadow-offset-x, ${l.shadowOffsetX}) var(--brutal-shadow-offset-y, ${l.shadowOffsetY}) 0px 0px color-mix(in srgb, var(--brutal-destructive, ${l.destructive}) 30%, transparent)`,
    },
] as const;

/**
 * 非颜色令牌集合（排查阴影、边框宽度、圆角等非颜色键）。
 */
export const NON_COLOR_TOKEN_KEYS: ReadonlySet<keyof ThemeTokens> = new Set<keyof ThemeTokens>([
    'borderWidth',
    'borderColor',
    'shadowOffsetX',
    'shadowOffsetY',
    'shadowColor',
    'radius',
]);

const baseBrutalColors: string[] = (Object.keys(TOKEN_TO_CSS_VAR) as Array<keyof ThemeTokens>)
    .filter(key => !NON_COLOR_TOKEN_KEYS.has(key))
    .map(key => TOKEN_TO_CSS_VAR[key]);

const subtleBrutalColors: string[] = SUBTLE_COLOR_DEFS.map(d => `brutal-${d.key}-subtle`);

/**
 * 全量粗野主义颜色类名清单（单一事实来源）：
 * 由基础颜色（30个）与 subtle 衍生色（6个）纯函数式计算、排序并冻结导出。
 * 供 TokenStyleCompiler 编译静态代码并注入至 UI utils 与 CLI 模板。
 */
export const BRUTAL_COLOR_NAMES: readonly string[] = Object.freeze(
    [...baseBrutalColors, ...subtleBrutalColors].sort(),
);

/**
 * 全局 Z-Index 层级尺度令牌（单一事实来源）。
 * 覆盖 5 级层级与复合浮层子层级。
 */
export const Z_INDEX_TOKENS = Object.freeze({
    // Layer 1: Inline / Sticky
    sticky: 10,
    header: 40,
    // Layer 2: Popper / Dropdown
    popover: 100,
    dropdown: 100,
    tooltip: 200,
    // Layer 3: Overlay / Dialog
    dialog: 1000,
    // Layer 4: System / Guide / Preview
    tourCanvas: 9000,
    tourPopover: 9001,
    previewOverlay: 9100,
    previewControl: 9101,
    loading: 9200,
    // Layer 5: Top Notification
    toast: 10010,
    message: 10010,
} as const);

export type ZIndexTokenKey = keyof typeof Z_INDEX_TOKENS;

/**
 * 语义 Z-Index 类名对应映射（kebab-case 对应 Tailwind v4 --z-index-* 工具类与 twMerge 注册）
 */
export const Z_INDEX_CLASS_ENTRIES: ReadonlyArray<{ name: string; value: number }> = Object.freeze([
    { name: 'sticky', value: Z_INDEX_TOKENS.sticky },
    { name: 'header', value: Z_INDEX_TOKENS.header },
    { name: 'popover', value: Z_INDEX_TOKENS.popover },
    { name: 'dropdown', value: Z_INDEX_TOKENS.dropdown },
    { name: 'tooltip', value: Z_INDEX_TOKENS.tooltip },
    { name: 'dialog', value: Z_INDEX_TOKENS.dialog },
    { name: 'tour-canvas', value: Z_INDEX_TOKENS.tourCanvas },
    { name: 'tour-popover', value: Z_INDEX_TOKENS.tourPopover },
    { name: 'preview-overlay', value: Z_INDEX_TOKENS.previewOverlay },
    { name: 'preview-control', value: Z_INDEX_TOKENS.previewControl },
    { name: 'loading', value: Z_INDEX_TOKENS.loading },
    { name: 'toast', value: Z_INDEX_TOKENS.toast },
    { name: 'message', value: Z_INDEX_TOKENS.message },
]);

export const BRUTAL_Z_INDEX_NAMES: readonly string[] = Object.freeze(
    Array.from(new Set(Z_INDEX_CLASS_ENTRIES.map(e => e.name))).sort(),
);
