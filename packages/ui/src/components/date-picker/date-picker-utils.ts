import type { DatePickerShortcut, DatePickerRangeShortcut, DateRange } from './types'

export function resolveShortcutValue(shortcut: DatePickerShortcut): Date {
    const value = typeof shortcut.value === 'function' ? shortcut.value() : shortcut.value
    // 克隆：避免消费端（emit/比较）与快捷项定义共享同一实例，原地修改污染定义
    return new Date(value.getTime())
}

export function resolveRangeShortcutValue(shortcut: DatePickerRangeShortcut): DateRange {
    const value = typeof shortcut.value === 'function' ? shortcut.value() : shortcut.value
    // 克隆：避免消费端（emit/比较）与快捷项定义共享同一实例，原地修改污染定义
    return [new Date(value[0].getTime()), new Date(value[1].getTime())]
}

export function isDateWithinBounds(value: Date, minDate?: Date, maxDate?: Date): boolean {
    const valueTime = new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
    const minTime = minDate
        ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime()
        : -Infinity
    const maxTime = maxDate
        ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()).getTime()
        : Infinity
    return !(valueTime < minTime || valueTime > maxTime)
}
