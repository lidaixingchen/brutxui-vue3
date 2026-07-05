import { type DeepReadonly, type Ref, readonly, ref, watch } from 'vue'
import { normalizeColor } from '../lib/color'
import { hasLocalStorage, safeGetStorageItem, safeSetStorageItem } from '../lib/env'

export interface UseColorHistoryOptions {
    storageKey?: string
    maxItems?: number
}

export interface UseColorHistoryReturn {
    history: DeepReadonly<Ref<string[]>>
    addToHistory: (color: string) => void
    clearHistory: () => void
}

const DEFAULT_MAX_ITEMS = 8

export function useColorHistory(options: UseColorHistoryOptions = {}): UseColorHistoryReturn {
    // 使用 getter 读取最新值，避免静态捕获导致后续 props 变更不生效
    const getStorageKey = (): string | undefined => options.storageKey
    const getMaxItems = (): number => options.maxItems ?? DEFAULT_MAX_ITEMS

    const history = ref<string[]>([])

    function loadHistory() {
        const storageKey = getStorageKey()
        if (!storageKey || !hasLocalStorage) return
        const raw = safeGetStorageItem(storageKey)
        if (raw) {
            try {
                const parsed: unknown = JSON.parse(raw)
                if (Array.isArray(parsed)) {
                    history.value = parsed.filter((item) => typeof item === 'string').slice(0, getMaxItems())
                }
            } catch {
                history.value = []
            }
        }
    }

    function saveHistory() {
        const storageKey = getStorageKey()
        if (!storageKey || !hasLocalStorage) return
        safeSetStorageItem(storageKey, JSON.stringify(history.value))
    }

    function addToHistory(color: string) {
        const normalized = normalizeColor(color)
        if (!normalized) return
        const next = [normalized, ...history.value.filter((item) => item !== normalized)].slice(0, getMaxItems())
        history.value = next
        saveHistory()
    }

    function clearHistory() {
        history.value = []
        saveHistory()
    }

    loadHistory()

    // 监听 storageKey 变化，切换 key 时重新加载对应的历史记录
    watch(
        () => options.storageKey,
        () => {
            history.value = []
            loadHistory()
        }
    )

    return {
        history: readonly(history),
        addToHistory,
        clearHistory,
    }
}
