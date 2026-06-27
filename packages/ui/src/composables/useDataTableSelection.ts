import { ref, computed, toValue, type MaybeRefOrGetter } from 'vue'

export interface UseDataTableSelectionOptions<T extends Record<string, unknown>> {
    selectable: MaybeRefOrGetter<boolean | undefined>
    rowKey: MaybeRefOrGetter<keyof T | ((row: T) => string | number)>
    displayData: MaybeRefOrGetter<T[]>
    data: MaybeRefOrGetter<T[]>
}

export function useDataTableSelection<T extends Record<string, unknown>>(
    options: UseDataTableSelectionOptions<T>,
) {
    const selectedRows = ref<Set<string | number>>(new Set())

    function getRowKey(row: T): string | number {
        const key = toValue(options.rowKey)
        if (typeof key === 'function') return key(row)
        const value = row[key]
        if (typeof value !== 'string' && typeof value !== 'number') {
            console.warn(`[useDataTableSelection] rowKey property "${String(key)}" returned a non-string/number value. Using String conversion.`)
            return String(value)
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
            selectedRows.value = new Set()
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
        selectedRows,
        isAllSelected,
        isIndeterminate,
        toggleRowSelection,
        toggleAllSelection,
        clearSelection,
        getRowKey,
        getSelectedRows,
    }
}
