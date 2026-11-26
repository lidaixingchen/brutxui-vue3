import { type DeepReadonly, type Ref, readonly, ref, watch } from 'vue'
import { normalizeColor } from '../lib/color'
import { getLocalStorage } from '../lib/env'

export interface UseColorHistoryOptions {
    storageKey?: string
    maxItems?: number
    enabled?: boolean
}

export interface UseColorHistoryReturn {
    history: DeepReadonly<Ref<string[]>>
    addToHistory: (color: string) => void
    clearHistory: () => void
}

const DEFAULT_MAX_ITEMS = 8

function readStorage(storageKey: string | undefined): string | null | undefined {
    if (!storageKey) return undefined
    try {
        return getLocalStorage()?.getItem(storageKey)
    } catch {
        return undefined
    }
}

function parseHistory(raw: string | null): string[] {
    if (!raw) return []
    try {
        const parsed: unknown = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        const colors = parsed
            .filter((item): item is string => typeof item === 'string')
            .map(normalizeColor)
            .filter((item): item is string => item !== null)
        return [...new Set(colors)]
    } catch {
        return []
    }
}

export function useColorHistory(options: UseColorHistoryOptions = {}): UseColorHistoryReturn {
    const getStorageKey = () => options.storageKey
    const getMaxItems = () => Math.max(0, Math.floor(options.maxItems ?? DEFAULT_MAX_ITEMS))
    const isEnabled = () => options.enabled ?? true
    const history = ref<string[]>([])
    let loadedKey = getStorageKey()
    let failedWrite: { key: string; storedValue: string | null | undefined } | undefined

    function currentHistory(storageKey: string | undefined, storedValue: string | null | undefined) {
        const cached = storageKey === loadedKey ? history.value : []
        if (storedValue === undefined) return cached
        // 持久化失败时沿用当前面板的内存记录，检测到外部存储更新后恢复以存储值为准。
        if (failedWrite && failedWrite.key === storageKey && failedWrite.storedValue === storedValue) return cached
        failedWrite = undefined
        return parseHistory(storedValue)
    }

    function saveHistory(colors: string[], storageKey: string | undefined, storedValue: string | null | undefined) {
        loadedKey = storageKey
        history.value = colors.slice(0, getMaxItems())
        if (!storageKey) return
        const storage = getLocalStorage()
        if (!storage) return
        try {
            storage.setItem(storageKey, JSON.stringify(history.value))
            failedWrite = undefined
        } catch {
            failedWrite = { key: storageKey, storedValue }
        }
    }

    function addToHistory(color: string) {
        if (!isEnabled()) return
        const normalized = normalizeColor(color)
        if (!normalized) return
        const storageKey = getStorageKey()
        const storedValue = readStorage(storageKey)
        const current = currentHistory(storageKey, storedValue)
        saveHistory([normalized, ...current.filter(item => item !== normalized)], storageKey, storedValue)
    }

    function clearHistory() {
        if (!isEnabled()) return
        const storageKey = getStorageKey()
        saveHistory([], storageKey, readStorage(storageKey))
    }

    watch([getStorageKey, getMaxItems, isEnabled], ([storageKey, maxItems, enabled], [previousKey, previousMax = maxItems, wasEnabled]) => {
        if (!enabled) {
            if (storageKey !== loadedKey) {
                history.value = []
                loadedKey = storageKey
                failedWrite = undefined
            }
            return
        }
        const storedValue = readStorage(storageKey)
        const current = currentHistory(storageKey, storedValue)
        if (storageKey === previousKey && wasEnabled && maxItems < previousMax && current.length > maxItems) {
            saveHistory(current, storageKey, storedValue)
            return
        }
        loadedKey = storageKey
        history.value = current.slice(0, maxItems)
    }, { immediate: true })

    return {
        history: readonly(history),
        addToHistory,
        clearHistory,
    }
}
