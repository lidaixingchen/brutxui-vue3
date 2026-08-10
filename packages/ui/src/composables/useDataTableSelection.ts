import { readonly, shallowRef, computed, toValue, type ComputedRef, type MaybeRefOrGetter, type ShallowRef } from 'vue'

export interface UseDataTableSelectionOptions<T extends object> {
    selectable: MaybeRefOrGetter<boolean | undefined>
    rowKey: MaybeRefOrGetter<keyof T | ((row: T) => string | number)>
    displayData: MaybeRefOrGetter<T[]>
    data: MaybeRefOrGetter<T[]>
}

export interface UseDataTableSelectionReturn<T> {
    /** 只读视图：修改请经 toggleRowSelection / toggleAllSelection / clearSelection */
    selectedRows: Readonly<ShallowRef<ReadonlySet<string | number>>>
    isAllSelected: ComputedRef<boolean>
    isIndeterminate: ComputedRef<boolean>
    toggleRowSelection: (row: T) => void
    toggleAllSelection: () => void
    clearSelection: () => void
    getRowKey: (row: T) => string | number
    getSelectedRows: () => T[]
}

export function useDataTableSelection<T extends object>(
    options: UseDataTableSelectionOptions<T>,
): UseDataTableSelectionReturn<T> {
    const selectedRows = shallowRef<Set<string | number>>(new Set())

    // 非标量 key 的兜底序列化结果按行对象缓存，避免 computed 重算时反复 JSON.stringify；
    // 仅缓存兜底路径，标量 key 仍是廉价的属性读取，降低行内容变化导致陈旧 key 的风险
    const nonScalarKeyCache = new WeakMap<object, string>()
    let warnedNonScalarKey = false

    function getRowKey(row: T): string | number {
        const key = toValue(options.rowKey)
        if (typeof key === 'function') return key(row)
        const value = row[key]
        if (typeof value !== 'string' && typeof value !== 'number') {
            // 非标量 key 只在首次出现时告警一次，避免每行每次 computed 重算都刷屏
            if (!warnedNonScalarKey) {
                warnedNonScalarKey = true
                console.warn(`[useDataTableSelection] rowKey property "${String(key)}" returned a non-string/number value. Using JSON.stringify for stable identity.`)
            }
            const cached = nonScalarKeyCache.get(row)
            if (cached !== undefined) return cached
            // 带 json: 前缀，避免与合法的字面字符串（如 "true"）碰撞
            const result = `json:${JSON.stringify(value)}`
            nonScalarKeyCache.set(row, result)
            return result
        }
        return value
    }

    const isAllSelected = computed(() => {
        const data = toValue(options.displayData)
        if (data.length === 0) return false
        return data.every((row) => selectedRows.value.has(getRowKey(row)))
    })

    const isIndeterminate = computed(() => {
        if (isAllSelected.value) return false
        const data = toValue(options.displayData)
        return data.some((row) => selectedRows.value.has(getRowKey(row)))
    })

    function toggleRowSelection(row: T) {
        if (toValue(options.selectable) !== true) return
        const key = getRowKey(row)
        const newSelection = new Set(selectedRows.value)
        if (newSelection.has(key)) {
            newSelection.delete(key)
        } else {
            newSelection.add(key)
        }
        selectedRows.value = newSelection
    }

    function toggleAllSelection() {
        if (toValue(options.selectable) !== true) return
        if (isAllSelected.value) {
            // 与"全选"逻辑对称：仅从选择集中移除当前可见行，
            // 保留其它页/已被过滤掉的跨页选择（displayData 只是子集时不应清空全部）
            const newSelection = new Set(selectedRows.value)
            toValue(options.displayData).forEach((row) => newSelection.delete(getRowKey(row)))
            selectedRows.value = newSelection
        } else {
            const newSelection = new Set(selectedRows.value)
            toValue(options.displayData).forEach((row) => newSelection.add(getRowKey(row)))
            selectedRows.value = newSelection
        }
    }

    function clearSelection() {
        selectedRows.value = new Set()
    }

    function getSelectedRows(): T[] {
        return toValue(options.data).filter((row) => selectedRows.value.has(getRowKey(row)))
    }

    return {
        selectedRows: readonly(selectedRows),
        isAllSelected,
        isIndeterminate,
        toggleRowSelection,
        toggleAllSelection,
        clearSelection,
        getRowKey,
        getSelectedRows,
    }
}
