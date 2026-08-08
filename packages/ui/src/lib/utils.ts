import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 统一焦点环类名。
 *
 * 颜色走主题令牌 `ring-brutal-ring` / `ring-offset-brutal-bg`（依赖 styles.css @theme 中
 * 的 `--color-brutal-ring` / `--color-brutal-bg`，运行时经 `--brutal-*` 变量随 dark 类与
 * 替代主题自动翻转），避免硬编码纯黑/纯白在 dark 与 pastel/warm 等主题下出现接缝。
 *
 * `focus-visible:outline-*` 透明 outline 作为 forced-colors（如 Windows 高对比度）下的降级：
 * 该模式下 box-shadow 实现的 ring 会被 UA 禁用，UA 将透明 outline 强制渲染为系统前景色，
 * 保证键盘焦点指示始终可见（WCAG 2.4.7）；正常模式下透明不可见、不影响 ring 外观。
 */
export const FOCUS_RING_CLASSES =
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transparent focus-visible:ring-3 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg'

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}
