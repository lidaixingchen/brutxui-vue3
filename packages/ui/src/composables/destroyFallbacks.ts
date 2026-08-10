import { destroyFallback as destroyToastFallback } from './useToast'
import { destroyFallback as destroyThemeFallback } from './useTheme'
import { destroyMessageSystem } from './useMessage'

/**
 * 清理全部共享 fallback 状态（toast / theme / message）。
 * 推荐在测试隔离、多应用同页或热更新边界调用一次。
 */
export function destroyBrutxUI(): void {
    const cleaners = [destroyToastFallback, destroyThemeFallback, destroyMessageSystem]
    for (const clean of cleaners) {
        try {
            clean()
        } catch (err) {
            // 单个清理步骤抛错（如卸载/HMR 阶段 DOM 不稳定）不应中断后续清理，
            // 否则会导致 mediaQuery 监听器、message 容器等回退资源泄漏
            console.error('[BrutxUI] Failed to destroy fallback:', err)
        }
    }
}

/** @deprecated 请使用 {@link destroyBrutxUI}（同一实现的更清晰命名） */
export const destroyBrutxFallbacks = destroyBrutxUI
