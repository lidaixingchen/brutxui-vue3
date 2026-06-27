import { useDataTableSelection } from './useDataTableSelection'

interface Row extends Record<string, unknown> {
    id: number
    name: string
}

const data: Row[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
]

function setup(displayData: Row[] = data) {
    return useDataTableSelection<Row>({
        selectable: () => true,
        rowKey: () => 'id',
        displayData: () => displayData,
        data: () => data,
    })
}

describe('useDataTableSelection', () => {
    it('starts empty', () => {
        const { selectedRows, isAllSelected, isIndeterminate } = setup()
        expect(selectedRows.value.size).toBe(0)
        expect(isAllSelected.value).toBe(false)
        expect(isIndeterminate.value).toBe(false)
    })

    it('toggleRowSelection adds then removes', () => {
        const { selectedRows, toggleRowSelection } = setup()
        toggleRowSelection(data[0])
        expect(selectedRows.value.has(1)).toBe(true)

        toggleRowSelection(data[0])
        expect(selectedRows.value.has(1)).toBe(false)
    })

    it('toggleAllSelection selects all when none selected', () => {
        const { selectedRows, isAllSelected, toggleAllSelection } = setup()
        toggleAllSelection()
        expect(selectedRows.value.size).toBe(3)
        expect(isAllSelected.value).toBe(true)
    })

    it('toggleAllSelection clears when all selected', () => {
        const { selectedRows, toggleAllSelection } = setup()
        toggleAllSelection()
        toggleAllSelection()
        expect(selectedRows.value.size).toBe(0)
    })

    it('isIndeterminate is true when some but not all selected', () => {
        const { isIndeterminate, isAllSelected, toggleRowSelection } = setup()
        toggleRowSelection(data[0])
        expect(isIndeterminate.value).toBe(true)
        expect(isAllSelected.value).toBe(false)
    })

    it('isIndeterminate is false when all selected', () => {
        const { isIndeterminate, toggleAllSelection } = setup()
        toggleAllSelection()
        expect(isIndeterminate.value).toBe(false)
    })

    it('isAllSelected is false when displayData is empty', () => {
        const { isAllSelected } = setup([])
        expect(isAllSelected.value).toBe(false)
    })

    it('clearSelection empties the set', () => {
        const { selectedRows, toggleAllSelection, clearSelection } = setup()
        toggleAllSelection()
        clearSelection()
        expect(selectedRows.value.size).toBe(0)
    })

    it('getSelectedRows returns full-data rows matching selected keys', () => {
        const { toggleRowSelection, getSelectedRows } = setup([data[0]])
        toggleRowSelection(data[0])
        const selected = getSelectedRows()
        expect(selected).toHaveLength(1)
        expect(selected[0].id).toBe(1)
    })

    it('selection persists across pages (displayData changes)', () => {
        const selection = useDataTableSelection<Row>({
            selectable: () => true,
            rowKey: () => 'id',
            displayData: () => [data[0]],
            data: () => data,
        })
        selection.toggleRowSelection(data[0])
        expect(selection.selectedRows.value.has(1)).toBe(true)

        const page2 = useDataTableSelection<Row>({
            selectable: () => true,
            rowKey: () => 'id',
            displayData: () => [data[1], data[2]],
            data: () => data,
        })
        page2.toggleRowSelection(data[1])
        page2.toggleRowSelection(data[2])
        expect(page2.isAllSelected.value).toBe(true)
    })

    it('does nothing when selectable is false', () => {
        const { selectedRows, toggleRowSelection, toggleAllSelection } = useDataTableSelection<Row>({
            selectable: () => false,
            rowKey: () => 'id',
            displayData: () => data,
            data: () => data,
        })
        toggleRowSelection(data[0])
        toggleAllSelection()
        expect(selectedRows.value.size).toBe(0)
    })

    it('supports function rowKey', () => {
        const { selectedRows, toggleRowSelection, getRowKey } = useDataTableSelection<Row>({
            selectable: () => true,
            rowKey: () => (row: Row) => `row-${row.id}`,
            displayData: () => data,
            data: () => data,
        })
        toggleRowSelection(data[0])
        expect(selectedRows.value.has('row-1')).toBe(true)
        expect(getRowKey(data[0])).toBe('row-1')
    })
})
