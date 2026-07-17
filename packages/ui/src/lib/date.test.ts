import {
    formatDate,
    parseFormattedDate,
    getISOWeekNumber,
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

    it('formats WW as ISO week number with zero padding', () => {
        // 2026-01-01 是周四，所以 ISO week 1 的周一是 2025-12-29，2026-01-05 是 week 2 的周一
        const date = new Date(2026, 0, 5)
        expect(formatDate(date, 'YYYY-WW')).toBe('2026-02')
    })

    it('formats WW with two-digit padding for week 10+', () => {
        // 2026-03-09 大约是第 11 周
        const date = new Date(2026, 2, 9)
        const weekNum = getISOWeekNumber(date)
        expect(formatDate(date, 'YYYY-WW')).toBe(`2026-${pad2(weekNum)}`)
    })
})

function pad2(value: number): string {
    return value.toString().padStart(2, '0')
}

describe('parseFormattedDate', () => {
    it('parses YYYY-MM-DD correctly', () => {
        const result = parseFormattedDate('2026-01-05', 'YYYY-MM-DD')
        expect(result).not.toBeNull()
        expect(result!.getFullYear()).toBe(2026)
        expect(result!.getMonth()).toBe(0)
        expect(result!.getDate()).toBe(5)
    })

    it('parses date-only strings as local midnight', () => {
        const result = parseFormattedDate('2026-01-05', 'YYYY-MM-DD')
        expect(result).not.toBeNull()
        expect(result!.getTime()).toBe(new Date(2026, 0, 5).getTime())
        expect(result!.getHours()).toBe(0)
        expect(result!.getMinutes()).toBe(0)
        expect(result!.getSeconds()).toBe(0)
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

    it('returns null for overflow dates', () => {
        expect(parseFormattedDate('2026-02-31', 'YYYY-MM-DD')).toBeNull()
        expect(parseFormattedDate('2026-13-01', 'YYYY-MM-DD')).toBeNull()
        expect(parseFormattedDate('2026-01-01 25:00:00', 'YYYY-MM-DD HH:mm:ss')).toBeNull()
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

    it('parses YYYY-WW as the Monday of that ISO week', () => {
        // 2026-W01 的周一是 2025-12-29（2026-01-01 是周四，故 week 1 的周一在前一年 12 月）
        const result = parseFormattedDate('2026-01', 'YYYY-WW')
        expect(result).not.toBeNull()
        expect(result!.getDay()).toBe(1) // 周一
        expect(getISOWeekNumber(result!)).toBe(1)
        // 该日期在 ISO 周历中属于 2026 年第 1 周，但日历上属于 2025-12-29
        expect(result!.getFullYear()).toBe(2025)
        expect(result!.getMonth()).toBe(11)
        expect(result!.getDate()).toBe(29)
    })

    it('parses YYYY-WW for week 2 correctly (Monday in same year)', () => {
        // 2026-W02 的周一是 2026-01-05
        const result = parseFormattedDate('2026-02', 'YYYY-WW')
        expect(result).not.toBeNull()
        expect(result!.getFullYear()).toBe(2026)
        expect(result!.getMonth()).toBe(0)
        expect(result!.getDate()).toBe(5)
        expect(result!.getDay()).toBe(1) // 周一
    })

    it('roundtrips YYYY-WW format', () => {
        // 取一个日期，格式化为 YYYY-WW，再解析回来，应得到同一周周一
        const original = new Date(2026, 2, 11) // 某个周三
        const formatted = formatDate(original, 'YYYY-WW')
        const parsed = parseFormattedDate(formatted, 'YYYY-WW')
        expect(parsed).not.toBeNull()
        // 解析结果应为 original 所在周的周一
        expect(getISOWeekNumber(parsed!)).toBe(getISOWeekNumber(original))
        expect(parsed!.getDay()).toBe(1) // 周一
    })

    it('returns null for invalid WW week number', () => {
        expect(parseFormattedDate('2026-00', 'YYYY-WW')).toBeNull()
        expect(parseFormattedDate('2026-54', 'YYYY-WW')).toBeNull()
    })

    it('WW is ignored when MM/DD is also provided', () => {
        // MM/DD 与 WW 共存时优先使用 MM/DD，避免语义冲突
        const result = parseFormattedDate('2026-03-09-11', 'YYYY-MM-DD-WW')
        expect(result).not.toBeNull()
        expect(result!.getMonth()).toBe(2) // 3月
        expect(result!.getDate()).toBe(9)
    })
})
