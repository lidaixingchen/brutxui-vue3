import { ref, onUnmounted, toValue, type MaybeRefOrGetter } from 'vue'

const DEFAULT_COPIED_DURATION = 2000

export function useClipboard(options: { duration?: MaybeRefOrGetter<number> } = {}) {
    const copied = ref(false)
    const isSupported = ref(typeof navigator !== 'undefined' && !!navigator.clipboard?.writeText)

    let timeoutId: number | null = null

    onUnmounted(() => {
        if (timeoutId) clearTimeout(timeoutId)
    })

    async function copy(text: string) {
        if (!isSupported.value) return false

        try {
            await navigator.clipboard.writeText(text)
            copied.value = true

            if (timeoutId) clearTimeout(timeoutId)
            const duration = toValue(options.duration) ?? DEFAULT_COPIED_DURATION
            timeoutId = window.setTimeout(() => {
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
