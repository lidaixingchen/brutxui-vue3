/**
 * 从 packages/shared/src/design-tokens.ts 生成 styles.css 的两处令牌块：
 *
 * 1. @theme 块内的变量声明（含 fallback，取自 BASE_THEME.light）
 *    标记：/* @brutx:theme-tokens:start *\/ ... /* @brutx:theme-tokens:end *\/
 *
 * 2. @layer base 内的 :root / .dark 块（无 fallback，纯运行时值）
 *    标记：/* @brutx:root-tokens:start *\/ ... /* @brutx:root-tokens:end *\/
 *
 * 运行：pnpm --filter brutx-ui-vue prebuild:tokens
 * 消除 styles.css 与 design-tokens.ts 之间的硬编码漂移风险。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSS_VARS, BASE_THEME, type ThemeTokens } from 'brutx-shared-vue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STYLES_PATH = path.resolve(__dirname, '..', 'src', 'styles.css');

const ROOT_START = '/* @brutx:root-tokens:start */';
const ROOT_END = '/* @brutx:root-tokens:end */';
const THEME_START = '/* @brutx:theme-tokens:start */';
const THEME_END = '/* @brutx:theme-tokens:end */';

interface ThemeEntry {
    themeVar: string;
    build: (l: ThemeTokens) => string;
}

interface ThemeGroup {
    comment: string;
    entries: ThemeEntry[];
}

const THEME_GROUPS: ThemeGroup[] = [
    {
        comment:
            'Dynamic: resolve at runtime via --brutal-* for dark mode support.\n       Fallbacks sourced from BASE_THEME.light (see @brutx:root-tokens markers below).',
        entries: [
            { themeVar: '--color-brutal-bg', build: l => `var(--brutal-bg, ${l.bg})` },
            { themeVar: '--color-brutal-fg', build: l => `var(--brutal-fg, ${l.fg})` },
            { themeVar: '--color-brutal-muted', build: l => `var(--brutal-muted, ${l.muted})` },
            { themeVar: '--color-brutal-muted-foreground', build: l => `var(--brutal-muted-foreground, ${l.mutedForeground})` },
            { themeVar: '--color-brutal-ring', build: l => `var(--brutal-ring, ${l.ring})` },
            { themeVar: '--color-brutal-overlay', build: l => `var(--brutal-overlay, ${l.overlay})` },
            { themeVar: '--color-brutal-placeholder', build: l => `var(--brutal-placeholder, ${l.placeholder})` },
        ],
    },
    {
        comment: 'Dynamic: resolve at runtime so theme presets can override accents',
        entries: [
            { themeVar: '--color-brutal-primary', build: l => `var(--brutal-primary, ${l.primary})` },
            { themeVar: '--color-brutal-primary-foreground', build: l => `var(--brutal-primary-foreground, ${l.primaryForeground})` },
            { themeVar: '--color-brutal-secondary', build: l => `var(--brutal-secondary, ${l.secondary})` },
            { themeVar: '--color-brutal-secondary-foreground', build: l => `var(--brutal-secondary-foreground, ${l.secondaryForeground})` },
            { themeVar: '--color-brutal-accent', build: l => `var(--brutal-accent, ${l.accent})` },
            { themeVar: '--color-brutal-accent-foreground', build: l => `var(--brutal-accent-foreground, ${l.accentForeground})` },
            { themeVar: '--color-brutal-destructive', build: l => `var(--brutal-destructive, ${l.destructive})` },
            { themeVar: '--color-brutal-destructive-foreground', build: l => `var(--brutal-destructive-foreground, ${l.destructiveForeground})` },
            { themeVar: '--color-brutal-success', build: l => `var(--brutal-success, ${l.success})` },
            { themeVar: '--color-brutal-success-foreground', build: l => `var(--brutal-success-foreground, ${l.successForeground})` },
            { themeVar: '--color-brutal-info', build: l => `var(--brutal-info, ${l.info})` },
            { themeVar: '--color-brutal-info-foreground', build: l => `var(--brutal-info-foreground, ${l.infoForeground})` },
            { themeVar: '--color-brutal-danger', build: l => `var(--brutal-destructive, ${l.destructive})` },
            { themeVar: '--color-brutal-warning', build: l => `var(--brutal-accent, ${l.accent})` },
        ],
    },
    {
        comment: 'Static design tokens (not theme-aware)',
        entries: [
            { themeVar: '--color-brutal-black', build: l => `var(--brutal-black, ${l.black})` },
            { themeVar: '--color-brutal-yellow', build: l => `var(--brutal-yellow, ${l.yellow})` },
        ],
    },
    {
        comment: 'Dynamic: shadows use --brutal-shadow-* for dark mode',
        entries: [
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
        ],
    },
    {
        comment: 'Dynamic: border/radius use --brutal-* for theme support',
        entries: [
            { themeVar: '--border-width-3', build: l => `var(--brutal-border-width, ${l.borderWidth})` },
            { themeVar: '--radius-brutal', build: l => `var(--brutal-radius, ${l.radius})` },
        ],
    },
];

function formatVarsBlock(selector: string, vars: Record<string, string>): string {
    const lines = Object.entries(vars).map(
        ([key, value]) => `        --${key}: ${value};`,
    );
    return `    ${selector} {\n${lines.join('\n')}\n    }`;
}

function generateRootBlock(): string {
    const lightBlock = formatVarsBlock(':root', CSS_VARS.light);
    const darkBlock = formatVarsBlock('.dark', CSS_VARS.dark);
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

function injectBetweenMarkers(
    content: string,
    startMarker: string,
    endMarker: string,
    generated: string,
): string {
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1) {
        throw new Error(
            `无法在 styles.css 中找到注入标记。请确认存在 "${startMarker}" 与 "${endMarker}"。`,
        );
    }
    const startLineStart = content.lastIndexOf('\n', startIdx) + 1;
    const indent = content.slice(startLineStart, startIdx);
    const before = content.slice(0, startIdx + startMarker.length);
    const after = content.slice(endIdx);
    return `${before}\n${generated}\n${indent}${after}`;
}

function main(): void {
    let content = fs.readFileSync(STYLES_PATH, 'utf-8');
    let changed = false;

    const themeNext = injectBetweenMarkers(content, THEME_START, THEME_END, generateThemeBlock());
    if (themeNext !== content) {
        content = themeNext;
        changed = true;
    }

    const rootNext = injectBetweenMarkers(content, ROOT_START, ROOT_END, generateRootBlock());
    if (rootNext !== content) {
        content = rootNext;
        changed = true;
    }

    if (!changed) {
        console.log('✓ styles.css 令牌块已是最新，无需更新');
        return;
    }

    fs.writeFileSync(STYLES_PATH, content, 'utf-8');
    console.log('✓ styles.css 令牌块已从 design-tokens.ts 重新生成');
}

main();
