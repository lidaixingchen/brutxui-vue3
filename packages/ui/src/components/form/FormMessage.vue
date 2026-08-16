<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { cn } from '@/lib/utils'
import { formFieldKey, formItemKey } from './form-context'

interface FormMessageProps {
    class?: string
}

const props = defineProps<FormMessageProps>()

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
    console.warn('[BrutxUI FormMessage] Must be used inside FormItem/FormField components.')
}

const body = computed(() => fieldContext.error.value?.trim())

const classes = computed(() =>
    cn('text-sm font-black text-brutal-destructive', props.class)
)
</script>

<template>
    <p v-if="body" :id="itemContext.formMessageId || undefined" role="alert" :class="classes">
        {{ body }}
    </p>
</template>
