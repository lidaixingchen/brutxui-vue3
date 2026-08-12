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
        // 非法色值的弱化由模板 :disabled="disabled || !isColorValid" 覆盖到
        // disabled:opacity-50（变体基础类，特异性高于普通 opacity 类）统一处理，
        // 不再附加 opacity-40，避免两处透明度声明互相覆盖导致视觉漂移
    )
)

function handleClick() {
    // 禁用态与非法色值均不传播：原生 disabled 只拦真实浏览器点击，
    // 测试/合成事件环境（trigger('click') 直接派发）下禁用按钮 click 仍到达处理器，故保留守卫
    if (props.disabled || !isColorValid.value) return
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
        :disabled="disabled || !isColorValid"
        :title="label ?? value"
        :class="classes"
        :style="{ backgroundColor: isColorValid ? value : 'transparent' }"
        @click="handleClick"
    />
</template>
