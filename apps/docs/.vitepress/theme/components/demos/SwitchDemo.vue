<script setup lang="ts">
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const basicEnabled = ref(false)
const primaryEnabled = ref(true)
const labelsEnabled = ref(true)
const rockerEnabled = ref(false)
const soundEnabled = ref(true)
const smVal = ref(false)
const mdVal = ref(true)
const lgVal = ref(true)
</script>

<template>
    <div class="space-y-6">
        <div>
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-brutal-muted-foreground mb-2">基础 3D 机械滑块</h4>
            <div class="flex flex-wrap items-center gap-6">
                <div class="flex items-center gap-3">
                    <Switch v-model="basicEnabled" />
                    <Label>{{ basicEnabled ? '已接通' : '已断开' }}</Label>
                </div>
                <div class="flex items-center gap-3">
                    <Switch v-model="primaryEnabled" variant="primary" />
                    <Label>主要主题色</Label>
                </div>
            </div>
        </div>

        <div>
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-brutal-muted-foreground mb-2">工控通断铭牌刻印 (showLabels) & 吸合音效</h4>
            <div class="flex flex-wrap items-center gap-6">
                <div class="flex items-center gap-3">
                    <Switch v-model="labelsEnabled" show-labels />
                    <Label>工控铭牌刻线 (I / O)</Label>
                </div>
                <div class="flex items-center gap-3">
                    <Switch v-model="soundEnabled" variant="accent" show-labels sound />
                    <Label>继电器吸合音效 (sound)</Label>
                </div>
            </div>
        </div>

        <div>
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-brutal-muted-foreground mb-2">机械形态 (shape="rocker")</h4>
            <div class="flex items-center gap-3">
                <Switch v-model="rockerEnabled" shape="rocker" variant="danger" show-labels />
                <Label>工控翘板形态 (Rocker)</Label>
            </div>
        </div>

        <div>
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-brutal-muted-foreground mb-2">尺寸矩阵 (sm / default / lg)</h4>
            <div class="flex items-center gap-6">
                <div class="flex items-center gap-2">
                    <Switch v-model="smVal" size="sm" show-labels />
                    <span class="font-mono text-xs font-bold">SM</span>
                </div>
                <div class="flex items-center gap-2">
                    <Switch v-model="mdVal" size="default" show-labels />
                    <span class="font-mono text-xs font-bold">DEFAULT</span>
                </div>
                <div class="flex items-center gap-2">
                    <Switch v-model="lgVal" size="lg" show-labels />
                    <span class="font-mono text-xs font-bold">LG</span>
                </div>
            </div>
        </div>
    </div>
</template>

