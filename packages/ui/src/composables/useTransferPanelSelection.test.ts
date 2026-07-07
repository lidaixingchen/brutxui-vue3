import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTransferPanelSelection, type TransferPanelItem } from './useTransferPanelSelection'

const items = ref<TransferPanelItem[]>([
    { key: 1 },
    { key: 2, disabled: true },
    { key: 3 },
])

describe('useTransferPanelSelection', () => {
    it('tracks all and indeterminate state from enabled items', () => {
        const selection = useTransferPanelSelection({ items })

        selection.toggleItem(items.value[0])

        expect(selection.checked.value).toEqual([1])
        expect(selection.allChecked.value).toBe(false)
        expect(selection.indeterminate.value).toBe(true)

        selection.handleAllCheckChange(true)

        expect(selection.checked.value).toEqual([1, 3])
        expect(selection.allChecked.value).toBe(true)
        expect(selection.indeterminate.value).toBe(false)
    })

    it('ignores disabled item toggles', () => {
        const selection = useTransferPanelSelection({ items })

        selection.toggleItem(items.value[1])

        expect(selection.checked.value).toEqual([])
    })

    it('removes selected keys and prunes unavailable keys', () => {
        const selection = useTransferPanelSelection({ items })

        selection.handleAllCheckChange(true)
        selection.removeKeys([1])

        expect(selection.checked.value).toEqual([3])

        selection.pruneKeys([{ key: 1 }])

        expect(selection.checked.value).toEqual([])
    })

    it('deselects visible enabled keys when all-check is false', () => {
        const selection = useTransferPanelSelection({ items })

        selection.checked.value = [1, 3, 4]
        selection.handleAllCheckChange(false)

        expect(selection.checked.value).toEqual([4])
    })
})
