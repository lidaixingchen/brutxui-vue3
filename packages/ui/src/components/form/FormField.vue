<script setup lang="ts">
import { provide, computed } from 'vue'
import { useField } from 'vee-validate'
import { formFieldKey } from './form-context'

interface FormFieldProps {
    name: string
}

const props = defineProps<FormFieldProps>()

const fieldName = computed(() => props.name)
const { errorMessage, value, setValue, setErrors } = useField(fieldName)

function setError(message: string | undefined) {
    setErrors(message === undefined ? [] : message)
}

provide(formFieldKey, {
    name: fieldName,
    error: errorMessage,
    value,
    setValue,
    setError,
})
</script>

<template>
    <slot />
</template>
