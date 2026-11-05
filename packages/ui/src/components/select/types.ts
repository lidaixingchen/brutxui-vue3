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
    /** 关联名称元素的 ID，优先于显式无障碍名称。 */
    ariaLabelledby?: string
    /** 显式无障碍名称；未设置时使用关联的 Label 或触发器内容。 */
    ariaLabel?: string
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
