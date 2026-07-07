import { computed, ref, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'

export type TransferPanelKey = string | number

export interface TransferPanelItem {
    key: TransferPanelKey
    disabled?: boolean
}

export interface UseTransferPanelSelectionOptions<TItem extends TransferPanelItem> {
    items: MaybeRefOrGetter<readonly TItem[]>
}

export interface UseTransferPanelSelectionReturn<TItem extends TransferPanelItem> {
    checked: Ref<TransferPanelKey[]>
    allChecked: ComputedRef<boolean>
    indeterminate: ComputedRef<boolean>
    enabledKeys: ComputedRef<TransferPanelKey[]>
    handleAllCheckChange: (checked: boolean | 'indeterminate') => void
    toggleItem: (item: TItem) => void
    removeKeys: (keys: readonly TransferPanelKey[]) => void
    pruneKeys: (items: readonly TItem[]) => void
}

export function useTransferPanelSelection<TItem extends TransferPanelItem>(
    options: UseTransferPanelSelectionOptions<TItem>,
): UseTransferPanelSelectionReturn<TItem> {
    const checked = ref<TransferPanelKey[]>([])

    const enabledKeys = computed(() =>
        toValue(options.items)
            .filter(item => !item.disabled)
            .map(item => item.key)
    )

    const allChecked = computed(() => {
        if (enabledKeys.value.length === 0) return false
        return enabledKeys.value.every(key => checked.value.includes(key))
    })

    const indeterminate = computed(() => {
        if (enabledKeys.value.length === 0) return false
        const checkedCount = enabledKeys.value.filter(key => checked.value.includes(key)).length
        return checkedCount > 0 && checkedCount < enabledKeys.value.length
    })

    function handleAllCheckChange(nextChecked: boolean | 'indeterminate') {
        if (nextChecked === true || nextChecked === 'indeterminate') {
            checked.value = Array.from(new Set([...checked.value, ...enabledKeys.value]))
            return
        }

        removeKeys(enabledKeys.value)
    }

    function toggleItem(item: TItem) {
        if (item.disabled) return
        if (checked.value.includes(item.key)) {
            checked.value = checked.value.filter(key => key !== item.key)
            return
        }

        checked.value = [...checked.value, item.key]
    }

    function removeKeys(keys: readonly TransferPanelKey[]) {
        const keySet = new Set(keys)
        checked.value = checked.value.filter(key => !keySet.has(key))
    }

    function pruneKeys(items: readonly TItem[]) {
        const availableKeys = new Set(items.map(item => item.key))
        checked.value = checked.value.filter(key => availableKeys.has(key))
    }

    return {
        checked,
        allChecked,
        indeterminate,
        enabledKeys,
        handleAllCheckChange,
        toggleItem,
        removeKeys,
        pruneKeys,
    }
}
