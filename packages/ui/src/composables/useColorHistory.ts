import { type DeepReadonly, type Ref, readonly, ref } from 'vue'
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
    const { storageKey, maxItems = DEFAULT_MAX_ITEMS } = options
    const history = ref<string[]>([])

    function loadHistory() {
        if (!storageKey || !hasLocalStorage) return
        const raw = safeGetStorageItem(storageKey)
        if (raw) {
            try {
                const parsed: unknown = JSON.parse(raw)
                if (Array.isArray(parsed)) {
                    history.value = parsed.filter((item) => typeof item === 'string').slice(0, maxItems)
                }
            } catch {
                history.value = []
            }
        }
    }

    function saveHistory() {
        if (!storageKey || !hasLocalStorage) return
        safeSetStorageItem(storageKey, JSON.stringify(history.value))
    }

    function addToHistory(color: string) {
        const normalized = normalizeColor(color)
        if (!normalized) return
        const next = [normalized, ...history.value.filter((item) => item !== normalized)].slice(0, maxItems)
        history.value = next
        saveHistory()
    }

    function clearHistory() {
        history.value = []
        saveHistory()
    }

    loadHistory()

    return {
        history: readonly(history),
        addToHistory,
        clearHistory,
    }
}
