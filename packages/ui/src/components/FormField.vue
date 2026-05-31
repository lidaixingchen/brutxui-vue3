<script setup lang="ts">
import { provide } from 'vue'
import { useField } from 'vee-validate'
import { formFieldKey } from './form-context'

interface FormFieldProps {
    name: string
}

const props = defineProps<FormFieldProps>()

const { errorMessage } = useField(() => props.name)

provide(formFieldKey, {
    name: props.name,
    error: errorMessage,
})
</script>

<template>
    <slot />
</template>
