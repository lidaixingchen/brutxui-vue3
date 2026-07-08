<script setup lang="ts">
import { ref } from 'vue'
import { Toggle } from 'brutx-ui-vue'
import { Bold, Italic, Underline } from '@lucide/vue'

const boldPressed = ref(false)
const italicPressed = ref(false)
const outlinePressed = ref(false)
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">默认变体</p>
            <div class="flex gap-2">
                <Toggle v-model="boldPressed" aria-label="加粗">
                    <Bold class="h-4 w-4" />
                </Toggle>
                <Toggle v-model="italicPressed" aria-label="斜体">
                    <Italic class="h-4 w-4" />
                </Toggle>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">轮廓变体</p>
            <div class="flex gap-2">
                <Toggle v-model="outlinePressed" variant="outline" aria-label="下划线">
                    <Underline class="h-4 w-4" />
                </Toggle>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex items-center gap-2">
                <Toggle size="sm" aria-label="小">
                    <Bold class="h-3 w-3" />
                </Toggle>
                <Toggle size="default" aria-label="默认">
                    <Bold class="h-4 w-4" />
                </Toggle>
                <Toggle size="lg" aria-label="大">
                    <Bold class="h-5 w-5" />
                </Toggle>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">禁用</p>
            <div class="flex items-center gap-2">
                <Toggle disabled aria-label="禁用">
                    <Bold class="h-4 w-4" />
                </Toggle>
                <Toggle disabled :model-value="true" aria-label="已按下(禁用)">
                    <Italic class="h-4 w-4" />
                </Toggle>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">加载中</p>
            <div class="flex items-center gap-2">
                <Toggle loading aria-label="加粗加载中">
                    <Bold class="h-4 w-4" />
                </Toggle>
                <Toggle loading :model-value="true" variant="outline" aria-label="斜体加载中">
                    <Italic class="h-4 w-4" />
                </Toggle>
            </div>
        </div>
    </div>
</template>
