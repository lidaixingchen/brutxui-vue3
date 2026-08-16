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
    // 空白归一化：空串/纯空白与 undefined 一视同仁（清错而非进入无文案错误态），
    // 与 FormMessage 的 trim 判空保持一致
    const normalized = message?.trim()
    setErrors(normalized ? [normalized] : [])
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
