import { readonly, ref, onMounted, onUnmounted, type Ref } from 'vue'
import { isClient, matchMedia } from '../lib/env'

export function useReducedMotion(): Readonly<Ref<boolean>> {
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
        // 查询已在 setup 阶段完成（客户端同步执行），挂载后仅注册变更监听。
        // onMounted 只在客户端执行，此处不再重复查询——能力检测结果在两次查询间不会变化，
        // 原兜底分支为死代码（isClient 恒为 true，matchMedia 失败时两次都会失败）
        mediaQuery?.addEventListener('change', onChange)
    })

    onUnmounted(() => {
        mediaQuery?.removeEventListener('change', onChange)
    })

    return readonly(prefersReduced)
}
