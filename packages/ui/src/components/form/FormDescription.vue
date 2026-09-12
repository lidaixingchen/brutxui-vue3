<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils'
import { formContextKey, formItemKey } from './form-context'
import {
    formDescriptionVariants,
    type FormLayoutPosition,
    type FormLayoutSize,
} from './form-variants'

interface FormDescriptionProps {
    class?: string
}

const props = defineProps<FormDescriptionProps>()

const defaultItemContext = { formItemId: '', formDescriptionId: '', formMessageId: '' }

const itemContext = inject(formItemKey, defaultItemContext)
const form = inject(formContextKey, null)
const layout = computed(() => form?.value)
const labelPosition = computed<FormLayoutPosition>(() => layout.value?.labelPosition ?? 'top')
const size = computed<FormLayoutSize>(() => layout.value?.size ?? 'default')

if (itemContext === defaultItemContext) {
    console.warn('[BrutxUI FormDescription] Must be used inside a FormItem component.')
}

const classes = computed(() =>
    cn(
        formDescriptionVariants({ labelPosition: labelPosition.value, size: size.value }),
        props.class,
    )
)
</script>

<template>
    <p v-if="$slots.default" :id="itemContext.formDescriptionId || undefined" :class="classes">
        <slot />
    </p>
</template>
