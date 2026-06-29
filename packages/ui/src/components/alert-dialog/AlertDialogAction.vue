<script setup lang="ts">
import { computed } from 'vue'
import { AlertDialogAction as AlertDialogActionPrimitive, type PrimitiveProps, useForwardProps } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { buttonVariants } from '../button/button-variants'

type ButtonVariantProps = VariantProps<typeof buttonVariants>

interface AlertDialogActionProps extends PrimitiveProps {
    variant?: NonNullable<ButtonVariantProps['variant']>
    class?: string
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
