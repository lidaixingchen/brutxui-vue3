<script setup lang="ts">
import { provide, toRef } from 'vue'
import { useField } from 'vee-validate'
import { formFieldKey } from './form-context'

interface FormFieldProps {
    /** 字段名，生命周期内不可变（变更需手动清理旧字段的 value/error 残留） */
    name: string
}

const props = defineProps<FormFieldProps>()

const fieldName = toRef(props, 'name')
const { errorMessage, value, setValue, setErrors } = useField(fieldName)

function setError(message: string | undefined) {
    setErrors(message ? [message] : [])
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
