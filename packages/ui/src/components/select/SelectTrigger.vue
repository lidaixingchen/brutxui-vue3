<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { SelectTrigger as SelectTriggerPrimitive, SelectIcon as SelectIconPrimitive } from 'reka-ui'
import { ChevronDown, X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { selectTriggerVariants } from './select-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useClearable } from '@/composables/useClearable'

type SelectTriggerVariantProps = VariantProps<typeof selectTriggerVariants>

interface SelectTriggerProps {
    size?: NonNullable<SelectTriggerVariantProps['size']>
    variant?: NonNullable<SelectTriggerVariantProps['variant']>
    errorMessage?: string
    disabled?: boolean
    /** 是否可清除 */
    clearable?: boolean
    /** 当前选中的值 */
    modelValue?: string | number | null | undefined
    class?: string
    iconClass?: string
}

const props = withDefaults(defineProps<SelectTriggerProps>(), {
    size: 'default',
    variant: 'default',
    errorMessage: undefined,
    disabled: false,
    clearable: false,
    modelValue: undefined,
    class: undefined,
    iconClass: undefined,
})

const emit = defineEmits<{
    clear: []
}>()

const SIZE_TO_ICON: Record<NonNullable<SelectTriggerVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'default',
    lg: 'lg',
}

// 使用 useClearable composable
const { showClear, handleClear: handleClearEvent, onMouseEnter, onMouseLeave } = useClearable({
    modelValue: () => props.modelValue,
    clearable: () => props.clearable,
    disabled: () => props.disabled,
    onClear: () => {
        emit('clear')
    },
})

const classes = computed(() =>
    cn(selectTriggerVariants({ size: props.size, variant: props.variant }), props.class)
)

const iconClasses = computed(() =>
    cn(
        iconSizeVariants({ size: SIZE_TO_ICON[props.size] }),
        'stroke-[3]',
        props.iconClass,
    )
)

function handleClear(e: MouseEvent) {
    handleClearEvent(e)
}
</script>

<template>
    <div
        class="w-full"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
    >
        <SelectTriggerPrimitive :class="classes" :disabled="disabled" aria-haspopup="listbox">
            <slot />
            <SelectIconPrimitive as-child>
                <div class="flex items-center gap-1">
                    <!-- 清除按钮 -->
                    <button
                        v-if="showClear"
                        type="button"
                        class="p-0.5 hover:bg-brutal-muted rounded-sm transition-colors"
                        @click.stop="handleClear"
                    >
                        <X :class="cn(iconSizeVariants({ size: 'sm' }), 'stroke-3')" />
                    </button>
                    <ChevronDown v-else :class="iconClasses" />
                </div>
            </SelectIconPrimitive>
        </SelectTriggerPrimitive>
        <p
            v-if="variant === 'error' && errorMessage"
            class="text-sm text-brutal-destructive mt-1"
            role="alert"
        >
            {{ errorMessage }}
        </p>
    </div>
</template>
