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
                    <span class="text-xs font-bold">Spinner</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <BlockSpinner />
                    <span class="text-xs font-bold">BlockSpinner</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <BarsSpinner />
                    <span class="text-xs font-bold">BarsSpinner</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <DotsSpinner />
                    <span class="text-xs font-bold">DotsSpinner</span>
                </div>
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">加载器尺寸</p>
            <div class="flex flex-wrap items-end gap-6">
                <div class="flex flex-col items-center gap-2">
                    <Spinner size="sm" />
                    <span class="text-xs font-bold">sm</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner size="default" />
                    <span class="text-xs font-bold">default</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner size="lg" />
                    <span class="text-xs font-bold">lg</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner size="xl" />
                    <span class="text-xs font-bold">xl</span>
                </div>
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">加载器变体</p>
            <div class="flex flex-wrap items-end gap-6">
                <div class="flex flex-col items-center gap-2">
                    <Spinner variant="default" />
                    <span class="text-xs font-bold">default</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner variant="primary" />
                    <span class="text-xs font-bold">primary</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner variant="secondary" />
                    <span class="text-xs font-bold">secondary</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <Spinner variant="accent" />
                    <span class="text-xs font-bold">accent</span>
                </div>
            </div>
        </div>
    </div>
</template>
