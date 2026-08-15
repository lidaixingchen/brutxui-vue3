export type DatePickerSize = 'sm' | 'default' | 'lg'
export type DatePickerVariant = 'default' | 'error' | 'success'

/** 六个 Picker 共享的基础字段（避免接口间字段漂移） */
export interface DatePickerBaseProps {
    displayFormat?: string
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

export interface DatePickerShortcut {
    label: string
    value: Date | (() => Date)
}

export interface DatePickerProps extends DatePickerBaseProps {
    modelValue?: Date | null
    placeholder?: string
    shortcuts?: DatePickerShortcut[]
}

export interface DatePickerEmits {
    'update:modelValue': [value: Date | null]
    change: [value: Date | null]
    open: []
    close: []
}

// ---- DatePickerRange ----

export type DateRange = readonly [Date, Date]

export interface DatePickerRangeShortcut {
    label: string
    value: DateRange | (() => DateRange)
}

export interface DatePickerRangeProps extends DatePickerBaseProps {
    modelValue?: DateRange | null
    startPlaceholder?: string
    endPlaceholder?: string
    separator?: string
    shortcuts?: DatePickerRangeShortcut[]
}

export interface DatePickerRangeEmits {
    'update:modelValue': [value: DateRange | null]
    change: [value: DateRange | null]
    open: []
    close: []
}

// ---- DateTimePicker ----

export interface DateTimePickerProps extends DatePickerBaseProps {
    modelValue?: Date | null
    showSeconds?: boolean
    timeStep?: { hour?: number; minute?: number; second?: number }
    placeholder?: string
    shortcuts?: DatePickerShortcut[]
}

export interface DateTimePickerEmits {
    'update:modelValue': [value: Date | null]
    change: [value: Date | null]
    open: []
    close: []
}

// ---- WeekPicker ----

export interface WeekPickerProps extends DatePickerBaseProps {
    modelValue?: Date | null
    weekStartsOn?: 0 | 1
    placeholder?: string
    shortcuts?: DatePickerShortcut[]
}

export interface WeekPickerEmits {
    'update:modelValue': [value: Date | null]
    change: [value: Date | null]
    open: []
    close: []
}

// ---- MonthPicker ----

export interface MonthPickerProps extends DatePickerBaseProps {
    modelValue?: Date | null
    placeholder?: string
}

export interface MonthPickerEmits {
    'update:modelValue': [value: Date | null]
    change: [value: Date | null]
    open: []
    close: []
}

// ---- YearPicker ----

export interface YearPickerProps extends DatePickerBaseProps {
    modelValue?: Date | null
    placeholder?: string
}

export interface YearPickerEmits {
    'update:modelValue': [value: Date | null]
    change: [value: Date | null]
    open: []
    close: []
}
