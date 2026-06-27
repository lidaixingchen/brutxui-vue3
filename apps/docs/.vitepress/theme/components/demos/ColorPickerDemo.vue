<script setup lang="ts">
import { ref } from 'vue'
import { ColorPicker } from 'brutx-ui-vue'

const hexColor = ref<string | null>('#EF476F')
const rgbColor = ref<string | null>(null)
const hslColor = ref<string | null>(null)
const alphaColor = ref<string | null>('#4A90D9')
const presetColor = ref<string | null>(null)
const sizeColor = ref<string | null>('#EF476F')
const disabledColor = ref<string | null>('#EF476F')

const presets = [
    '#EF476F',
    '#FFD166',
    '#06D6A0',
    '#118AB2',
    '#073B4C',
    '#7FB069',
]
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">基础用法（HEX）</p>
            <div class="flex flex-wrap items-center gap-3">
                <ColorPicker v-model="hexColor" :clearable="true" />
                <span class="text-xs font-bold opacity-60">{{ hexColor ?? '未选择' }}</span>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">颜色格式</p>
            <div class="flex flex-wrap items-center gap-6">
                <div class="flex items-center gap-2">
                    <ColorPicker v-model="rgbColor" format="rgb" />
                    <span class="text-xs font-bold opacity-60">RGB</span>
                </div>
                <div class="flex items-center gap-2">
                    <ColorPicker v-model="hslColor" format="hsl" />
                    <span class="text-xs font-bold opacity-60">HSL</span>
                </div>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">透明度通道（showAlpha）</p>
            <div class="flex flex-wrap items-center gap-3">
                <ColorPicker v-model="alphaColor" :show-alpha="true" :clearable="true" />
                <span class="text-xs font-bold opacity-60">{{ alphaColor ?? '未选择' }}</span>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">自定义预设颜色</p>
            <ColorPicker
                v-model="presetColor"
                :presets="presets"
                :show-presets="true"
                :show-history="false"
            />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex flex-wrap items-center gap-3">
                <ColorPicker v-model="sizeColor" size="sm" />
                <ColorPicker v-model="sizeColor" size="default" />
                <ColorPicker v-model="sizeColor" size="lg" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">禁用状态</p>
            <ColorPicker v-model="disabledColor" disabled />
        </div>
    </div>
</template>
