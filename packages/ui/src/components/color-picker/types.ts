import type { ColorPreset } from '@/lib/default-presets'
import type { ClassValue } from 'clsx'

export type ColorPickerSize = 'sm' | 'default' | 'lg'
export type ColorPickerFormat = 'hex' | 'rgb' | 'hsl'

export interface ColorPickerProps {
    modelValue?: string | null
    format?: ColorPickerFormat
    showAlpha?: boolean
    presets?: string[] | readonly ColorPreset[]
    showPresets?: boolean
    presetsLabel?: string
    showHistory?: boolean
    historyMax?: number
    historyStorageKey?: string
    showInput?: boolean
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    size?: ColorPickerSize
    name?: string
    id?: string
    ariaLabel?: string
    // 放宽为 ClassValue：Vue 中 class 是特殊 prop，声明后不再自动透传，
    // 组件内部手动绑定到根元素（triggerClasses）；ClassValue 支持数组/对象绑定
    class?: ClassValue
}

export interface ColorPickerEmits {
    'update:modelValue': [value: string | null]
    change: [value: string | null]
    open: []
    close: []
}

export function normalizePresets(presets: string[] | readonly ColorPreset[] | undefined): readonly ColorPreset[] {
    if (!presets || presets.length === 0) return []
    // 逐元素归一化：允许混合数组（部分 string、部分 ColorPreset），
    // 不依赖首元素类型做整体分支判断，避免 `as string[]` 危险断言导致
    // 对象被 map 成 '[object Object]' 或字符串原样混入结果
    return presets.map((item) => (typeof item === 'string' ? { label: item, value: item } : item))
}
