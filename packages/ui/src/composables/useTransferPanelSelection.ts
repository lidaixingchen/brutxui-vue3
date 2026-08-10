import { readonly, computed, ref, toValue, type ComputedRef, type DeepReadonly, type MaybeRefOrGetter, type Ref } from 'vue'

export type TransferPanelKey = string | number

export interface TransferPanelItem {
    key: TransferPanelKey
    disabled?: boolean
}

export interface UseTransferPanelSelectionOptions<TItem extends TransferPanelItem> {
    items: MaybeRefOrGetter<readonly TItem[]>
}

export interface UseTransferPanelSelectionReturn<TItem extends TransferPanelItem> {
    /**
     * 只读视图：修改请经 handleAllCheckChange / toggleItem / removeKeys / pruneKeys。
     * 注意：checked 允许持有当前 items 之外的 key（跨面板 transfer 场景中，一侧面板的
     * 选中可能引用另一侧的面板项），因此它不会随 items 变化自动裁剪——请在 items
     * 变更时显式调用 pruneKeys 清理已删除项的残留 key。
     */
    checked: DeepReadonly<Ref<TransferPanelKey[]>>
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
    // 设计约定：checked 可持有当前 items 之外的面板 key（跨面板 Transfer 中，本面板的选中集
    // 可能引用对侧面板的条目），因此不随 items 变化自动裁剪；条目被删除/失效后由调用方经
    // pruneKeys 显式清理。toggleItem 不做 key 存在性校验是同一约定的延续。
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

    // 交互约定：半选态（indeterminate）点击视为全选，与 element-plus 等主流组件库一致。
    // 如需「点击半选 → 取消全选」的策略，请在调用方先归一化参数再传入。
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
        checked: readonly(checked),
        allChecked,
        indeterminate,
        enabledKeys,
        handleAllCheckChange,
        toggleItem,
        removeKeys,
        pruneKeys,
    }
}
