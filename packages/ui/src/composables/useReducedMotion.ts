import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { isClient, matchMedia } from '../lib/env'

export function useReducedMotion(): Ref<boolean> {
    const prefersReduced = ref(false)
    let mediaQuery: MediaQueryList | null = null

    const onChange = (e: MediaQueryListEvent) => {
        prefersReduced.value = e.matches
    }

    // 客户端 setup 阶段同步查询：SSR 无法获知偏好（isClient=false 时跳过），
    // 但客户端 hydration 首帧即可获得正确值——避免挂载前恒 false 导致
    // 减少动态用户首帧渲染动画类名（闪烁）并与 SSR 输出的空类名不匹配
    if (isClient) {
        const mq = matchMedia('(prefers-reduced-motion: reduce)')
        if (mq) {
            mediaQuery = mq
            prefersReduced.value = mq.matches
        }
    }

    onMounted(() => {
        // 兜底：setup 阶段 matchMedia 不可用（能力检测失败）时挂载后再查
        if (isClient && !mediaQuery) {
            const mq = matchMedia('(prefers-reduced-motion: reduce)')
            if (mq) {
                mediaQuery = mq
                prefersReduced.value = mq.matches
            }
        }
        mediaQuery?.addEventListener('change', onChange)
    })

    onUnmounted(() => {
        mediaQuery?.removeEventListener('change', onChange)
    })

    return prefersReduced
}
