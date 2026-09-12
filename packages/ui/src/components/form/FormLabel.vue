<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { cn } from '@/lib/utils'
import LabelRoot from '../label/Label.vue'
import { formContextKey, formFieldKey, formItemKey } from './form-context'
import { formLabelVariants, type FormLayoutPosition, type FormLayoutSize } from './form-variants'

interface FormLabelProps {
    class?: string
}

const props = defineProps<FormLabelProps>()

const defaultFieldContext = {
    name: ref(''),
    error: ref<string | undefined>(undefined),
    value: ref<unknown>(undefined),
    setValue: () => {},
    setError: () => {},
}
const defaultItemContext = { formItemId: '', formDescriptionId: '', formMessageId: '' }

const fieldContext = inject(formFieldKey, defaultFieldContext)
const itemContext = inject(formItemKey, defaultItemContext)
const form = inject(formContextKey, null)

const layout = computed(() => form?.value)
const labelPosition = computed<FormLayoutPosition>(() => layout.value?.labelPosition ?? 'top')
const labelSize = computed<FormLayoutSize>(() => layout.value?.size ?? 'default')

if (fieldContext === defaultFieldContext || itemContext === defaultItemContext) {
    console.warn('[BrutxUI FormLabel] Must be used inside FormItem/FormField components.')
}

const classes = computed(() =>
    cn(
        fieldContext.error.value?.trim() && 'text-brutal-destructive',
        formLabelVariants({ labelPosition: labelPosition.value }),
        props.class,
    )
)
</script>

<template>
    <LabelRoot
        :class="classes"
        :size="labelSize"
        :for="itemContext.formItemId || undefined"
    >
        <slot />
    </LabelRoot>
</template>
