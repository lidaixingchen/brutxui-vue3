<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import { cn } from '@/lib/utils'
import { formFieldKey, formItemKey } from './form-context'

interface FormControlProps {
    class?: string
}

const props = defineProps<FormControlProps>()

const rootClasses = computed(() => cn(props.class))

const fieldContext = inject(formFieldKey, {
    name: computed(() => ''),
    error: ref<string | undefined>(undefined),
    value: ref<unknown>(undefined),
    setValue: () => {},
    setError: () => {},
})
const itemContext = inject(formItemKey, { id: '', formItemId: '', formDescriptionId: '', formMessageId: '' })
</script>

<template>
    <slot
        :id="itemContext.formItemId"
        :class="rootClasses"
        :aria-describedby="!fieldContext.error.value ? itemContext.formDescriptionId : `${itemContext.formDescriptionId} ${itemContext.formMessageId}`"
        :aria-invalid="!!fieldContext.error.value"
    />
</template>
