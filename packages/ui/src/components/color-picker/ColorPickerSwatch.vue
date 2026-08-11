<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { isValidColor } from '@/lib/color'
import { colorPickerSwatchVariants } from './color-picker-variants'

type SwatchVariantProps = VariantProps<typeof colorPickerSwatchVariants>

interface ColorPickerSwatchProps {
    value: string
    label?: string
    selected?: boolean
    disabled?: boolean
    size?: NonNullable<SwatchVariantProps['size']>
    ariaLabel?: string
}

const props = withDefaults(defineProps<ColorPickerSwatchProps>(), {
    label: undefined,
    selected: false,
    disabled: false,
    size: 'default',
    ariaLabel: undefined,
})

const emit = defineEmits<{ select: [value: string] }>()

const isColorValid = computed(() => isValidColor(props.value))

const classes = computed(() =>
    cn(
        colorPickerSwatchVariants({ size: props.size, selected: props.selected }),
        props.disabled && 'pointer-events-none',
        !isColorValid.value && 'opacity-40'
    )
)

function handleClick() {
    // 非法色值不传播：避免空串/非标准色值写入历史或被 select 消费者误用
    if (!isColorValid.value) return
    emit('select', props.value)
}
</script>

<template>
    <!-- 保留原生 button 语义：选中态用 aria-pressed 表达，覆盖 role=option 会造成
         按钮交互语义与 listbox 键盘导航预期不一致 -->
    <button
        type="button"
        :aria-label="ariaLabel ?? label ?? value"
        :aria-pressed="selected"
        :disabled="disabled"
        :title="label ?? value"
        :class="classes"
        :style="{ backgroundColor: isColorValid ? value : 'transparent' }"
        @click="handleClick"
    />
</template>
