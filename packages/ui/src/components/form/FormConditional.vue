<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '../../lib/utils'
import { formContextKey } from './form-context'

interface FormConditionalProps {
    when: (values: Record<string, unknown>) => boolean
    class?: string
}

const props = withDefaults(defineProps<FormConditionalProps>(), {
    class: undefined,
})

const form = inject(formContextKey)

const shouldShow = computed(() => {
    if (!form) return false
    try {
        return props.when(form.values.value)
    } catch (e) {
        console.warn('[BrutxUI] FormConditional: Error in when callback:', e)
        return false
    }
})

const classes = computed(() => cn('', props.class))
</script>

<template>
    <div v-show="shouldShow" :class="classes">
        <slot />
    </div>
</template>
