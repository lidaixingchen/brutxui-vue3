<script setup lang="ts">
import { provide, computed, ref, watch, onBeforeUnmount } from 'vue'
import { useForm } from 'vee-validate'
import { cn } from '@/lib/utils'
import { formContextKey, formSchemaValidationKey } from './form-context'

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

let invalidateValidation: (() => void) | undefined

function beginValidation() {
    invalidateValidation?.()

    function finish() {
        if (invalidateValidation !== finish) return
        invalidateValidation = undefined
        stopWatchingValues()
    }

    // 仅在校验等待期间观察值的变动，首次变动立即使本次校验失效。
    const stopWatchingValues = watch(form.values, finish, { deep: true, flush: 'sync' })
    invalidateValidation = finish

    return {
        isCurrent: () => invalidateValidation === finish,
        finish,
    }
}

onBeforeUnmount(() => invalidateValidation?.())
watch(validationSchema, () => invalidateValidation?.(), { flush: 'sync' })

async function onSubmit(event: Event) {
    const attempt = beginValidation()
    try {
        await form.handleSubmit((values) => {
            if (attempt.isCurrent()) emit('submit', values)
        })(event)
    } finally {
        attempt.finish()
    }
}

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
    invalidateValidation?.()
    form.resetForm()
}

// 清除验证状态
function clearValidate(fields?: string[]) {
    for (const field of fields?.length ? fields : Object.keys(form.errors.value)) {
        form.setFieldError(field, undefined)
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
    // 同名单选组等场景返回 RadioNodeList，需取第一个元素；
    // typeof 防御非浏览器环境（单测）中 RadioNodeList 全局不存在时 instanceof 抛错
    const namedItem = formRef.value.elements.namedItem(field)
    const fieldElement =
        typeof RadioNodeList !== 'undefined' && namedItem instanceof RadioNodeList
            ? (namedItem[0] as Element | undefined) ?? null
            : (namedItem as Element | null)
    if (!fieldElement) return

    fieldElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
    })
}

// 验证整个表单
async function validate(): Promise<boolean> {
    const attempt = beginValidation()
    try {
        const { valid, errors } = await form.validate()
        if (attempt.isCurrent() && !valid && props.scrollToError) {
            const firstErrorField = Object.keys(errors).find(field => form.errors.value[field])
            if (firstErrorField) scrollToField(firstErrorField)
        }
        return valid
    } finally {
        attempt.finish()
    }
}

// 引用级监听 initialValues：deep 监听会在父组件传入同值新对象或大对象逐字段变化时
// 无谓地重置表单并清空错误状态；引用不变（或表单已 dirty）时不重置
watch(
    () => props.initialValues,
    (newValues) => {
        if (newValues && !form.meta.value.dirty) {
            invalidateValidation?.()
            form.resetForm({ values: newValues })
        }
    },
)

provide(formContextKey, formContext)
provide(formSchemaValidationKey, validationSchema.value ? form : undefined)

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
