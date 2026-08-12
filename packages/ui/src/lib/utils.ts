import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 统一焦点指示类名。
 *
 * 用可见 outline 表达焦点，替代原 ring + 透明 outline 降级方案（FOCUS_RING_CLASSES 属
 * 未落地死导出，已废弃）。box-shadow 实现的 ring 在 forced-colors 下会被 UA 禁用，而
 * 可见 outline 在该模式下由 UA 强制渲染为系统前景色，保证焦点指示始终可见（WCAG 2.4.7）。
 *
 * `focus-visible:` 前缀语义：仅在键盘导航（如 Tab）触发时显示焦点指示，鼠标点击不残留
 * 焦点环，兼顾可访问性与鼠标用户体验。
 *
 * 颜色走主题令牌 `--color-brutal-ring`（依赖 styles.css @theme 定义），运行时经
 * `--brutal-*` 变量随 dark 类与替代主题自动翻转，避免硬编码纯黑/纯白出现接缝。
 */
export const FOCUS_OUTLINE_CLASSES =
    'focus-visible:outline-2 focus-visible:outline-brutal-ring focus-visible:outline-offset-2'

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}
