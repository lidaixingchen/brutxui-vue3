<script setup lang="ts">
import { computed, useId } from 'vue'
import { X } from '@lucide/vue'
import { isValidColor, normalizeColor } from '@/lib/color'
import { useLocale } from '@/composables/useLocale'
import ColorPickerSwatch from './ColorPickerSwatch.vue'

interface ColorPickerHistoryProps {
    history: readonly string[]
    modelValue?: string | null
    size?: 'sm' | 'default' | 'lg'
    ariaLabel?: string
    clearLabel?: string
}

const props = withDefaults(defineProps<ColorPickerHistoryProps>(), {
    modelValue: null,
    size: 'default',
    ariaLabel: undefined,
    clearLabel: undefined,
})

const emit = defineEmits<{
    select: [value: string]
    clear: []
}>()

const { t } = useLocale()

// 独立使用时 ariaLabel/clearLabel 可能为 undefined，回退到 i18n 默认文案，
// 避免组名无名称、清空图标按钮无可访问名称
const resolvedLabel = computed(() => props.ariaLabel ?? t('colorPicker.history'))
const resolvedClearLabel = computed(() => props.clearLabel ?? t('colorPicker.clearHistory'))

// 标题 span 与 group 关联同一 id（aria-labelledby），读屏器不重复播报组名与标题文本
const headingId = useId()

// 过滤非法色值：history 可能来自外部调用方或 localStorage（被篡改时），
// 非法值不渲染、不暴露到无障碍名称，保证展示健壮性
const validHistory = computed(() => props.history.filter((color) => isValidColor(color)))

// 选中比较做归一化（小写 + 展开简写 hex），兼容 '#fff' 与 '#ffffff' 等格式差异
const normalizedModel = computed(() => (props.modelValue ? normalizeColor(props.modelValue) : null))
const isSelected = (color: string) => {
    const normalized = normalizeColor(color)
    return !!normalized && normalized === normalizedModel.value
}

const isEmpty = computed(() => validHistory.value.length === 0)
</script>

<template>
    <div v-if="!isEmpty" role="group" :aria-labelledby="headingId">
        <div class="flex items-center justify-between mb-2">
            <span :id="headingId" class="text-xs font-bold uppercase tracking-tight text-brutal-fg">
                {{ resolvedLabel }}
            </span>
            <button
                type="button"
                class="inline-flex items-center gap-1 text-xs font-bold text-brutal-fg hover:text-brutal-destructive transition-colors"
                :aria-label="resolvedClearLabel"
                @click="emit('clear')"
            >
                <X class="w-3 h-3 stroke-[3]" />
            </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
            <ColorPickerSwatch
                v-for="(color, index) in validHistory"
                :key="`${color}-${index}`"
                :value="color"
                :size="size"
                :selected="isSelected(color)"
                :aria-label="color"
                @select="emit('select', $event)"
            />
        </div>
    </div>
</template>
