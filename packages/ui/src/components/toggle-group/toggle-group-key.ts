import type { InjectionKey, ComputedRef } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import { toggleVariants } from '../toggle/toggle-variants'

type ToggleVariantProps = VariantProps<typeof toggleVariants>

export interface ToggleGroupContext {
    variant: ComputedRef<NonNullable<ToggleVariantProps['variant']> | undefined>
    size: ComputedRef<NonNullable<ToggleVariantProps['size']> | undefined>
    disabled: ComputedRef<boolean>
}

export const toggleGroupKey: InjectionKey<ToggleGroupContext> = Symbol('toggleGroup')
