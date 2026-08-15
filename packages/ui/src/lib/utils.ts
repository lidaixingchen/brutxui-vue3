import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// 设计令牌颜色名（styles.css 的 --color-brutal-*）：tailwind-merge 默认不识别自定义色，
// 未注册时调用方覆盖类（如 bg-red-500 覆盖 bg-brutal-primary）不会与默认类冲突去重，
// 最终生效取决于 CSS 加载顺序而非 cn() 的合并优先级
const BRUTAL_COLOR_NAMES = [
    'brutal-accent',
    'brutal-accent-foreground',
    'brutal-accent-subtle',
    'brutal-bg',
    'brutal-black',
    'brutal-destructive',
    'brutal-destructive-foreground',
    'brutal-destructive-subtle',
    'brutal-fg',
    'brutal-info',
    'brutal-info-foreground',
    'brutal-info-subtle',
    'brutal-muted',
    'brutal-muted-foreground',
    'brutal-overlay',
    'brutal-overlay-subtle',
    'brutal-placeholder',
    'brutal-primary',
    'brutal-primary-foreground',
    'brutal-primary-subtle',
    'brutal-ring',
    'brutal-secondary',
    'brutal-secondary-foreground',
    'brutal-secondary-subtle',
    'brutal-status-error',
    'brutal-status-error-foreground',
    'brutal-status-info',
    'brutal-status-info-foreground',
    'brutal-status-success',
    'brutal-status-success-foreground',
    'brutal-status-warning',
    'brutal-status-warning-foreground',
    'brutal-success',
    'brutal-success-foreground',
    'brutal-success-subtle',
    'brutal-yellow',
]

const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            color: [...BRUTAL_COLOR_NAMES],
        },
    },
})

/**
 * 统一焦点指示类名（FOCUS_RING_CLASSES 五件套）。
 *
 * 经阴影组装化后 box-shadow 争用根因消除，焦点体系采用 ring 表达。
 * 配套 `outline-hidden` 在普通模式下抑制 UA 默认焦点环（避免双环），
 * 在 forced-colors 模式下由 `outline-hidden` 自带的恢复块配合 UA 强制渲染系统焦点环（WCAG 2.4.7）。
 *
 * `focus-visible:` 前缀语义：仅在键盘导航（如 Tab）触发时显示焦点指示，鼠标点击不残留
 * 焦点环，兼顾可访问性与鼠标用户体验。
 *
 * 颜色走主题令牌 `--color-brutal-ring` 与 `--color-brutal-bg`（间隙跟随主题背景，暗色不出现白圈）。
 */
export const FOCUS_RING_CLASSES =
    'focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden'

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}