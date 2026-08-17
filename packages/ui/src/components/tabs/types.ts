import type { InjectionKey, ComputedRef } from 'vue'

export interface TabItem {
    label: string
    value: string
    disabled?: boolean
}

export const TABS_ORIENTATION_KEY: InjectionKey<ComputedRef<'horizontal' | 'vertical'>> =
    Symbol('brutx-tabs-orientation')
