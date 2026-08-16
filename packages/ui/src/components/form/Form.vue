<script setup lang="ts">
import { provide, computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { cn } from '@/lib/utils'
import { formContextKey } from './form-context'

interface FormProps {
    /** 行内表单布局 */
    inline?: boolean
    /** 标签位置 */
    labelPosition?: 'left' | 'right' | 'top'
    /** 标签宽度 */
    labelWidth?: string | number
    /** 验证失败时滚动到错误字段 */
    scrollToError?: boolean
    /** 统一尺寸 */
    size?: 'sm' | 'default' | 'lg'
    class?: string
    initialValues?: Record<string, unknown>
    validationSchema?: unknown
}

const props = withDefaults(defineProps<FormProps>(), {
    inline: false,
    labelPosition: 'right',
    labelWidth: undefined,
    scrollToError: false,
    size: 'default',
    class: undefined,
    initialValues: undefined,
    validationSchema: undefined,
})

const emit = defineEmits<{
    submit: [values: Record<string, unknown>]
}>()

const formRef = ref<HTMLFormElement | null>(null)
const validationSchema = computed(() => props.validationSchema)

const form = useForm({
    initialValues: props.initialValues,
    validationSchema,
})

const onSubmit = form.handleSubmit((values) => {
    emit('submit', values)
})

// 计算表单根类名
const rootClasses = computed(() =>
    cn(
        props.inline && 'flex flex-wrap items-start gap-x-4 gap-y-2',
        props.class,
    )
)

// 提供给子组件的上下文
const formContext = computed(() => ({
    ...form,
    inline: props.inline,
    labelPosition: props.labelPosition,
    labelWidth: props.labelWidth,
    size: props.size,
}))

// 重置表单字段
function resetFields() {
    form.resetForm()
}

// 清除验证状态
function clearValidate(fields?: string[]) {
    if (fields?.length) {
        fields.forEach(field => {
            form.setFieldError(field, undefined)
        })
    } else {
        // 无参数或空数组时仅清除全部错误，
        // 避免 resetForm 把表单值一并重置为挂载时捕获的 initialValues
        form.setErrors({})
    }
}

// 验证单个字段
async function validateField(field: string): Promise<boolean> {
    const { valid } = await form.validateField(field)
    return valid
}

// 滚动到指定字段
function scrollToField(field: string) {
    if (!formRef.value) return

    // 用 namedItem 按 name 精确获取控件，避免字段名拼入 CSS 选择器时注入/解析失败；
    // 同名单选组等场景返回 RadioNodeList，需取第一个元素
    const namedItem = formRef.value.elements.namedItem(field)
    const fieldElement = namedItem instanceof RadioNodeList ? namedItem[0] : namedItem
    if (!fieldElement) return

    fieldElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
    })
}

// 验证整个表单
async function validate(): Promise<boolean> {
    const { valid, errors } = await form.validate()

    // 滚动到第一个错误字段
    if (!valid && props.scrollToError) {
        const firstErrorField = Object.keys(errors)[0]
        if (firstErrorField) {
            scrollToField(firstErrorField)
        }
    }

    return valid
}

// 引用级监听 initialValues：deep 监听会在父组件传入同值新对象或大对象逐字段变化时
// 无谓地重置表单并清空错误状态；引用不变（或表单已 dirty）时不重置
watch(
    () => props.initialValues,
    (newValues) => {
        if (newValues && !form.meta.value.dirty) {
            form.resetForm({ values: newValues })
        }
    },
)

provide(formContextKey, formContext)

defineExpose({
    validate,
    validateField,
    resetFields,
    clearValidate,
    scrollToField,
})
</script>

<template>
    <form
        ref="formRef"
        :class="rootClasses"
        @submit="onSubmit"
    >
        <slot />
    </form>
</template>
