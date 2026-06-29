<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Sun, Moon, Monitor } from '@lucide/vue'
import {
    SelectRoot,
    SelectValue,
    type AcceptableValue,
} from 'reka-ui'
import Button from '../button/Button.vue'
import SelectTrigger from '../select/SelectTrigger.vue'
import SelectContent from '../select/SelectContent.vue'
import SelectItem from '../select/SelectItem.vue'
import { useTheme } from '../../composables/useTheme'
import type { ColorMode } from '../../composables/useTheme'
import { useLocale } from '@/composables/useLocale'

interface ColorModeSwitcherProps {
    /** 显示模式：icon=仅图标，button=按钮，select=下拉选择 */
    display?: 'icon' | 'button' | 'select'
    /** 是否显示 "system" 选项 */
    showSystem?: boolean
    class?: string
}

const props = withDefaults(defineProps<ColorModeSwitcherProps>(), {
    display: 'icon',
    showSystem: true,
    class: undefined,
})

const { colorMode, resolvedColorMode, applyColorMode } = useTheme()
const { t } = useLocale()

const allModes: ColorMode[] = ['light', 'dark', 'system']

// 根据 showSystem 过滤可用模式
const availableModes = computed(() =>
    props.showSystem ? allModes : allModes.filter(m => m !== 'system')
)

// 图标映射（替代 emoji，统一使用 @lucide/vue）
const iconMap: Record<ColorMode, Component> = {
    light: Sun,
    dark: Moon,
    system: Monitor,
}

// 本地循环切换函数，尊重 showSystem 属性
const toggleColorModeLocal = () => {
    const modes = availableModes.value
    const currentIndex = modes.indexOf(colorMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    applyColorMode(modes[nextIndex])
}

const currentIcon = computed<Component>(() => {
    if (colorMode.value === 'system') return iconMap.system
    return resolvedColorMode.value === 'dark' ? iconMap.dark : iconMap.light
})

const labelFor = (mode: ColorMode) => t(`colorModeSwitcher.${mode}`)

const currentLabel = computed(() => labelFor(colorMode.value))

const handleValueChange = (value: AcceptableValue) => {
    if (typeof value !== 'string') return
    const mode = allModes.find(m => m === value)
    if (mode) applyColorMode(mode)
}
</script>

<template>
    <!-- 图标模式：点击循环切换 -->
    <Button
        v-if="display === 'icon'"
        variant="default"
        size="icon"
        :class="props.class"
        :title="t('colorModeSwitcher.currentToggle', { mode: currentLabel })"
        @click="toggleColorModeLocal"
    >
        <component :is="currentIcon" :size="20" :stroke-width="2.5" class="text-brutal-fg" />
    </Button>

    <!-- 按钮模式：循环切换 -->
    <Button
        v-else-if="display === 'button'"
        variant="default"
        size="sm"
        :class="props.class"
        @click="toggleColorModeLocal"
    >
        <component :is="currentIcon" :size="16" :stroke-width="2.5" class="text-brutal-fg" />
        {{ currentLabel }}
    </Button>

    <!-- 下拉选择模式 -->
    <SelectRoot
        v-else
        :class="props.class"
        :model-value="colorMode"
        @update:model-value="handleValueChange"
    >
        <SelectTrigger
            size="sm"
            class="w-auto min-w-[8rem] gap-2"
            :aria-label="t('colorModeSwitcher.colorMode')"
        >
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem
                v-for="mode in availableModes"
                :key="mode"
                :value="mode"
            >
                {{ labelFor(mode) }}
            </SelectItem>
        </SelectContent>
    </SelectRoot>
</template>
