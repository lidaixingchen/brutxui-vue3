import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useSelectionDisplayText } from './useSelectionDisplayText'

interface TestItem {
    label: string
}

describe('useSelectionDisplayText', () => {
    it('returns placeholder when single selection is empty', () => {
        const displayText = useSelectionDisplayText<TestItem>({
            selectedItems: [],
            placeholder: 'Select item',
        })

        expect(displayText.value).toBe('Select item')
    })

    it('returns selected label in single mode', () => {
        const displayText = useSelectionDisplayText({
            selectedItems: [{ label: 'Apple' }],
            placeholder: 'Select item',
        })

        expect(displayText.value).toBe('Apple')
    })

    it('formats multiple labels within maxDisplay', () => {
        const displayText = useSelectionDisplayText({
            selectedItems: [{ label: 'Apple' }, { label: 'Banana' }],
            placeholder: 'Select items',
            multiple: true,
            maxDisplay: 2,
            formatList: (labels) => labels.join(' / '),
        })

        expect(displayText.value).toBe('Apple / Banana')
    })

    it('formats selected count when multiple labels exceed maxDisplay', () => {
        const displayText = useSelectionDisplayText({
            selectedItems: [{ label: 'Apple' }, { label: 'Banana' }, { label: 'Cherry' }],
            placeholder: 'Select items',
            multiple: true,
            maxDisplay: 2,
            formatCount: (count) => `${count} items picked`,
        })

        expect(displayText.value).toBe('3 items picked')
    })

    it('tracks reactive selected items and placeholder', () => {
        const selectedItems = ref<TestItem[]>([])
        const placeholder = ref('Pick one')
        const displayText = useSelectionDisplayText({
            selectedItems,
            placeholder,
        })

        expect(displayText.value).toBe('Pick one')

        selectedItems.value = [{ label: 'Cherry' }]
        expect(displayText.value).toBe('Cherry')

        selectedItems.value = []
        placeholder.value = 'Choose fruit'
        expect(displayText.value).toBe('Choose fruit')
    })
})
