export interface SelectOption {
    label: string
    value: string
    disabled?: boolean
    [key: string]: unknown
}

export interface SelectProps {
    options?: SelectOption[]
    groupField?: string
    groupLabel?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    name?: string
    id?: string
    size?: 'sm' | 'default' | 'lg'
    variant?: 'default' | 'error' | 'success'
    errorMessage?: string
    clearable?: boolean
    position?: 'popper' | 'item-aligned'
    class?: string
    triggerClass?: string
    contentClass?: string
    itemVariant?: 'default' | 'primary' | 'secondary'
}
