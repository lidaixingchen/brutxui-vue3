<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '../../composables/useTheme'
import type { ColorMode } from '../../composables/useTheme'

interface Props {
    /** 显示模式：icon=仅图标，button=按钮，select=下拉选择 */
    display?: 'icon' | 'button' | 'select'
    /** 是否显示 "system" 选项 */
    showSystem?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    display: 'icon',
    showSystem: true,
})

const { colorMode, resolvedColorMode, applyColorMode } = useTheme()

const allModes: ColorMode[] = ['light', 'dark', 'system']

// 根据 showSystem 过滤可用模式
const availableModes = computed(() =>
    props.showSystem ? allModes : allModes.filter(m => m !== 'system')
)

// 本地循环切换函数，尊重 showSystem 属性
const toggleColorModeLocal = () => {
    const modes = availableModes.value
    const currentIndex = modes.indexOf(colorMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    applyColorMode(modes[nextIndex])
}

const currentIcon = computed(() => {
    if (colorMode.value === 'system') return '💻'
    return resolvedColorMode.value === 'dark' ? '🌙' : '☀️'
})

const currentLabel = computed(() => {
    const labels: Record<ColorMode, string> = {
        light: 'Light',
        dark: 'Dark',
        system: 'System',
    }
    return labels[colorMode.value]
})

// 验证处理程序
const handleSelectChange = (event: Event) => {
    const value = (event.target as HTMLSelectElement).value as ColorMode
    if (allModes.includes(value)) {
        applyColorMode(value)
    }
}
</script>

<template>
    <!-- 图标模式：点击循环切换 -->
    <button
        v-if="display === 'icon'"
        class="nb-border nb-shadow nb-press p-2 rounded-brutal bg-brutal-bg hover:bg-brutal-muted transition-colors"
        :title="`Current: ${currentLabel}. Click to toggle.`"
        @click="toggleColorModeLocal"
    >
        <span class="text-xl">{{ currentIcon }}</span>
    </button>

    <!-- 按钮模式：循环切换 -->
    <button
        v-else-if="display === 'button'"
        class="nb-border nb-shadow nb-press px-3 py-1.5 rounded-brutal bg-brutal-bg hover:bg-brutal-muted transition-colors font-bold text-sm"
        @click="toggleColorModeLocal"
    >
        {{ currentIcon }} {{ currentLabel }}
    </button>

    <!-- 下拉选择模式 -->
    <select
        v-else
        :value="colorMode"
        class="nb-border nb-shadow rounded-brutal bg-brutal-bg px-2 py-1.5 text-sm font-bold"
        aria-label="Color mode"
        @change="handleSelectChange"
    >
        <option v-for="mode in availableModes" :key="mode" :value="mode">
            {{ mode === 'light' ? '☀️ Light' : mode === 'dark' ? '🌙 Dark' : '💻 System' }}
        </option>
    </select>
</template>
