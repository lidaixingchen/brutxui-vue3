<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { DialogRoot, DialogTrigger } from 'reka-ui'
import { Button } from 'brutx-ui-vue/button'
import { DialogContent, DialogTitle, DialogDescription } from 'brutx-ui-vue/dialog'
import ChartReadingPrototype from './ChartReadingPrototype.vue'

interface Reading { label: string; value: number }
const samples: Reading[] = [{ label: '一月', value: -20 }, { label: '二月', value: 0 }, { label: '三月', value: 40 }]
const data: Ref<Reading[]> = ref([...samples])
const dialogOpen: Ref<boolean> = ref(false)
function replaceData(): void { data.value = [...samples].reverse() }
function singleData(): void { data.value = [samples[0]!] }
function emptyData(): void { data.value = [] }
function reset(): void { data.value = [...samples] }
</script>

<template>
    <div class="vp-raw space-y-8">
        <p>读数验收：验证图形命中、序号控件读数、表格读取、悬停通道和弹层 Esc。</p>
        <div class="flex flex-wrap gap-2">
            <Button type="button" @click="replaceData">重排数据</Button>
            <Button type="button" @click="singleData">单项数据</Button>
            <Button type="button" @click="emptyData">空数据</Button>
            <Button type="button" @click="reset">恢复三项</Button>
        </div>
        <ChartReadingPrototype title="月度净收入" :data="data" />
        <ChartReadingPrototype title="月度净支出" :data="samples" />
        <DialogRoot v-model:open="dialogOpen">
            <DialogTrigger as-child><Button type="button">打开弹窗验证</Button></DialogTrigger>
            <DialogContent size="lg">
                <DialogTitle>弹窗内读数</DialogTitle>
                <DialogDescription>让序号控件获得焦点，依次按两次 Esc，观察提示与弹窗关闭顺序。</DialogDescription>
                <ChartReadingPrototype title="弹窗月度净收入" :data="samples" />
            </DialogContent>
        </DialogRoot>
        <p class="font-mono text-sm">弹窗={{ dialogOpen }}</p>
    </div>
</template>
