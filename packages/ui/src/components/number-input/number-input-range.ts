type NumberInputRange = {
    min?: number
    max?: number
    step: number
    snap: boolean
}

function decimalPlaces(value: number) {
    const [mantissa = '', exponent = '0'] = String(value).split('e')
    const fraction = mantissa.split('.')[1] ?? ''
    return Math.max(0, fraction.length - Number(exponent))
}

function roundArithmetic(value: number, ...operands: number[]) {
    // toFixed 接受的最大精度为 100，极小数保留浮点计算结果。
    const precision = Math.max(...operands.map(decimalPlaces))
    return precision <= 100 ? Number(value.toFixed(precision)) : value
}

export function clampNumber(value: number, { min = -Infinity, max = Infinity }: Pick<NumberInputRange, 'min' | 'max'>) {
    return Math.min(max, Math.max(min, value))
}

export function getBoundedNumber(value: number, range: NumberInputRange) {
    const { min, max, step, snap } = range
    const bounded = clampNumber(value, range)
    if (!snap || step <= 0 || !Number.isFinite(step)) return bounded

    const anchor = min ?? 0
    const offset = roundArithmetic(bounded - anchor, bounded, anchor)
    const nearest = Math.sign(offset) * Math.round(Math.abs(offset) / step)
    const snapped = roundArithmetic(anchor + nearest * step, anchor, step)
    if (max !== undefined && snapped > max) return clampNumber(roundArithmetic(snapped - step, anchor, step), range)
    return clampNumber(snapped, range)
}

export function getSteppedNumber(value: number | null | undefined, multiplier: number, range: NumberInputRange) {
    if (value == null || Number.isNaN(value)) return clampNumber(range.min ?? 0, range)
    const offset = range.step * multiplier
    return getBoundedNumber(roundArithmetic(value + offset, value, range.step), range)
}
