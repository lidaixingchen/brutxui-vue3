import { BASE_THEME } from '../design-tokens.js';

export interface PatternNestedRule {
    selector: string;
    declarations: string[];
}

export interface PatternUtilityDefinition {
    name: string;
    comment: string;
    declarations: string[];
    nestedRules?: PatternNestedRule[];
}

const HAZARD_PATTERN: string =
    'repeating-linear-gradient(-45deg, var(--brutal-accent, #FFE66D), var(--brutal-accent, #FFE66D) 10px, var(--brutal-border-color, #000000) 10px, var(--brutal-border-color, #000000) 20px)';

export const PATTERN_UTILITIES: PatternUtilityDefinition[] = [
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
        declarations: [`background-image: ${HAZARD_PATTERN};`],
    },
    {
        name: 'button-hazard-label',
        comment: '警戒按钮：中央纯色文字底板与外围斜纹',
        declarations: [
            `background-image: linear-gradient(var(--brutal-yellow, ${BASE_THEME.light.yellow}), var(--brutal-yellow, ${BASE_THEME.light.yellow})), ${HAZARD_PATTERN};`,
            'background-size: calc(100% - var(--spacing) * 2) calc(100% - var(--spacing) * 2), 100% 100%;',
            'background-position: center;',
            'background-repeat: no-repeat;',
            'background-origin: padding-box;',
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
        declarations: ['position: relative;'],
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
