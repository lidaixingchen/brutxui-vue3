import { destroyFallback as destroyToastFallback } from './useToast'
import { destroyFallback as destroyThemeFallback } from './useTheme'
import { destroyMessageSystem } from './useMessage'

export function destroyBrutxFallbacks(): void {
    destroyToastFallback()
    destroyThemeFallback()
    destroyMessageSystem()
}
