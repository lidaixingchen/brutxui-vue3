import {
    formatDate,
    parseFormattedDate,
} from './date'

describe('formatDate', () => {
    it('returns empty string for null', () => {
        expect(formatDate(null, 'YYYY-MM-DD')).toBe('')
    })

    it('returns empty string for undefined', () => {
        expect(formatDate(undefined, 'YYYY-MM-DD')).toBe('')
    })

    it('formats YYYY-MM-DD correctly', () => {
        const date = new Date(2026, 0, 5)
        expect(formatDate(date, 'YYYY-MM-DD')).toBe('2026-01-05')
    })

    it('formats YYYY/MM/DD correctly', () => {
        const date = new Date(2026, 11, 25)
        expect(formatDate(date, 'YYYY/MM/DD')).toBe('2026/12/25')
    })

    it('formats YYYY-MM-DD HH:mm:ss correctly', () => {
        const date = new Date(2026, 0, 5, 14, 30, 45)
        expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2026-01-05 14:30:45')
    })

    it('pads single digit month and day', () => {
        const date = new Date(2026, 0, 1)
        expect(formatDate(date, 'YYYY-MM-DD')).toBe('2026-01-01')
    })

    it('handles time-only format', () => {
        const date = new Date(2026, 0, 1, 9, 5, 3)
        expect(formatDate(date, 'HH:mm:ss')).toBe('09:05:03')
    })

    it('handles custom separator', () => {
        const date = new Date(2026, 5, 26)
        expect(formatDate(date, 'YYYY.MM.DD')).toBe('2026.06.26')
    })

    it('formats YY as two-digit year', () => {
        const date = new Date(2026, 0, 5)
        expect(formatDate(date, 'YY-MM-DD')).toBe('26-01-05')
    })

    it('formats YY for years in 1900s', () => {
        const date = new Date(1998, 5, 26)
        expect(formatDate(date, 'YY')).toBe('98')
    })

    it('does not conflict YY with YYYY', () => {
        const date = new Date(2026, 0, 5)
        expect(formatDate(date, 'YYYY YY')).toBe('2026 26')
    })
})

describe('parseFormattedDate', () => {
    it('parses YYYY-MM-DD correctly', () => {
        const result = parseFormattedDate('2026-01-05', 'YYYY-MM-DD')
        expect(result).not.toBeNull()
        expect(result!.getFullYear()).toBe(2026)
        expect(result!.getMonth()).toBe(0)
        expect(result!.getDate()).toBe(5)
    })

    it('parses YYYY/MM/DD correctly', () => {
        const result = parseFormattedDate('2026/12/25', 'YYYY/MM/DD')
        expect(result).not.toBeNull()
        expect(result!.getMonth()).toBe(11)
        expect(result!.getDate()).toBe(25)
    })

    it('parses YYYY-MM-DD HH:mm:ss correctly', () => {
        const result = parseFormattedDate('2026-01-05 14:30:45', 'YYYY-MM-DD HH:mm:ss')
        expect(result).not.toBeNull()
        expect(result!.getHours()).toBe(14)
        expect(result!.getMinutes()).toBe(30)
        expect(result!.getSeconds()).toBe(45)
    })

    it('parses single digit month and day', () => {
        const result = parseFormattedDate('2026-1-5', 'YYYY-MM-DD')
        expect(result).not.toBeNull()
        expect(result!.getMonth()).toBe(0)
        expect(result!.getDate()).toBe(5)
    })

    it('returns null for empty string', () => {
        expect(parseFormattedDate('', 'YYYY-MM-DD')).toBeNull()
    })

    it('returns null for non-matching format', () => {
        expect(parseFormattedDate('not-a-date', 'YYYY-MM-DD')).toBeNull()
    })

    it('returns null for partial match', () => {
        expect(parseFormattedDate('2026-01', 'YYYY-MM-DD')).toBeNull()
    })

    it('handles time-only format', () => {
        const result = parseFormattedDate('09:05:03', 'HH:mm:ss')
        expect(result).not.toBeNull()
        expect(result!.getHours()).toBe(9)
        expect(result!.getMinutes()).toBe(5)
        expect(result!.getSeconds()).toBe(3)
    })

    it('handles custom separator', () => {
        const result = parseFormattedDate('2026.06.26', 'YYYY.MM.DD')
        expect(result).not.toBeNull()
        expect(result!.getMonth()).toBe(5)
        expect(result!.getDate()).toBe(26)
    })

    it('parses YY as 2000s when below pivot', () => {
        const result = parseFormattedDate('26-01-05', 'YY-MM-DD')
        expect(result).not.toBeNull()
        expect(result!.getFullYear()).toBe(2026)
    })

    it('parses YY as 1900s when at or above pivot', () => {
        const result = parseFormattedDate('98-06-26', 'YY-MM-DD')
        expect(result).not.toBeNull()
        expect(result!.getFullYear()).toBe(1998)
    })
})
