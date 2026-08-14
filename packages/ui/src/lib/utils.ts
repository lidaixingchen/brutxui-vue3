import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
