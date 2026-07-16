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

        const writeText = getNavigator()?.clipboard?.writeText
        if (!writeText) return false

        try {
            await writeText(text)
            if (disposed) return true
            copied.value = true

            if (timeoutId) clearTimeout(timeoutId)
            const duration = toValue(options.duration) ?? DEFAULT_COPIED_DURATION
            timeoutId = setTimeout(() => {
                copied.value = false
            }, duration)

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
