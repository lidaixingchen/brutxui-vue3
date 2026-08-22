<script setup lang="ts">
import { BrutalShape } from 'brutx-ui-vue'

const burstShapes = ['star-4', 'star-5', 'star-6', 'star-8', 'star-12', 'star-16'] as const
const sealShapes = ['seal-saw-16', 'seal-cog-8', 'seal-scallop-8', 'seal-badge'] as const
const crosshairShapes = ['crosshair-plus', 'crosshair-target', 'crosshair-corner'] as const
const pixelShapes = ['pixel-burst', 'pixel-heart', 'pixel-spark'] as const
const glyphShapes = ['lightning', 'heart', 'skull', 'thumb', 'diamond'] as const
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">五类图腾总览</h3>
            <div class="space-y-4 border-3 border-brutal rounded-brutal bg-brutal-bg p-6">
                <div v-for="[label, shapes] in [
                    ['爆炸多角星 Burst', burstShapes],
                    ['工业图章 Seal', sealShapes],
                    ['HUD 标定十字 Crosshair', crosshairShapes],
                    ['8-Bit 像素 Pixel', pixelShapes],
                    ['符号图腾 Glyph', glyphShapes],
                ]" :key="label">
                    <p class="mb-2 font-mono text-xs font-bold uppercase tracking-widest opacity-75">{{ label }}</p>
                    <div class="flex flex-wrap items-center gap-5 border-l-4 border-brutal-accent pl-4">
                        <BrutalShape v-for="name in shapes" :key="name" :name="name" :size="44" />
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">尺寸与配色定制</h3>
            <div class="flex flex-wrap items-center gap-6 border-3 border-brutal rounded-brutal bg-brutal-bg p-6">
                <BrutalShape name="star-8" :size="24" />
                <BrutalShape name="star-8" :size="40" />
                <BrutalShape name="star-8" :size="56" />
                <BrutalShape name="lightning" :size="48" color="var(--brutal-primary)" stroke="var(--brutal-primary)" />
                <BrutalShape name="heart" :size="48" color="var(--brutal-destructive)" stroke="var(--brutal-destructive)" />
                <BrutalShape
                    name="diamond"
                    :size="48"
                    color="transparent"
                    stroke="var(--brutal-fg)"
                    :stroke-width="6"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">压角贴纸装饰（配合绝对定位）</h3>
            <div class="relative border-3 border-brutal rounded-brutal bg-brutal-bg p-6 pt-8 shadow-brutal">
                <BrutalShape name="seal-badge" :size="52" color="var(--brutal-accent)" class="absolute -right-4 -top-4 rotate-12" />
                <h4 class="font-mono text-base font-bold uppercase tracking-widest">Limited Edition</h4>
                <p class="mt-2 text-sm font-bold leading-relaxed opacity-80">
                    图腾作为装饰性 SVG 默认对读屏隐藏（decorative），可自由叠加在卡片、标题或按钮上，
                    pointer-events 已禁用，不会干扰宿主交互。
                </p>
            </div>
        </div>
    </div>
</template>
