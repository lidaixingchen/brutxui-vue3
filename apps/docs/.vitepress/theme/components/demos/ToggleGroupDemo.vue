<script setup lang="ts">
import { ref } from 'vue'
import { ToggleGroup, ToggleGroupItem } from 'brutx-ui-vue'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from '@lucide/vue'

const singleValue = ref('left')
const multipleValue = ref<string[]>([])
const outlineValue = ref('bold')
const smValue = ref('bold')
const lgValue = ref('bold')
const verticalValue = ref<string[]>([])
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">单选</p>
            <ToggleGroup type="single" v-model="singleValue" variant="default">
                <ToggleGroupItem value="left" aria-label="左对齐">
                    <AlignLeft class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="居中对齐">
                    <AlignCenter class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="右对齐">
                    <AlignRight class="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">多选</p>
            <ToggleGroup type="multiple" v-model="multipleValue" variant="default">
                <ToggleGroupItem value="bold" aria-label="加粗">
                    <Bold class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="斜体">
                    <Italic class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="下划线">
                    <Underline class="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">轮廓变体</p>
            <ToggleGroup type="single" v-model="outlineValue" variant="outline">
                <ToggleGroupItem value="bold" aria-label="加粗">
                    <Bold class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="斜体">
                    <Italic class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="下划线">
                    <Underline class="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex items-center gap-4">
                <ToggleGroup type="single" v-model="smValue" size="sm">
                    <ToggleGroupItem value="bold" aria-label="小尺寸">
                        <Bold class="h-3 w-3" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="小尺寸">
                        <Italic class="h-3 w-3" />
                    </ToggleGroupItem>
                </ToggleGroup>
                <ToggleGroup type="single" v-model="lgValue" size="lg">
                    <ToggleGroupItem value="bold" aria-label="大尺寸">
                        <Bold class="h-5 w-5" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="大尺寸">
                        <Italic class="h-5 w-5" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">方向</p>
            <div class="flex items-start gap-8">
                <div class="space-y-1">
                    <span class="text-xs font-bold">水平</span>
                    <ToggleGroup type="multiple" v-model="multipleValue" orientation="horizontal">
                        <ToggleGroupItem value="bold" aria-label="加粗">
                            <Bold class="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="italic" aria-label="斜体">
                            <Italic class="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="underline" aria-label="下划线">
                            <Underline class="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
                <div class="space-y-1">
                    <span class="text-xs font-bold">垂直</span>
                    <ToggleGroup type="multiple" v-model="verticalValue" orientation="vertical">
                        <ToggleGroupItem value="bold" aria-label="加粗">
                            <Bold class="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="italic" aria-label="斜体">
                            <Italic class="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="underline" aria-label="下划线">
                            <Underline class="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">禁用</p>
            <ToggleGroup type="single" model-value="bold" disabled>
                <ToggleGroupItem value="bold" aria-label="加粗">
                    <Bold class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="斜体">
                    <Italic class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="下划线">
                    <Underline class="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    </div>
</template>
