import { describe, expect, it } from 'vitest'
import { getCellValue } from './data-table-utils'

describe('getCellValue', () => {
    it('falls back to empty string for missing key with dev warning suppressed in prod', () => {
        const row = { name: 'Alice' }
        const column = { id: 'age', header: 'Age', accessorKey: 'age' } as unknown as { id: string; header: string; accessorKey: keyof typeof row & string }
        expect(getCellValue(row, column)).toBe('')
    })
})
