<script setup lang="ts">
import { computed, useId } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { ChevronDown, X } from '@lucide/vue'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { type ColorPreset } from '@/lib/default-presets'
import PopoverContent from '../popover/PopoverContent.vue'
import { colorPickerTriggerVariants } from './color-picker-variants'
import ColorPickerPanel from './ColorPickerPanel.vue'
import { type ColorPickerEmits, type ColorPickerProps } from './types'
import { useColorPicker } from '@/composables/useColorPicker'

type TriggerVariantProps = VariantProps<typeof colorPickerTriggerVariants>

interface ColorPickerRootProps extends ColorPickerProps {
    open?: boolean
    size?: NonNullable<TriggerVariantProps['size']>
}

const props = withDefaults(defineProps<ColorPickerRootProps>(), {
    modelValue: null,
    format: 'hex',
    showAlpha: false,
    presets: undefined,
    showPresets: true,
    presetsLabel: undefined,
    showHistory: true,
    historyMax: 8,
    historyStorageKey: 'brutx-color-history',
    showInput: true,
    placeholder: undefined,
    disabled: false,
    clearable: false,
    open: undefined,
    size: 'default',
    name: undefined,
    id: undefined,
    ariaLabel: undefined,
    class: undefined,
})

const emit = defineEmits<ColorPickerEmits & {
    'update:open': [value: boolean]
}>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('colorPicker.placeholder'))
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('colorPicker.placeholder'))

const {
    open,
    displayValue,
    normalizedDisplay,
    swatchStyle,
    handlePanelUpdate,
    handlePanelConfirm,
    handlePanelClear,
    handleClearClick,
    handleTriggerKeydown,
} = useColorPicker({
    modelValue: () => props.modelValue,
    format: () => props.format,
    showAlpha: () => props.showAlpha,
    disabled: () => props.disabled,
    openProp: () => props.open,
    emitUpdateOpen: (val) => emit('update:open', val),
    emit,
})

const triggerClasses = computed(() =>
    cn(
        colorPickerTriggerVariants({ size: props.size }),
        !props.modelValue && 'text-brutal-muted-foreground',
        props.class
    )
)

const ICON_SIZE_CLASSES = {
    swatch: { sm: 'w-4 h-4', default: 'w-5 h-5', lg: 'w-7 h-7' },
    clearButton: { sm: 'w-4 h-4', default: 'w-5 h-5', lg: 'w-5 h-5' },
    smallIcon: { sm: 'w-3 h-3', default: 'w-4 h-4', lg: 'w-4 h-4' },
} as const

defineExpose({ open })

// 手动维护 contentId 并绑定到面板根节点：reka 的 rootContext.contentId 是普通属性（非响应式），
// 触发器经 as-child 读取时可能仍是空串（内容挂载发生在触发渲染之后），内置接线不可靠。
// 即使 reka 覆盖按钮的 aria-controls 为它自己的 contentId，其内容元素也带同 id，引用仍有效。
const contentId = `color-picker-content-${useId()}`

const presetsForPanel = computed<string[] | readonly ColorPreset[] | undefined>(() => props.presets)
</script>

<template>
    <!-- 原生表单提交：触发器按钮是 type="button"，name 不随表单提交，
         渲染隐藏 input 携带当前颜色值，值随 modelValue 变化同步 -->
    <input v-if="name" type="hidden" :name="name" :value="modelValue ?? ''" :disabled="disabled">
    <PopoverRoot v-model:open="open">
        <PopoverTrigger as-child>
            <button
                :id="id"
                type="button"
                role="combobox"
                :aria-expanded="open"
                :aria-controls="open ? contentId : undefined"
                :aria-label="resolvedAriaLabel"
                aria-haspopup="dialog"
                :disabled="disabled"
                :class="triggerClasses"
                @keydown="handleTriggerKeydown"
            >
                <span
                    class="inline-block border-2 border-brutal shrink-0"
                    :class="[
                        ICON_SIZE_CLASSES.swatch[size],
                        !modelValue && 'opacity-40',
                    ]"
                    :style="swatchStyle"
                />
                <span v-if="showInput" class="flex-1 text-left truncate font-mono text-sm">
                    {{ normalizedDisplay ?? resolvedPlaceholder }}
                </span>
                <span v-else class="flex-1 text-left truncate">
                    {{ normalizedDisplay ?? resolvedPlaceholder }}
                </span>
                <span class="flex items-center gap-1 shrink-0">
                    <!-- 与 lib/utils FOCUS_RING_CLASSES 保持一致 -->
                    <span
                        v-if="clearable && modelValue && !disabled"
                        role="button"
                        class="inline-flex items-center justify-center text-brutal-fg hover:text-brutal-destructive transition-colors focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden rounded-brutal"
                        :class="ICON_SIZE_CLASSES.clearButton[size]"
                        :aria-label="t('colorPicker.clear')"
                        tabindex="0"
                        @click.stop="handleClearClick"
                        @keydown.enter.prevent.stop="handleClearClick"
                        @keydown.space.prevent.stop="handleClearClick"
                    >
                        <X :class="ICON_SIZE_CLASSES.smallIcon[size]" class="stroke-[3]" />
                    </span>
                    <ChevronDown class="opacity-60 stroke-[3]" :class="ICON_SIZE_CLASSES.smallIcon[size]" />
                </span>
            </button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0 border-none shadow-none bg-transparent" align="start">
            <ColorPickerPanel
                :id="contentId"
                :model-value="displayValue"
                :format="format"
                :show-alpha="showAlpha"
                :presets="presetsForPanel"
                :show-presets="showPresets"
                :presets-label="presetsLabel"
                :show-history="showHistory"
                :history-max="historyMax"
                :history-storage-key="historyStorageKey"
                :show-input="showInput"
                :clearable="clearable"
                :size="size"
                @update:model-value="handlePanelUpdate"
                @confirm="handlePanelConfirm"
                @clear="handlePanelClear"
            />
        </PopoverContent>
    </PopoverRoot>
</template>
