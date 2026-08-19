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
        if (!storageKey) return
        const raw = safeGetStorageItem(storageKey)
        if (raw) {
            try {
                const parsed: unknown = JSON.parse(raw)
                if (Array.isArray(parsed)) {
                    // 与 addToHistory 的写入校验保持一致：非法颜色（空串、无效 hex 等）
                    // 不得注入 history，避免被篡改或旧版本写入的数据导致下游取色/渲染出错
                    history.value = parsed
                        .filter((item): item is string => typeof item === 'string')
                        .map((item) => normalizeColor(item))
                        .filter((item): item is string => !!item)
                        .slice(0, getMaxItems())
                }
            } catch {
                history.value = []
            }
        }
    }

    function saveHistory() {
        const storageKey = getStorageKey()
        if (!storageKey) return
        // 写入前先与现有存储合并，避免多标签页共用 storageKey 时全量覆盖丢失其他标签页新增的历史
        let merged = history.value
        const raw = safeGetStorageItem(storageKey)
        if (raw) {
            try {
                const existing: unknown = JSON.parse(raw)
                if (Array.isArray(existing)) {
                    // 与 loadHistory 的校验一致：非法颜色（空串、无效 hex 等）
                    // 不得合并写回存储，避免占用 maxItems 位置且两侧校验不一致
                    const existingValid = existing
                        .filter((item): item is string => typeof item === 'string')
                        .map((item) => normalizeColor(item))
                        .filter((item): item is string => !!item)
                    // 当前历史在前（新值优先），去重后再按 maxItems 裁剪
                    merged = [...new Set([...history.value, ...existingValid])].slice(0, getMaxItems())
                }
            } catch {
                // 存储数据非法时直接以当前历史覆盖
            }
        }
        safeSetStorageItem(storageKey, JSON.stringify(merged))
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
        const storageKey = getStorageKey()
        if (!storageKey || !hasLocalStorage) return
        // 清除语义：全量覆盖写空数组（不走 saveHistory 的合并逻辑，
        // 否则其他标签页残留数据会阻止清空持久化生效）
        safeSetStorageItem(storageKey, JSON.stringify([]))
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

    // maxItems 变化时重新裁剪已有 history 并持久化，
    // 避免新配置（如 maxItems 从 8 改为 5）要等下一次 addToHistory 才生效
    watch(
        () => options.maxItems,
        () => {
            if (history.value.length > getMaxItems()) {
                history.value = history.value.slice(0, getMaxItems())
                saveHistory()
            }
        }
    )

    return {
        history: readonly(history),
        addToHistory,
        clearHistory,
    }
}
