<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { formFieldKey, formItemKey } from './form-context'

interface FormControlProps {
    class?: string
}

const props = defineProps<FormControlProps>()

const rootClasses = computed(() => cn(props.class))

const defaultFieldContext = {
    name: ref(''),
    error: ref<string | undefined>(undefined),
    value: ref<unknown>(undefined),
    setValue: () => {},
    setError: () => {},
}
const defaultItemContext = { formItemId: '', formDescriptionId: '', formMessageId: '' }

const fieldContext = inject(formFieldKey, defaultFieldContext)
const itemContext = inject(formItemKey, defaultItemContext)

if (fieldContext === defaultFieldContext || itemContext === defaultItemContext) {
    console.warn('[BrutxUI FormControl] Must be used inside FormItem/FormField components.')
}

// 组装 aria-describedby，过滤空 id，避免无上下文时拼出无效空白值
const describedBy = computed(() => {
    const ids = fieldContext.error.value
        ? [itemContext.formDescriptionId, itemContext.formMessageId]
        : [itemContext.formDescriptionId]
    return ids.filter(Boolean).join(' ') || undefined
})
</script>

<template>
    <!-- 注意：as-child 模式下默认插槽必须有且仅有一个根节点，否则属性合并失效 -->
    <Primitive
        :id="itemContext.formItemId || undefined"
        as-child
        :class="rootClasses"
        :aria-describedby="describedBy"
        :aria-invalid="!!fieldContext.error.value || undefined"
    >
        <slot />
    </Primitive>
</template>
