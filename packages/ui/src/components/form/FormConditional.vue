<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils'
import { formContextKey } from './form-context'

interface FormConditionalProps {
    /** 接收表单全量 values，返回是否展示；建议保持函数引用稳定（提取为具名函数），避免每次渲染触发重算 */
    when: (values: Record<string, unknown>) => boolean
    class?: string
}

const props = withDefaults(defineProps<FormConditionalProps>(), {
    class: undefined,
})

const form = inject(formContextKey)

if (!form) {
    console.warn('[BrutxUI FormConditional] Must be used inside a Form component.')
}

const shouldShow = computed(() => {
    if (!form) return false
    return props.when(form.value.values.value ?? {})
})

const classes = computed(() => cn(props.class))
</script>

<template>
    <div v-if="shouldShow" :class="classes">
        <slot />
    </div>
</template>
