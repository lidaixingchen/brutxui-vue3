<script setup lang="ts">
import { computed, inject, provide, toRef, unref } from 'vue'
import { useField } from 'vee-validate'
import { formFieldKey, formSchemaValidationKey } from './form-context'

interface FormFieldProps {
    /** 字段名，生命周期内不可变（变更需手动清理旧字段的 value/error 残留） */
    name: string
}

const props = defineProps<FormFieldProps>()

const fieldName = toRef(props, 'name')
const field = useField(fieldName)
const schemaForm = inject(formSchemaValidationKey)

// Schema 校验统一由表单写入结果，和整表校验及重置共享同一校验时序。
function setValue(value: unknown, shouldValidate = true) {
    if (schemaForm) {
        schemaForm.setFieldValue(unref(field.name), value, shouldValidate)
    } else {
        field.setValue(value, shouldValidate)
    }
}

const handleFocusout: (event: FocusEvent) => void = (event) => {
    if (schemaForm) {
        const name = unref(field.name)
        schemaForm.setFieldTouched(name, true)
        return schemaForm.validateField(name)
    }
    return field.handleBlur(event, true)
}

const value = computed({
    get: () => field.value.value,
    set: setValue,
})

const componentField = computed(() => ({
    name: fieldName.value,
    modelValue: value.value,
    'onUpdate:modelValue': schemaForm ? setValue : field.handleChange,
    onFocusout: handleFocusout,
}))

function setError(message: string | undefined) {
    // 空白归一化：空串/纯空白与 undefined 一视同仁（清错而非进入无文案错误态），
    // 与 FormMessage 的 trim 判空保持一致
    const normalized = message?.trim()
    field.setErrors(normalized ? [normalized] : [])
}

provide(formFieldKey, {
    name: fieldName,
    error: field.errorMessage,
    value,
    setValue,
    setError,
})
</script>

<template>
    <slot :component-field="componentField" />
</template>
