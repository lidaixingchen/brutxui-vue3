import { destroyFallback as destroyToastFallback } from './useToast'
import { destroyFallback as destroyThemeFallback } from './useTheme'
import { destroyMessageSystem } from './useMessage'

/**
 * 清理全部共享 fallback 状态（toast / theme / message）。
 * 推荐在测试隔离、多应用同页或热更新边界调用一次。
 * @deprecated 使用统一命名入口 {@link destroyBrutxUI}（同一实现的更清晰命名）
 */
export function destroyBrutxFallbacks(): void {
    destroyToastFallback()
    destroyThemeFallback()
    destroyMessageSystem()
}

/** destroyBrutxFallbacks 的统一命名入口，二者指向同一实现。 */
export const destroyBrutxUI = destroyBrutxFallbacks
