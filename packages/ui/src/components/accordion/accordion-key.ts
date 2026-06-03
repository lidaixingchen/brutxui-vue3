import type { InjectionKey, Ref } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import { accordionItemVariants } from './accordion-variants'

type AccordionItemVariantProps = VariantProps<typeof accordionItemVariants>

export const accordionItemKey: InjectionKey<{
    variant: Ref<NonNullable<AccordionItemVariantProps['variant']> | undefined>
}> = Symbol('accordionItem')
