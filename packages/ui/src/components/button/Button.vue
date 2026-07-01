<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from '@lucide/vue'
import { Primitive } from 'reka-ui'
import { buttonVariants } from './button-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

type ButtonVariantProps = VariantProps<typeof buttonVariants>

interface ButtonProps {
    variant?: NonNullable<ButtonVariantProps['variant']>
    size?: NonNullable<ButtonVariantProps['size']>
    asChild?: boolean
    type?: 'button' | 'submit' | 'reset'
    loading?: boolean
    disabled?: boolean
    /** 加载中显示的等待文本，仅在 `type="submit"` 且 `loading` 时生效；未传入时回退到 i18n 默认值 */
    pendingText?: string
    /** 按钮是否处于按下状态（切换按钮） */
    pressed?: boolean
    /** 按钮控制的内容是否展开 */
    expanded?: boolean
    class?: string
}

const props = withDefaults(defineProps<ButtonProps>(), {
    variant: 'default',
    size: 'default',
    asChild: false,
    type: undefined,
    loading: false,
    disabled: false,
    pendingText: undefined,
    pressed: undefined,
    expanded: undefined,
    class: undefined,
})

const { t } = useLocale()

const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() =>
    cn(
        buttonVariants({ variant: props.variant, size: props.size }),
        props.asChild && isDisabled.value && 'pointer-events-none',
        props.class,
    )
)

const BUTTON_SIZE_TO_ICON: Record<NonNullable<ButtonVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'default',
    lg: 'lg',
    xl: 'xl',
    icon: 'default',
}

const loaderClasses = computed(() =>
    cn(iconSizeVariants({ size: BUTTON_SIZE_TO_ICON[props.size] }), 'animate-spin')
)

const resolvedPendingText = computed(() => props.pendingText ?? t('submitButton.submitting'))

const showPendingText = computed(() =>
    props.type === 'submit' && props.loading && !!resolvedPendingText.value
)
</script>

<template>
    <Primitive
        :as="asChild ? undefined : 'button'"
        :as-child="asChild"
        :class="classes"
        :type="type"
        :disabled="!asChild && isDisabled"
        :aria-disabled="asChild && isDisabled ? true : undefined"
        :aria-busy="loading || undefined"
        :aria-pressed="pressed"
        :aria-expanded="expanded"
    >
        <Loader2 v-if="loading" :class="loaderClasses" />
        <template v-if="showPendingText">
            {{ resolvedPendingText }}
        </template>
        <slot v-else />
    </Primitive>
</template>
