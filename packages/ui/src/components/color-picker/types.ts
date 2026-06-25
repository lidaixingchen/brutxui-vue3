import type { ColorPreset } from '../../lib/default-presets'

export type ColorPickerSize = 'sm' | 'default' | 'lg'
export type ColorPickerFormat = 'hex' | 'rgb' | 'hsl'

export interface ColorPickerProps {
    modelValue?: string | null
    format?: ColorPickerFormat
    showAlpha?: boolean
    presets?: string[] | ColorPreset[]
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
    class?: string
}

export interface ColorPickerEmits {
    'update:modelValue': [value: string | null]
    change: [value: string | null]
    open: []
    close: []
}

export function normalizePresets(presets: string[] | ColorPreset[] | undefined): ColorPreset[] {
    if (!presets || presets.length === 0) return []
    if (typeof presets[0] === 'string') {
        return (presets as string[]).map((value) => ({ label: value, value }))
    }
    return presets as ColorPreset[]
}
