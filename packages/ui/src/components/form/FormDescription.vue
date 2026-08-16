<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils'
import { formItemKey } from './form-context'

interface FormDescriptionProps {
    class?: string
}

const props = defineProps<FormDescriptionProps>()

const defaultItemContext = { formItemId: '', formDescriptionId: '', formMessageId: '' }

const itemContext = inject(formItemKey, defaultItemContext)

if (itemContext === defaultItemContext) {
    console.warn('[BrutxUI FormDescription] Must be used inside a FormItem component.')
}

const classes = computed(() =>
    cn('text-sm text-brutal-muted-foreground font-medium', props.class)
)
</script>

<template>
    <p v-if="$slots.default" :id="itemContext.formDescriptionId || undefined" :class="classes">
        <slot />
    </p>
</template>
