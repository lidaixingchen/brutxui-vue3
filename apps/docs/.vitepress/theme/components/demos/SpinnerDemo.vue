<script setup lang="ts">
import { Spinner, BlockSpinner, BarsSpinner, DotsSpinner } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-8">
        <div class="space-y-2">
            <p class="font-black text-sm">加载器类型</p>
            <div class="flex flex-wrap items-center gap-8">
                <div class="flex flex-col items-center gap-2">
                    <Spinner />
                    <span class="text-xs font-bold">旋转</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <BlockSpinner />
                    <span class="text-xs font-bold">方块</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <BarsSpinner />
                    <span class="text-xs font-bold">条形</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <DotsSpinner />
                    <span class="text-xs font-bold">圆点</span>
                </div>
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">加载器尺寸</p>
            <div class="flex flex-wrap items-end gap-6">
                <div class="flex flex-col items-center gap-2">
                    <Spinner size="sm" />
                    <span class="text-xs font-bold">小</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner size="default" />
                    <span class="text-xs font-bold">默认</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner size="lg" />
                    <span class="text-xs font-bold">大</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner size="xl" />
                    <span class="text-xs font-bold">超大</span>
                </div>
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">加载器变体</p>
            <div class="flex flex-wrap items-end gap-6">
                <div class="flex flex-col items-center gap-2">
                    <Spinner variant="default" />
                    <span class="text-xs font-bold">默认</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner variant="primary" />
                    <span class="text-xs font-bold">主要</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner variant="secondary" />
                    <span class="text-xs font-bold">次要</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner variant="accent" />
                    <span class="text-xs font-bold">强调</span>
                </div>
            </div>
        </div>
    </div>
</template>
