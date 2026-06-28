<script setup lang="ts">
import { Skeleton, SkeletonAvatar, SkeletonText, SkeletonCard, SkeletonTable } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-8">
        <div class="space-y-2">
            <p class="font-black text-sm">变体</p>
            <div class="flex flex-wrap items-center gap-3">
                <Skeleton variant="default" class="h-12 w-32" />
                <Skeleton variant="primary" class="h-12 w-32" />
                <Skeleton variant="secondary" class="h-12 w-32" />
                <Skeleton variant="accent" class="h-12 w-32" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">头像尺寸</p>
            <div class="flex flex-wrap items-end gap-3">
                <div class="flex flex-col items-center gap-2">
                    <SkeletonAvatar size="sm" />
                    <span class="text-xs font-bold">sm</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <SkeletonAvatar size="default" />
                    <span class="text-xs font-bold">default</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <SkeletonAvatar size="lg" />
                    <span class="text-xs font-bold">lg</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <SkeletonAvatar size="xl" />
                    <span class="text-xs font-bold">xl</span>
                </div>
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">骨架文本</p>
            <div class="flex items-center gap-4">
                <SkeletonAvatar />
                <div class="flex-1">
                    <SkeletonText :lines="2" last-line-width="40%" />
                </div>
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">骨架卡片</p>
            <div class="max-w-sm">
                <SkeletonCard />
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">骨架表格</p>
            <div class="max-w-lg">
                <SkeletonTable :rows="4" :columns="4" />
            </div>
        </div>
    </div>
</template>