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
