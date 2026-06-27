import { useDataTableFilter } from './useDataTableFilter'
import type { DataTableColumn } from '@/components/data-table/types'

interface Row extends Record<string, unknown> {
    id: number
    name: string
    email: string
    age: number
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
        const { filterState, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        filterState.value.global = 'ALICE'
        expect(filteredData(data).map((r) => r.id)).toEqual([1])
    })

    it('global filter matches across visible columns', () => {
        const { filterState, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        filterState.value.global = 'example.com'
        expect(filteredData(data)).toHaveLength(3)
    })

    it('global filter does not match hidden columns', () => {
        const { filterState, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        filterState.value.global = 'Alice'
        const result = filteredData(data)
        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('Alice')
    })

    it('column-level filter', () => {
        const { filterState, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        filterState.value.columns = { age: '30' }
        expect(filteredData(data).map((r) => r.id)).toEqual([2])
    })

    it('empty column filter value is skipped', () => {
        const { filterState, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        filterState.value.columns = { age: '' }
        expect(filteredData(data)).toHaveLength(3)
    })

    it('multiple column filters stack (AND)', () => {
        const { filterState, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        filterState.value.columns = { name: 'a', email: 'example' }
        const result = filteredData(data).map((r) => r.name)
        expect(result).toEqual(['Alice', 'Charlie'])
    })

    it('global and column filters stack', () => {
        const { filterState, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        filterState.value.global = 'example'
        filterState.value.columns = { name: 'b' }
        expect(filteredData(data).map((r) => r.id)).toEqual([2])
    })

    it('supports accessorFn', () => {
        const cols: DataTableColumn<Row>[] = [
            { id: 'upper', header: 'Upper', accessorFn: (row) => row.name.toUpperCase() },
        ]
        const { filterState, filteredData } = useDataTableFilter({
            columns: () => cols,
            filterable: () => true,
        })
        filterState.value.global = 'ALICE'
        expect(filteredData(data).map((r) => r.id)).toEqual([1])
    })

    it('does not mutate input array', () => {
        const { filterState, filteredData } = useDataTableFilter({
            columns: () => columns,
            filterable: () => true,
        })
        filterState.value.global = 'a'
        const snapshot = [...data]
        filteredData(data)
        expect(data).toEqual(snapshot)
    })
})
