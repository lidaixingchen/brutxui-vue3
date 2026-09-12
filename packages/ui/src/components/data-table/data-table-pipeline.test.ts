import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDataTablePipeline } from './useDataTablePipeline'
import type { DataTableColumn } from '@/types/data-table'

interface TestItem {
    id: number
    name: string
    category: string
    score: number
    date?: string
}

describe('useDataTablePipeline', () => {
    const defaultColumns: DataTableColumn<TestItem>[] = [
        { id: 'id', accessorKey: 'id', header: 'ID', sortable: true },
        { id: 'name', accessorKey: 'name', header: 'Name', sortable: true, filterType: 'text' },
        { id: 'category', accessorKey: 'category', header: 'Category', sortable: true, filterType: 'select' },
        { id: 'score', accessorKey: 'score', header: 'Score', sortable: true },
        { id: 'date', accessorKey: 'date', header: 'Date', filterType: 'date-range' },
    ]

    const testData: TestItem[] = [
        { id: 1, name: 'Apple', category: 'fruit', score: 10, date: '2026-01-01' },
        { id: 2, name: 'Banana', category: 'fruit', score: 50, date: '2026-01-05' },
        { id: 3, name: 'Carrot', category: 'vegetable', score: 30, date: '2026-01-10' },
        { id: 4, name: 'Date', category: 'fruit', score: 40, date: '2026-01-15' },
        { id: 5, name: 'Eggplant', category: 'vegetable', score: 20, date: '2026-01-20' },
        { id: 6, name: 'Fig', category: 'fruit', score: 60, date: '2026-01-25' },
    ]

    it('processes pipeline in order: filter -> sort -> pagination', () => {
        const data = ref([...testData])
        const pipeline = useDataTablePipeline<TestItem>({
            data,
            columns: defaultColumns,
            rowKey: 'id',
            filterable: true,
            sortable: true,
            paginated: true,
            pageSize: 2,
        })

        expect(pipeline.displayData.value.map((i) => i.id)).toEqual([1, 2])
        expect(pipeline.totalFilteredItems.value).toBe(6)

        // 1. Filter: category === 'fruit' -> [1, 2, 4, 6]
        pipeline.filter.setColumnFilter('category', 'fruit')
        expect(pipeline.totalFilteredItems.value).toBe(4)
        expect(pipeline.pagination.totalPages.value).toBe(2)

        // 2. Sort: score desc -> [6 (60), 2 (50), 4 (40), 1 (10)]
        pipeline.sort.toggleSort('score') // asc
        pipeline.sort.toggleSort('score') // desc

        // 3. Paginate: page 1, size 2 -> [6, 2]
        expect(pipeline.displayData.value.map((i) => i.id)).toEqual([6, 2])

        // Go to page 2 -> [4, 1]
        pipeline.pagination.goToPage(2)
        expect(pipeline.displayData.value.map((i) => i.id)).toEqual([4, 1])
    })

    it('preserves selection across pages and supports page-specific toggle all', () => {
        const data = ref([...testData])
        const pipeline = useDataTablePipeline<TestItem>({
            data,
            columns: defaultColumns,
            rowKey: 'id',
            selectable: true,
            paginated: true,
            pageSize: 2,
        })

        // Page 1 has items [1, 2]
        expect(pipeline.displayData.value.map((i) => i.id)).toEqual([1, 2])

        // Select all on page 1
        pipeline.selection.toggleAllSelection()
        expect(pipeline.selection.isAllSelected.value).toBe(true)
        expect([...pipeline.selection.selectedRows.value]).toEqual([1, 2])

        // Switch to page 2 (items [3, 4])
        pipeline.pagination.goToPage(2)
        expect(pipeline.selection.isAllSelected.value).toBe(false)
        expect(pipeline.selection.isIndeterminate.value).toBe(false)

        // Select item 3 on page 2
        pipeline.selection.toggleRowSelection(pipeline.displayData.value[0]!)
        expect([...pipeline.selection.selectedRows.value]).toEqual([1, 2, 3])

        // Switch back to page 1
        pipeline.pagination.goToPage(1)
        expect(pipeline.selection.isAllSelected.value).toBe(true)

        // Toggle all on page 1 (unselect page 1 items)
        pipeline.selection.toggleAllSelection()
        // Page 1 items unselected, item 3 on page 2 preserved!
        expect([...pipeline.selection.selectedRows.value]).toEqual([3])
        expect(pipeline.selection.getSelectedRows().map((i) => i.id)).toEqual([3])
    })

    it('preserves selection and page when data content updates with identical keySet, resets when keySet changes', async () => {
        const data = ref<TestItem[]>([
            { id: 1, name: 'A', category: 'cat', score: 10 },
            { id: 2, name: 'B', category: 'cat', score: 20 },
            { id: 3, name: 'C', category: 'cat', score: 30 },
            { id: 4, name: 'D', category: 'cat', score: 40 },
        ])
        const pipeline = useDataTablePipeline<TestItem>({
            data,
            columns: defaultColumns,
            rowKey: 'id',
            selectable: true,
            paginated: true,
            pageSize: 2,
        })

        // Navigate to page 2, select item 3
        pipeline.pagination.goToPage(2)
        pipeline.selection.toggleRowSelection(data.value[2]!)
        expect(pipeline.pagination.currentPage.value).toBe(2)
        expect([...pipeline.selection.selectedRows.value]).toEqual([3])

        // Update data with new array reference but identical keys
        data.value = [
            { id: 1, name: 'A updated', category: 'cat', score: 11 },
            { id: 2, name: 'B updated', category: 'cat', score: 21 },
            { id: 3, name: 'C updated', category: 'cat', score: 31 },
            { id: 4, name: 'D updated', category: 'cat', score: 41 },
        ]
        await nextTick()

        // Page and selection should be preserved
        expect(pipeline.pagination.currentPage.value).toBe(2)
        expect([...pipeline.selection.selectedRows.value]).toEqual([3])
        expect(pipeline.selection.getSelectedRows()[0]?.name).toBe('C updated')

        // Now change keySet: replace item 4 with item 5
        data.value = [
            { id: 1, name: 'A', category: 'cat', score: 10 },
            { id: 2, name: 'B', category: 'cat', score: 20 },
            { id: 3, name: 'C', category: 'cat', score: 30 },
            { id: 5, name: 'E', category: 'cat', score: 50 },
        ]
        await nextTick()

        // Page should reset to 1 and selection should be cleared
        expect(pipeline.pagination.currentPage.value).toBe(1)
        expect([...pipeline.selection.selectedRows.value]).toEqual([])
    })

    it('handles concurrent filter patch updates atomically', () => {
        const data = ref([...testData])
        const pipeline = useDataTablePipeline<TestItem>({
            data,
            columns: defaultColumns,
            rowKey: 'id',
            filterable: true,
        })

        // Multi-column patch
        pipeline.applyColumnFilterPatch({
            columns: {
                category: 'fruit',
                name: 'a',
            },
        })

        expect(pipeline.filter.filterState.value.columns).toEqual({
            category: 'fruit',
            name: 'a',
        })
        // Both applied: Apple (1), Banana (2), Date (4) contain 'a' and are 'fruit'. Fig (6) does not contain 'a'
        expect(pipeline.displayData.value.map((i) => i.id)).toEqual([1, 2, 4])

        // Atomic update and removal
        pipeline.applyColumnFilterPatch({
            global: 'Banana',
            columns: {
                name: '', // should delete name filter
            },
        })

        expect(pipeline.filter.filterState.value.global).toBe('Banana')
        expect(pipeline.filter.filterState.value.columns).toEqual({
            category: 'fruit',
        })
        expect(pipeline.displayData.value.map((i) => i.id)).toEqual([2])
    })

    it('respects reactive feature switches matrix', async () => {
        const sortable = ref(true)
        const filterable = ref(true)
        const selectable = ref(true)
        const paginated = ref(true)
        const pageSize = ref(2)

        const pipeline = useDataTablePipeline<TestItem>({
            data: testData,
            columns: defaultColumns,
            rowKey: 'id',
            sortable,
            filterable,
            selectable,
            paginated,
            pageSize,
        })

        // 1. Sort switch:
        pipeline.sort.toggleSort('score') // asc
        expect(pipeline.sort.sortState.value.direction).toBe('asc')
        expect(pipeline.activeColumnId.value).toBe('score')

        // Disable sortable
        sortable.value = false
        // toggleSort is blocked
        pipeline.sort.toggleSort('score')
        expect(pipeline.sort.sortState.value.direction).toBe('asc')
        // But existing sort still participates in data ordering
        expect(pipeline.sortedData.value[0]!.score).toBe(10)

        // Re-enable sortable
        sortable.value = true
        pipeline.sort.toggleSort('score') // moves to desc
        expect(pipeline.sort.sortState.value.direction).toBe('desc')

        // 2. Filter switch:
        pipeline.filter.setColumnFilter('category', 'vegetable')
        expect(pipeline.filteredData.value.length).toBe(2)

        // Disable filterable
        filterable.value = false
        // Filter is temporarily bypassed, full data returned
        expect(pipeline.filteredData.value.length).toBe(6)
        // Filter state itself is preserved
        expect(pipeline.filter.filterState.value.columns.category).toBe('vegetable')

        // Re-enable filterable
        filterable.value = true
        expect(pipeline.filteredData.value.length).toBe(2)

        // Clear filter for next checks
        pipeline.filter.clearFilters()

        // 3. Select switch:
        pipeline.selection.toggleRowSelection(testData[0]!)
        expect([...pipeline.selection.selectedRows.value]).toEqual([1])

        // Disable selectable
        selectable.value = false
        // toggleRowSelection & toggleAllSelection are blocked
        pipeline.selection.toggleRowSelection(testData[1]!)
        expect([...pipeline.selection.selectedRows.value]).toEqual([1])

        // clearSelection can still be called
        pipeline.selection.clearSelection()
        expect([...pipeline.selection.selectedRows.value]).toEqual([])

        // Re-enable selectable
        selectable.value = true
        pipeline.selection.toggleRowSelection(testData[0]!)
        expect([...pipeline.selection.selectedRows.value]).toEqual([1])

        // 4. Pagination switch:
        pipeline.pagination.goToPage(2)
        expect(pipeline.pagination.currentPage.value).toBe(2)
        expect(pipeline.displayData.value.length).toBe(2)

        // Disable paginated
        paginated.value = false
        // Returns all sorted rows
        expect(pipeline.displayData.value.length).toBe(6)
        // Current page is preserved
        expect(pipeline.pagination.currentPage.value).toBe(2)

        // Re-enable paginated
        paginated.value = true
        expect(pipeline.displayData.value.length).toBe(2)

        // 5. PageSize external update
        pageSize.value = 4
        await nextTick()
        expect(pipeline.pagination.currentPageSize.value).toBe(4)
        expect(pipeline.displayData.value.length).toBe(2) // 6 items with size 4: page 2 has 2 items
    })

    it('supports function-based rowKey and stable identity', () => {
        const getCustomKey = (row: TestItem) => `custom-${row.id}`
        const pipeline = useDataTablePipeline<TestItem>({
            data: testData,
            columns: defaultColumns,
            rowKey: getCustomKey,
            selectable: true,
        })

        pipeline.selection.toggleRowSelection(testData[0]!)
        expect([...pipeline.selection.selectedRows.value]).toEqual(['custom-1'])
        expect(pipeline.selection.getSelectedRows().map((i) => i.id)).toEqual([1])
    })

    it('handles empty data and hidden columns gracefully', () => {
        const hiddenCols: DataTableColumn<TestItem>[] = [
            { id: 'id', accessorKey: 'id', header: 'ID', hidden: true },
            { id: 'name', accessorKey: 'name', header: 'Name' },
        ]
        const pipeline = useDataTablePipeline<TestItem>({
            data: [],
            columns: hiddenCols,
            rowKey: 'id',
            paginated: true,
            sortable: true,
        })

        expect(pipeline.displayData.value).toEqual([])
        expect(pipeline.totalFilteredItems.value).toBe(0)
        expect(pipeline.pagination.totalPages.value).toBe(1)

        // Toggling sort on hidden column is blocked
        pipeline.sort.toggleSort('id')
        expect(pipeline.sort.sortState.value.column).toBe('')
    })
})
