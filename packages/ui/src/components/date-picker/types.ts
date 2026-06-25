import type { DateValueFormat } from '../../lib/date'

export type DatePickerMode = 'date' | 'week' | 'month' | 'year'
export type DatePickerSize = 'sm' | 'default' | 'lg'
export type DatePickerVariant = 'default' | 'error' | 'success'

export interface DatePickerShortcut {
    label: string
    value: Date | (() => Date)
}

export interface DatePickerProps {
    modelValue?: Date | null
    mode?: DatePickerMode
    displayFormat?: string
    valueFormat?: DateValueFormat
    placeholder?: string
    minDate?: Date
    maxDate?: Date
    disabled?: boolean
    readonly?: boolean
    clearable?: boolean
    size?: DatePickerSize
    variant?: DatePickerVariant
    shortcuts?: DatePickerShortcut[]
    name?: string
    id?: string
    ariaLabel?: string
    class?: string
}

export interface DatePickerEmits {
    'update:modelValue': [value: Date | null]
    change: [value: Date | null]
    open: []
    close: []
}

export function resolveShortcutValue(shortcut: DatePickerShortcut): Date {
    return typeof shortcut.value === 'function' ? shortcut.value() : shortcut.value
}

// ---- DatePickerRange ----

export type DateRange = [Date, Date]

export interface DatePickerRangeShortcut {
    label: string
    value: DateRange | (() => DateRange)
}

export interface DatePickerRangeProps {
    modelValue?: DateRange | null
    displayFormat?: string
    valueFormat?: DateValueFormat
    startPlaceholder?: string
    endPlaceholder?: string
    separator?: string
    minDate?: Date
    maxDate?: Date
    disabled?: boolean
    clearable?: boolean
    size?: DatePickerSize
    variant?: DatePickerVariant
    shortcuts?: DatePickerRangeShortcut[]
    name?: string
    id?: string
    ariaLabel?: string
    class?: string
}

export interface DatePickerRangeEmits {
    'update:modelValue': [value: DateRange | null]
    change: [value: DateRange | null]
    open: []
    close: []
}

export function resolveRangeShortcutValue(shortcut: DatePickerRangeShortcut): DateRange {
    return typeof shortcut.value === 'function' ? shortcut.value() : shortcut.value
}

// ---- DateTimePicker ----

export interface DateTimePickerProps {
    modelValue?: Date | null
    displayFormat?: string
    valueFormat?: DateValueFormat
    timeFormat?: string
    showSeconds?: boolean
    timeStep?: { hour?: number; minute?: number; second?: number }
    placeholder?: string
    minDate?: Date
    maxDate?: Date
    disabled?: boolean
    readonly?: boolean
    clearable?: boolean
    size?: DatePickerSize
    variant?: DatePickerVariant
    shortcuts?: DatePickerShortcut[]
    name?: string
    id?: string
    ariaLabel?: string
    class?: string
}

export interface DateTimePickerEmits {
    'update:modelValue': [value: Date | null]
    change: [value: Date | null]
    open: []
    close: []
}

// ---- WeekPicker ----

export interface WeekPickerProps {
    modelValue?: Date | null
    displayFormat?: string
    valueFormat?: DateValueFormat
    weekStartsOn?: 0 | 1
    placeholder?: string
    minDate?: Date
    maxDate?: Date
    disabled?: boolean
    readonly?: boolean
    clearable?: boolean
    size?: DatePickerSize
    variant?: DatePickerVariant
    shortcuts?: DatePickerShortcut[]
    name?: string
    id?: string
    ariaLabel?: string
    class?: string
}

export interface WeekPickerEmits {
    'update:modelValue': [value: Date | null]
    change: [value: Date | null]
    open: []
    close: []
}

// ---- MonthPicker ----

export interface MonthPickerProps {
    modelValue?: Date | null
    displayFormat?: string
    valueFormat?: DateValueFormat
    placeholder?: string
    minDate?: Date
    maxDate?: Date
    disabled?: boolean
    readonly?: boolean
    clearable?: boolean
    size?: DatePickerSize
    variant?: DatePickerVariant
    name?: string
    id?: string
    ariaLabel?: string
    class?: string
}

export interface MonthPickerEmits {
    'update:modelValue': [value: Date | null]
    change: [value: Date | null]
    open: []
    close: []
}

// ---- YearPicker ----

export interface YearPickerProps {
    modelValue?: Date | null
    displayFormat?: string
    valueFormat?: DateValueFormat
    placeholder?: string
    minDate?: Date
    maxDate?: Date
    disabled?: boolean
    readonly?: boolean
    clearable?: boolean
    size?: DatePickerSize
    variant?: DatePickerVariant
    name?: string
    id?: string
    ariaLabel?: string
    class?: string
}

export interface YearPickerEmits {
    'update:modelValue': [value: Date | null]
    change: [value: Date | null]
    open: []
    close: []
}
