<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import { Primitive } from 'reka-ui'
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
    <Primitive
        as-child
        :id="itemContext.formItemId || undefined"
        :class="rootClasses"
        :aria-describedby="!fieldContext.error.value ? (itemContext.formDescriptionId || undefined) : `${itemContext.formDescriptionId} ${itemContext.formMessageId}`"
        :aria-invalid="!!fieldContext.error.value || undefined"
    >
        <slot />
    </Primitive>
</template>
