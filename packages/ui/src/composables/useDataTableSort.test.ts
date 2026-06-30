import { useDataTableSort } from './useDataTableSort'
import type { DataTableColumn } from '@/components/data-table/types'

interface Row extends Record<string, unknown> {
    id: number
    name: string
    age: number
}

const columns: DataTableColumn<Row>[] = [
    { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
    { id: 'age', header: 'Age', accessorKey: 'age', sortable: true },
    { id: 'nosort', header: 'NoSort', accessorKey: 'name', sortable: false },
    { id: 'hidden', header: 'Hidden', accessorKey: 'name', hidden: true },
]

const data: Row[] = [
    { id: 1, name: 'Charlie', age: 35 },
    { id: 2, name: 'Alice', age: 25 },
    { id: 3, name: 'Bob', age: 30 },
]

describe('useDataTableSort', () => {
    it('toggles asc -> desc -> null on same column', () => {
        const { sortState, toggleSort } = useDataTableSort({
            columns: () => columns,
            sortable: () => true,
        })

        toggleSort('name')
        expect(sortState.value).toEqual({ column: 'name', direction: 'asc' })

        toggleSort('name')
        expect(sortState.value).toEqual({ column: 'name', direction: 'desc' })

        toggleSort('name')
        expect(sortState.value).toEqual({ column: '', direction: null })
    })

    it('switching column resets to asc', () => {
        const { sortState, toggleSort } = useDataTableSort({
            columns: () => columns,
            sortable: () => true,
        })

        toggleSort('name')
        toggleSort('name')
        expect(sortState.value.direction).toBe('desc')

        toggleSort('age')
        expect(sortState.value).toEqual({ column: 'age', direction: 'asc' })
    })

    it('does nothing when sortable is false', () => {
        const { sortState, toggleSort } = useDataTableSort({
            columns: () => columns,
            sortable: () => false,
        })

        toggleSort('name')
        expect(sortState.value).toEqual({ column: '', direction: null })
    })

    it('skips columns with sortable: false', () => {
        const { sortState, toggleSort } = useDataTableSort({
            columns: () => columns,
            sortable: () => true,
        })

        toggleSort('nosort')
        expect(sortState.value).toEqual({ column: '', direction: null })
    })

    it('skips hidden columns', () => {
        const { sortState, toggleSort } = useDataTableSort({
            columns: () => columns,
            sortable: () => true,
        })

        toggleSort('hidden')
        expect(sortState.value).toEqual({ column: '', direction: null })
    })

    it('returns original data when no sort active', () => {
        const { sortedData } = useDataTableSort({
            columns: () => columns,
            sortable: () => true,
        })

        const result = sortedData(data)
        expect(result).toEqual(data)
    })

    it('sorts ascending by string', () => {
        const { sortState, toggleSort, sortedData } = useDataTableSort({
            columns: () => columns,
            sortable: () => true,
        })

        toggleSort('name')
        expect(sortState.value.direction).toBe('asc')

        const result = sortedData(data)
        expect(result.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie'])
    })

    it('sorts descending by number', () => {
        const { toggleSort, sortedData } = useDataTableSort({
            columns: () => columns,
            sortable: () => true,
        })

        toggleSort('name')
        toggleSort('name')
        const result = sortedData(data)
        expect(result.map((r) => r.name)).toEqual(['Charlie', 'Bob', 'Alice'])
    })

    it('pushes null/undefined values to the end', () => {
        const withNull: Row[] = [
            { id: 1, name: 'Alice', age: 25 },
            { id: 2, name: 'Bob', age: 30 },
        ]
        const cols: DataTableColumn<Row>[] = [
            { id: 'age', header: 'Age', accessorFn: (row) => (row.id === 1 ? null : row.age), sortable: true },
        ]
        const { toggleSort, sortedData } = useDataTableSort({
            columns: () => cols,
            sortable: () => true,
        })

        toggleSort('age')
        const result = sortedData(withNull)
        expect(result[0].id).toBe(2)
        expect(result[1].id).toBe(1)
    })

    it('supports accessorFn', () => {
        const cols: DataTableColumn<Row>[] = [
            { id: 'upper', header: 'Upper', accessorFn: (row) => row.name.toUpperCase(), sortable: true },
        ]
        const { toggleSort, sortedData } = useDataTableSort({
            columns: () => cols,
            sortable: () => true,
        })

        toggleSort('upper')
        const result = sortedData(data)
        expect(result.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie'])
    })

    it('does not mutate input array', () => {
        const { toggleSort, sortedData } = useDataTableSort({
            columns: () => columns,
            sortable: () => true,
        })

        toggleSort('name')
        const snapshot = [...data]
        sortedData(data)
        expect(data).toEqual(snapshot)
    })

    it('toggles to asc when column matches but direction is null', () => {
        const { sortState, toggleSort } = useDataTableSort({
            columns: () => columns,
            sortable: () => true,
        })

        // Manually set state to column='name', direction=null (line 31 scenario)
        sortState.value = { column: 'name', direction: null }
        toggleSort('name')
        expect(sortState.value).toEqual({ column: 'name', direction: 'asc' })
    })

    it('sorts ascending by number', () => {
        const cols: DataTableColumn<Row>[] = [
            { id: 'age', header: 'Age', accessorKey: 'age', sortable: true },
        ]
        const { toggleSort, sortedData } = useDataTableSort({
            columns: () => cols,
            sortable: () => true,
        })

        toggleSort('age')
        const result = sortedData(data)
        expect(result.map((r) => r.age)).toEqual([25, 30, 35])
    })

    it('sorts descending by number', () => {
        const cols: DataTableColumn<Row>[] = [
            { id: 'age', header: 'Age', accessorKey: 'age', sortable: true },
        ]
        const { toggleSort, sortedData } = useDataTableSort({
            columns: () => cols,
            sortable: () => true,
        })

        toggleSort('age')
        toggleSort('age')
        const result = sortedData(data)
        expect(result.map((r) => r.age)).toEqual([35, 30, 25])
    })

    it('sorts ascending by date', () => {
        interface DateRow extends Record<string, unknown> {
            id: number
            date: Date
        }
        const dateData: DateRow[] = [
            { id: 1, date: new Date('2024-03-01') },
            { id: 2, date: new Date('2024-01-01') },
            { id: 3, date: new Date('2024-02-01') },
        ]
        const cols: DataTableColumn<DateRow>[] = [
            { id: 'date', header: 'Date', accessorKey: 'date', sortable: true },
        ]
        const { toggleSort, sortedData } = useDataTableSort({
            columns: () => cols,
            sortable: () => true,
        })

        toggleSort('date')
        const result = sortedData(dateData)
        expect(result.map((r) => r.id)).toEqual([2, 3, 1])
    })

    it('sorts descending by date', () => {
        interface DateRow extends Record<string, unknown> {
            id: number
            date: Date
        }
        const dateData: DateRow[] = [
            { id: 1, date: new Date('2024-03-01') },
            { id: 2, date: new Date('2024-01-01') },
            { id: 3, date: new Date('2024-02-01') },
        ]
        const cols: DataTableColumn<DateRow>[] = [
            { id: 'date', header: 'Date', accessorKey: 'date', sortable: true },
        ]
        const { toggleSort, sortedData } = useDataTableSort({
            columns: () => cols,
            sortable: () => true,
        })

        toggleSort('date')
        toggleSort('date')
        const result = sortedData(dateData)
        expect(result.map((r) => r.id)).toEqual([1, 3, 2])
    })

    it('returns original data when sort column is not found in visibleColumns', () => {
        const { sortState, sortedData } = useDataTableSort({
            columns: () => columns,
            sortable: () => true,
        })

        // Set sortState to a column that doesn't exist in visibleColumns
        sortState.value = { column: 'nonexistent', direction: 'asc' }
        const result = sortedData(data)
        expect(result).toEqual(data)
    })

    it('pushes undefined valueB to the end', () => {
        const withUndefined: Row[] = [
            { id: 1, name: 'Alice', age: 25 },
            { id: 2, name: 'Bob', age: 30 },
        ]
        const cols: DataTableColumn<Row>[] = [
            { id: 'age', header: 'Age', accessorFn: (row) => (row.id === 2 ? undefined : row.age), sortable: true },
        ]
        const { toggleSort, sortedData } = useDataTableSort({
            columns: () => cols,
            sortable: () => true,
        })

        toggleSort('age')
        const result = sortedData(withUndefined)
        expect(result[0].id).toBe(1)
        expect(result[1].id).toBe(2)
    })

    it('returns data unchanged when all values are equal', () => {
        const equalData: Row[] = [
            { id: 1, name: 'Alice', age: 30 },
            { id: 2, name: 'Bob', age: 30 },
        ]
        const cols: DataTableColumn<Row>[] = [
            { id: 'age', header: 'Age', accessorKey: 'age', sortable: true },
        ]
        const { toggleSort, sortedData } = useDataTableSort({
            columns: () => cols,
            sortable: () => true,
        })

        toggleSort('age')
        const result = sortedData(equalData)
        expect(result.map((r) => r.id)).toEqual([1, 2])
    })
})
