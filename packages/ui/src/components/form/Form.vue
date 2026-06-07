<script setup lang="ts">
import { provide, computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { cn } from '../../lib/utils'
import { formContextKey } from './form-context'

interface FormProps {
    class?: string
    initialValues?: Record<string, unknown>
    validationSchema?: unknown
}

const props = defineProps<FormProps>()

const emit = defineEmits<{
    submit: [values: Record<string, unknown>]
}>()

const form = useForm({
    initialValues: props.initialValues,
    validationSchema: props.validationSchema,
})

const onSubmit = form.handleSubmit((values) => {
    emit('submit', values)
})

const rootClasses = computed(() => cn('', props.class))

watch(
    () => props.initialValues,
    (newValues) => {
        if (newValues && !form.meta.value.dirty) {
            form.resetForm({ values: newValues })
        }
    },
    { deep: true }
)

provide(formContextKey, form)
</script>

<template>
    <form :class="rootClasses" @submit="onSubmit">
        <slot />
    </form>
</template>
