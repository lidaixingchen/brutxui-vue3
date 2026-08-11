import type { InjectionKey, Ref } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import type { accordionItemVariants } from './accordion-variants'

type AccordionItemVariantProps = VariantProps<typeof accordionItemVariants>

// NonNullable 刻意剔除 cva 派生类型中的 null（VariantProps 的 variant 属性可空为 null），
// 注入契约只接受显式的 undefined，与 AccordionItem 的 prop 声明保持同一可空语义。
export interface AccordionItemVariantContext {
    variant: Ref<NonNullable<AccordionItemVariantProps['variant']> | undefined>
}

export const accordionItemKey: InjectionKey<AccordionItemVariantContext> = Symbol('accordionItem')
