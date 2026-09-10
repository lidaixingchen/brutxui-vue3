import type { FormatNumberOptions, StatisticValue } from './types'

export interface ParseResult {
    isNegative: boolean
    intPart: string
    fracPart: string
}

const NUMERIC_REGEX = /^[+-]?(?:(?:\d+(?:\.\d*)?)|\.\d+)(?:[eE][+-]?\d+)?$/
const MAX_SUPPORTED_PRECISION = 20

export function parseNumericString(raw: string): ParseResult | null {
    const trimmed = raw.trim()
    if (!trimmed || !NUMERIC_REGEX.test(trimmed)) {
        return null
    }

    const match = trimmed.match(/^([+-])?(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/)
    if (!match) return null

    const sign = match[1] === '-'
    let intPart = match[2] || (match[4] ? '0' : '')
    let fracPart = match[3] || match[4] || ''
    const exp = match[5] ? parseInt(match[5], 10) : 0

    if (exp !== 0) {
        if (exp > 0) {
            if (fracPart.length <= exp) {
                intPart = intPart + fracPart.padEnd(exp, '0')
                fracPart = ''
            } else {
                intPart = intPart + fracPart.slice(0, exp)
                fracPart = fracPart.slice(exp)
            }
        } else {
            const shift = -exp
            if (intPart.length <= shift) {
                fracPart = intPart.padStart(shift, '0') + fracPart
                intPart = '0'
            } else {
                fracPart = intPart.slice(intPart.length - shift) + fracPart
                intPart = intPart.slice(0, intPart.length - shift)
            }
        }
    }

    intPart = intPart.replace(/^0+(?=\d)/, '') || '0'

    return { isNegative: sign, intPart, fracPart }
}

export function parseNumeric(value: StatisticValue): ParseResult | null {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return null
        return parseNumericString(value.toString())
    }
    if (typeof value === 'bigint') {
        const isNegative = value < 0n
        const absVal = isNegative ? -value : value
        return { isNegative, intPart: absVal.toString(), fracPart: '' }
    }
    if (typeof value === 'string') {
        return parseNumericString(value)
    }
    return null
}

export function roundFraction(
    fractionStr: string,
    precision: number,
): { carry: bigint; fraction: string } {
    if (precision <= 0) {
        if (!fractionStr) return { carry: 0n, fraction: '' }
        const firstDigit = Number(fractionStr[0] ?? '0')
        return { carry: firstDigit >= 5 ? 1n : 0n, fraction: '' }
    }

    if (fractionStr.length <= precision) {
        return { carry: 0n, fraction: fractionStr.padEnd(precision, '0') }
    }

    const keepPart = fractionStr.slice(0, precision)
    const nextDigit = Number(fractionStr[precision] ?? '0')

    if (nextDigit < 5) {
        return { carry: 0n, fraction: keepPart }
    }

    const rounded = BigInt(keepPart) + 1n
    const roundedStr = rounded.toString().padStart(precision, '0')
    if (roundedStr.length > precision) {
        return { carry: 1n, fraction: '0'.repeat(precision) }
    }
    return { carry: 0n, fraction: roundedStr }
}

export function formatStatisticValue(
    value: StatisticValue,
    options: FormatNumberOptions = {},
): string {
    const {
        locale = 'zh-CN',
        precision,
        decimalSeparator,
        groupSeparator,
        placeholder = '-',
    } = options

    const parsed = parseNumeric(value)
    if (!parsed) {
        return placeholder
    }

    let { isNegative, intPart, fracPart } = parsed

    let fractionResult = ''
    if (precision !== undefined) {
        const safePrecision = Math.min(MAX_SUPPORTED_PRECISION, Math.max(0, Math.floor(precision)))
        const { carry, fraction } = roundFraction(fracPart, safePrecision)
        if (carry > 0n) {
            const newInt = BigInt(intPart) + carry
            intPart = newInt.toString()
        }
        fractionResult = fraction
    } else {
        fractionResult = fracPart
    }

    if (intPart === '0' && (!fractionResult || /^0+$/.test(fractionResult))) {
        isNegative = false
    }

    let nf: Intl.NumberFormat
    try {
        nf = new Intl.NumberFormat(locale, { useGrouping: true })
    } catch {
        nf = new Intl.NumberFormat('zh-CN', { useGrouping: true })
    }

    const bigIntValue = BigInt(intPart)
    const parts = nf.formatToParts(bigIntValue)

    let defaultDecimalSep = '.'
    try {
        const decimalParts = nf.formatToParts(1.1)
        const found = decimalParts.find((p) => p.type === 'decimal')
        if (found) defaultDecimalSep = found.value
    } catch {
        defaultDecimalSep = '.'
    }

    const activeDecimalSep = decimalSeparator !== undefined ? decimalSeparator : defaultDecimalSep

    let formattedInt = ''
    for (const part of parts) {
        if (part.type === 'group') {
            if (groupSeparator !== undefined) {
                formattedInt += groupSeparator
            } else {
                formattedInt += part.value
            }
        } else if (part.type === 'integer') {
            formattedInt += part.value
        }
    }

    if (isNegative) {
        let minusChar = '-'
        try {
            const minusParts = nf.formatToParts(-1n)
            const foundMinus = minusParts.find((p) => p.type === 'minusSign')
            if (foundMinus) minusChar = foundMinus.value
        } catch {
            minusChar = '-'
        }
        formattedInt = minusChar + formattedInt
    }

    if (fractionResult.length > 0) {
        return formattedInt + activeDecimalSep + fractionResult
    }
    return formattedInt
}
