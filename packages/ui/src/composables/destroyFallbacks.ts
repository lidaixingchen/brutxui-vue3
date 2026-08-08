import { destroyFallback as destroyToastFallback } from './useToast'
import { destroyFallback as destroyThemeFallback } from './useTheme'
import { destroyMessageSystem } from './useMessage'

/**
 * 清理全部共享 fallback 状态（toast / theme / message）。
 * 推荐在测试隔离、多应用同页或热更新边界调用一次。
 */
export function destroyBrutxUI(): void {
    destroyToastFallback()
    destroyThemeFallback()
    destroyMessageSystem()
}

/** @deprecated 请使用 {@link destroyBrutxUI}（同一实现的更清晰命名） */
export const destroyBrutxFallbacks = destroyBrutxUI
