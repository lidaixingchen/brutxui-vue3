export type CascaderValue = string | number

export interface CascaderOption {
    value: CascaderValue
    label: string
    children?: CascaderOption[]
    disabled?: boolean
    data?: unknown
}
