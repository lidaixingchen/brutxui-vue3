import type { CountdownValue } from './types'

export function parseCountdownTarget(val: CountdownValue): number | null {
    if (val === null || val === undefined || val === '') return null
    if (val instanceof Date) {
        const t = val.getTime()
        return Number.isFinite(t) ? t : null
    }
    if (typeof val === 'number') {
        return Number.isFinite(val) ? val : null
    }
    if (typeof val === 'string') {
        const trimmed = val.trim()
        if (!trimmed) return null
        if (/^\d+$/.test(trimmed)) {
            const num = Number(trimmed)
            return Number.isFinite(num) ? num : null
        }
        const parsed = Date.parse(trimmed)
        return Number.isFinite(parsed) ? parsed : null
    }
    return null
}

export function formatCountdown(remainingMs: number, format = 'HH:mm:ss'): string {
    const clamped = Math.max(0, Math.floor(remainingMs))
    const stripEscaped = format.replace(/\[[^\]]*\]/g, '')

    const hasDays = /D/.test(stripEscaped)
    const hasHours = /H/.test(stripEscaped)
    const hasMinutes = /m/.test(stripEscaped)
    const hasSeconds = /s/.test(stripEscaped)

    let days = 0
    let hours = 0
    let minutes = 0
    let seconds = 0
    let rem = clamped

    if (hasDays) {
        days = Math.floor(rem / (24 * 60 * 60 * 1000))
        rem %= 24 * 60 * 60 * 1000
    }
    if (hasHours) {
        hours = Math.floor(rem / (60 * 60 * 1000))
        rem %= 60 * 60 * 1000
    }
    if (hasMinutes) {
        minutes = Math.floor(rem / (60 * 1000))
        rem %= 60 * 1000
    }
    if (hasSeconds) {
        seconds = Math.floor(rem / 1000)
        rem %= 1000
    }
    const ms = rem

    const regex = /\[([^\]]*)\]|DD|D|HH|H|mm|m|ss|s|SSS|SS|S/g
    return format.replace(regex, (match, escaped: string | undefined) => {
        if (escaped !== undefined) return escaped
        switch (match) {
            case 'DD': return String(days).padStart(2, '0')
            case 'D': return String(days)
            case 'HH': return String(hours).padStart(2, '0')
            case 'H': return String(hours)
            case 'mm': return String(minutes).padStart(2, '0')
            case 'm': return String(minutes)
            case 'ss': return String(seconds).padStart(2, '0')
            case 's': return String(seconds)
            case 'SSS': return String(ms).padStart(3, '0')
            case 'SS': return String(Math.floor(ms / 10)).padStart(2, '0')
            case 'S': return String(Math.floor(ms / 100))
            default: return match
        }
    })
}
