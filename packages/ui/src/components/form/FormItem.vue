<script setup lang="ts">
import { computed, inject, provide, useId, type CSSProperties } from 'vue'
import { cn } from '@/lib/utils'
import { formContextKey, formItemKey } from './form-context'
import {
    formItemVariants,
    type FormLayoutPosition,
    type FormLayoutSize,
} from './form-variants'

interface FormItemProps {
    class?: string
}

const props = defineProps<FormItemProps>()

const id = useId()

const form = inject(formContextKey, null)

const layout = computed(() => form?.value)
const labelPosition = computed<FormLayoutPosition>(() => layout.value?.labelPosition ?? 'top')
const size = computed<FormLayoutSize>(() => layout.value?.size ?? 'default')

const labelWidthStyle = computed<CSSProperties | undefined>(() => {
    const width = layout.value?.labelWidth
    if (labelPosition.value === 'top' || width === undefined || width === '') return undefined
    const normalizedWidth = typeof width === 'number' ? `${width}px` : width
    return { gridTemplateColumns: `${normalizedWidth} minmax(0, 1fr)` }
})

const classes = computed(() =>
    cn(
        formItemVariants({ labelPosition: labelPosition.value, size: size.value }),
        props.class,
    )
)

provide(formItemKey, {
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
})

</script>

<template>
    <div :class="classes" :style="labelWidthStyle">
        <slot />
    </div>
</template>
