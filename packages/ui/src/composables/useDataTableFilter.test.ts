import { useDataTableFilter } from './useDataTableFilter'
import type { DataTableColumn } from '@/components/data-table/types'

interface Row extends Record<string, unknown> {
    id: number
    name: string
    email: string
    age: number
    createdAt?: string
}

const columns: DataTableColumn<Row>[] = [
    { id: 'name', header: 'Name', accessorKey: 'name' },
    { id: 'email', header: 'Email', accessorKey: 'email' },
    { id: 'age', header: 'Age', accessorKey: 'age' },
    { id: 'hidden', header: 'Hidden', accessorKey: 'name', hidden: true },
]

const data: Row[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com', age: 25 },
    { id: 2, name: 'Bob', email: 'bob@example.com', age: 30 },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 },
]

describe('useDataTableFilter', () => {
    it('returns original data when filterable is false', () => {
        const { filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => false,
        })
        expect(filteredData(data)).toEqual(data)
    })

    it('returns original data when no filter set', () => {
        const { filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        expect(filteredData(data)).toEqual(data)
    })

    it('global filter is case-insensitive', () => {
        const { setGlobalFilter, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        setGlobalFilter('ALICE')
        expect(filteredData(data).map((r) => r.id)).toEqual([1])
    })

    it('global filter matches across visible columns', () => {
        const { setGlobalFilter, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        setGlobalFilter('example.com')
        expect(filteredData(data)).toHaveLength(3)
    })

    it('global filter does not match hidden columns', () => {
        const { setGlobalFilter, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        setGlobalFilter('Alice')
        const result = filteredData(data)
        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('Alice')
    })

    it('column-level filter', () => {
        const { setColumnFilter, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        setColumnFilter('age', '30')
        expect(filteredData(data).map((r) => r.id)).toEqual([2])
    })

    it('empty column filter value is skipped', () => {
        const { setColumnFilter, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        setColumnFilter('age', '')
        expect(filteredData(data)).toHaveLength(3)
    })

    it('multiple column filters stack (AND)', () => {
        const { setColumnFilter, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        setColumnFilter('name', 'a')
        setColumnFilter('email', 'example')
        const result = filteredData(data).map((r) => r.name)
        expect(result).toEqual(['Alice', 'Charlie'])
    })

    it('global and column filters stack', () => {
        const { setGlobalFilter, setColumnFilter, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        setGlobalFilter('example')
        setColumnFilter('name', 'b')
        expect(filteredData(data).map((r) => r.id)).toEqual([2])
    })

    it('supports accessorFn', () => {
        const cols: DataTableColumn<Row>[] = [
            { id: 'upper', header: 'Upper', accessorFn: (row) => row.name.toUpperCase() },
        ]
        const { setGlobalFilter, filteredData } = useDataTableFilter({
            columns: () => cols,
            filterable: () => true,
        })
        setGlobalFilter('ALICE')
        expect(filteredData(data).map((r) => r.id)).toEqual([1])
    })

    it('does not mutate input array', () => {
        const { setGlobalFilter, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        setGlobalFilter('a')
        const snapshot = [...data]
        filteredData(data)
        expect(data).toEqual(snapshot)
    })

    it('parses YYYY-MM-DD date ranges as local dates and includes the end day', () => {
        const dateColumns: DataTableColumn<Row>[] = [
            { id: 'createdAt', header: 'Created', accessorKey: 'createdAt', filterType: 'date-range' },
        ]
        const dateData: Row[] = [
            { id: 1, name: 'Start', email: 'start@example.com', age: 1, createdAt: '2026-01-01' },
            { id: 2, name: 'Middle', email: 'middle@example.com', age: 2, createdAt: '2026-01-02T12:00:00' },
            { id: 3, name: 'End', email: 'end@example.com', age: 3, createdAt: '2026-01-03T23:00:00' },
            { id: 4, name: 'After', email: 'after@example.com', age: 4, createdAt: '2026-01-04' },
        ]
        const { setColumnFilter, filteredData } = useDataTableFilter({
            columns: () => dateColumns,
            filterable: () => true,
        })

        setColumnFilter('createdAt', { start: '2026-01-02', end: '2026-01-03' })

        expect(filteredData(dateData).map((row) => row.id)).toEqual([2, 3])
    })
})
