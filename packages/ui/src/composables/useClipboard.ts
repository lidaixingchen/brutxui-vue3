import { ref, onUnmounted, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import { getNavigator } from '../lib/env'

export const DEFAULT_COPIED_DURATION = 2000

export interface UseClipboardReturn {
    copy: (text: string) => Promise<boolean>
    copied: Ref<boolean>
    isSupported: Ref<boolean>
}

export function useClipboard(options: { duration?: MaybeRefOrGetter<number> } = {}): UseClipboardReturn {
    const copied = ref(false)
    const isSupported = ref(!!getNavigator()?.clipboard?.writeText)

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let disposed = false

    onUnmounted(() => {
        disposed = true
        if (timeoutId) clearTimeout(timeoutId)
    })

    async function copy(text: string) {
        if (!isSupported.value) return false

        // 每次 copy 动态检测 clipboard 能力：isSupported 是初始化时的快照，
        // 运行期间发生权限变更、API 失效等情况时同步刷新该状态，
        // 避免依赖它渲染的 UI（如禁用复制按钮）与实际不一致
        const writeText = getNavigator()?.clipboard?.writeText
        if (!writeText) {
            isSupported.value = false
            return false
        }

        try {
            await writeText(text)
            // 卸载后不再更新 copied 状态，但返回值语义统一为"写入是否成功"，
            // 避免卸载竞态下返回 true 却看不到反馈的状态不一致
            if (!disposed) {
                copied.value = true

                if (timeoutId) clearTimeout(timeoutId)
                // duration 下限保护：0/负数会按约 0ms 立即触发回调，
                // copied 被瞬间置回 false，复制成功的视觉反馈几乎不可见
                const duration = Math.max(toValue(options.duration) ?? DEFAULT_COPIED_DURATION, 100)
                timeoutId = setTimeout(() => {
                    copied.value = false
                }, duration)
            }

            return true
        } catch (err) {
            console.error('Failed to copy text: ', err)
            return false
        }
    }

    return {
        copy,
        copied,
        isSupported,
    }
}
