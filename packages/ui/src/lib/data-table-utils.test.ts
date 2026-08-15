import { describe, expect, it } from 'vitest'
import { createSelectValueMap, getCellValue } from './data-table-utils'

describe('createSelectValueMap', () => {
    it('maps String(value) back to the original option value type', () => {
        const map = createSelectValueMap([
            { label: 'A', value: 25 },
            { label: 'B', value: 'bob@example.com' },
            { label: 'C', value: 0 },
            { label: 'D', value: '' },
        ])
        expect(map.get('25')).toBe(25)
        expect(map.get('bob@example.com')).toBe('bob@example.com')
        expect(map.get('0')).toBe(0)
        expect(map.get('')).toBe('')
    })

    it('handles empty options', () => {
        const map = createSelectValueMap([])
        expect(map.size).toBe(0)
        expect(map.get('anything')).toBeUndefined()
    })
})

describe('getCellValue', () => {
    it('falls back to empty string for missing key with dev warning suppressed in prod', () => {
        const row = { name: 'Alice' }
        const column = { id: 'age', header: 'Age', accessorKey: 'age' } as unknown as { id: string; header: string; accessorKey: keyof typeof row & string }
        expect(getCellValue(row, column)).toBe('')
    })
})
