<script setup lang="ts">
import { computed, type ButtonHTMLAttributes } from 'vue'
import type { ClassValue } from 'clsx'
import { AlertDialogAction as AlertDialogActionPrimitive, type PrimitiveProps, useForwardProps } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { buttonVariants } from '../button/button-variants'

type ButtonVariantProps = VariantProps<typeof buttonVariants>

// HTMLButtonAttributes 补全原生 button 属性（type/disabled/name/form/aria-* 等）的类型面，
// 与运行时「除 class/variant 外全透传」的转发行为保持一致；@vue-ignore 抑制 Vue 编译器对全局属性扩展的展开告警。
interface AlertDialogActionProps extends PrimitiveProps, /* @vue-ignore */ Omit<ButtonHTMLAttributes, 'class'> {
    variant?: NonNullable<ButtonVariantProps['variant']>
    class?: ClassValue
}

const props = withDefaults(defineProps<AlertDialogActionProps>(), {
    variant: 'default',
    as: undefined,
    asChild: undefined,
    class: undefined,
})

const delegatedProps = computed(() => {
    const { class: _, variant: __, ...delegated } = props
    return delegated
})

const forwardedProps = useForwardProps(delegatedProps)

const classes = computed(() =>
    cn(buttonVariants({ variant: props.variant }), props.class)
)
</script>

<template>
    <AlertDialogActionPrimitive v-bind="forwardedProps" :class="classes">
        <slot />
    </AlertDialogActionPrimitive>
</template>
