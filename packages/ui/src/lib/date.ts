function pad2(value: number): string {
    return value.toString().padStart(2, '0')
}

import { TWO_DIGIT_YEAR_PIVOT } from './defaults'

function pivotTwoDigitYear(twoDigitYear: number): number {
    return twoDigitYear >= TWO_DIGIT_YEAR_PIVOT ? 1900 + twoDigitYear : 2000 + twoDigitYear
}

export function getISOWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function getWeekStartDate(date: Date, weekStartsOn: 0 | 1 = 1): Date {
    const result = new Date(date)
    const day = result.getDay()
    const diff = weekStartsOn === 1
        ? (day === 0 ? -6 : 1 - day)
        : -day
    result.setDate(result.getDate() + diff)
    result.setHours(0, 0, 0, 0)
    return result
}

export function formatDate(date: Date | null | undefined, format: string): string {
    if (!date) return ''
    const tokens: Record<string, string> = {
        YYYY: String(date.getFullYear()),
        YY: String(date.getFullYear()).slice(-2),
        MM: pad2(date.getMonth() + 1),
        DD: pad2(date.getDate()),
        HH: pad2(date.getHours()),
        mm: pad2(date.getMinutes()),
        ss: pad2(date.getSeconds()),
        WW: pad2(getISOWeekNumber(date)),
    }
    let result = format
    for (const [token, value] of Object.entries(tokens)) {
        result = result.replace(new RegExp(token, 'g'), value)
    }
    return result
}

export function parseFormattedDate(text: string, format: string): Date | null {
    if (!text) return null
    const trimmed = text.trim()
    const escaped = format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const tokenRegex = escaped
        .replace(/YYYY/g, '(\\d{4})')
        .replace(/YY/g, '(\\d{2})')
        .replace(/MM/g, '(\\d{1,2})')
        .replace(/DD/g, '(\\d{1,2})')
        .replace(/HH/g, '(\\d{1,2})')
        .replace(/mm/g, '(\\d{1,2})')
        .replace(/ss/g, '(\\d{1,2})')
    const match = trimmed.match(new RegExp(`^${tokenRegex}$`))
    if (!match) return null
    const formatTokens: string[] = []
    let i = 0
    while (i < format.length) {
        let matched = false
        for (const token of ['YYYY', 'YY', 'MM', 'DD', 'HH', 'mm', 'ss']) {
            if (format.startsWith(token, i)) {
                formatTokens.push(token)
                i += token.length
                matched = true
                break
            }
        }
        if (!matched) i += 1
    }
    const parts: Record<string, number> = {}
    formatTokens.forEach((token, index) => {
        const value = parseInt(match[index + 1], 10)
        if (!Number.isNaN(value)) parts[token] = value
    })
    const year = parts.YYYY ?? (parts.YY !== undefined ? pivotTwoDigitYear(parts.YY) : new Date().getFullYear())
    const month = (parts.MM ?? 1) - 1
    const day = parts.DD ?? 1
    const hours = parts.HH ?? 0
    const minutes = parts.mm ?? 0
    const seconds = parts.ss ?? 0
    const date = new Date(year, month, day, hours, minutes, seconds)
    if (Number.isNaN(date.getTime())) return null
    return date
}
