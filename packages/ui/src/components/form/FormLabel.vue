<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { cn } from '@/lib/utils'
import LabelRoot from '../label/Label.vue'
import { formFieldKey, formItemKey } from './form-context'

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

if (fieldContext === defaultFieldContext || itemContext === defaultItemContext) {
    console.warn('[BrutxUI FormLabel] Must be used inside FormItem/FormField components.')
}

const classes = computed(() =>
    cn(
        fieldContext.error.value?.trim() && 'text-brutal-destructive',
        props.class
    )
)
</script>

<template>
    <LabelRoot :class="classes" :for="itemContext.formItemId || undefined">
        <slot />
    </LabelRoot>
</template>
