<script setup lang="ts">
import { inject } from 'vue'
import { formFieldKey, formItemKey } from './form-context'

interface FormControlProps {
    class?: string
}

defineProps<FormControlProps>()

const fieldContext = inject(formFieldKey, { name: '', error: { value: undefined } as any })
const itemContext = inject(formItemKey, { id: '', formItemId: '', formDescriptionId: '', formMessageId: '' })
</script>

<template>
    <slot
        :id="itemContext.formItemId"
        :aria-describedby="!fieldContext.error?.value ? itemContext.formDescriptionId : `${itemContext.formDescriptionId} ${itemContext.formMessageId}`"
        :aria-invalid="!!fieldContext.error?.value"
    />
</template>
