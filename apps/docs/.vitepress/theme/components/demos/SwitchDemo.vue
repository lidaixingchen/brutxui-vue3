<script setup lang="ts">
import { ref, useId } from 'vue'
import { Button, Switch, Label } from 'brutx-ui-vue'

const basicEnabled = ref(false)
const primaryEnabled = ref(true)
const secondaryEnabled = ref(true)
const labelsEnabled = ref(true)
const customLabelsEnabled = ref(true)
const symbolLabelsEnabled = ref(false)
const soundEnabled = ref(true)
const smVal = ref(false)
const mdVal = ref(true)
const lgVal = ref(true)
const basicId = useId()
const formSwitchId = useId()
const formResult = ref('尚未读取表单')

function readForm(event: Event) {
    const form = event.currentTarget as HTMLFormElement
    formResult.value = `notifications = ${new FormData(form).get('notifications') ?? '未提交'}`
}
</script>

<template>
    <div class="w-full min-w-0 space-y-6">
        <div>
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-brutal-muted-foreground mb-2">滑动开关</h4>
            <div class="flex flex-wrap items-center gap-6">
                <div class="flex items-center gap-3">
                    <Switch :id="basicId" v-model="basicEnabled" />
                    <Label :for="basicId">自动同步</Label>
                </div>
                <div class="flex items-center gap-3">
                    <Switch v-model="primaryEnabled" variant="primary" aria-label="主要主题色" />
                    <Label>主要主题色</Label>
                </div>
                <div class="flex items-center gap-3">
                    <Switch v-model="secondaryEnabled" variant="secondary" aria-label="辅助主题色" />
                    <Label>辅助主题色</Label>
                </div>
            </div>
        </div>

        <div>
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-brutal-muted-foreground mb-2">状态标签与切换音效</h4>
            <div class="flex flex-wrap items-center gap-6">
                <div class="flex items-center gap-3">
                    <Switch v-model="labelsEnabled" show-labels aria-label="状态标签" />
                    <Label>当前状态 (I / O)</Label>
                </div>
                <div class="flex items-center gap-3">
                    <Switch v-model="soundEnabled" variant="accent" show-labels sound aria-label="切换音效" />
                    <Label>切换音效 (sound)</Label>
                </div>
            </div>
        </div>

        <div>
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-brutal-muted-foreground mb-2">自定义状态标签</h4>
            <div class="flex flex-wrap items-center gap-6">
                <div class="flex items-center gap-3">
                    <Switch v-model="customLabelsEnabled" show-labels checked-label="开" unchecked-label="关" aria-label="自定义文字标签" />
                    <Label>文字：开 / 关</Label>
                </div>
                <div class="flex items-center gap-3">
                    <Switch v-model="symbolLabelsEnabled" variant="secondary" show-labels checked-label="✓" unchecked-label="×" aria-label="自定义符号标签" />
                    <Label>符号：✓ / ×</Label>
                </div>
            </div>
        </div>

        <div>
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-brutal-muted-foreground mb-2">尺寸矩阵 (sm / default / lg)</h4>
            <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div class="flex items-center gap-2">
                    <Switch v-model="smVal" size="sm" show-labels aria-label="小尺寸" />
                    <span class="font-mono text-xs font-bold">SM</span>
                </div>
                <div class="flex items-center gap-2">
                    <Switch v-model="mdVal" size="default" show-labels aria-label="标准尺寸" />
                    <span class="font-mono text-xs font-bold">DEFAULT</span>
                </div>
                <div class="flex items-center gap-2">
                    <Switch v-model="lgVal" size="lg" show-labels aria-label="大尺寸" />
                    <span class="font-mono text-xs font-bold">LG</span>
                </div>
            </div>
        </div>
        <div>
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-brutal-muted-foreground mb-2">原生表单</h4>
            <form class="space-y-3" @submit.prevent="readForm" @reset="formResult = '表单已重置'">
                <div class="flex flex-wrap items-center gap-3">
                    <Switch :id="formSwitchId" name="notifications" value="enabled" default-value required show-labels checked-label="开" unchecked-label="关" />
                    <Label :for="formSwitchId" required>接收通知</Label>
                    <Button type="submit" size="sm">读取表单</Button>
                    <Button type="reset" variant="outline" size="sm">重置</Button>
                </div>
                <p class="text-xs font-mono text-brutal-muted-foreground" aria-live="polite">{{ formResult }}</p>
            </form>
        </div>

        <div>
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-brutal-muted-foreground mb-2">禁用状态</h4>
            <div class="flex flex-wrap items-center gap-6">
                <Switch disabled aria-label="禁用关闭" />
                <Switch disabled default-value show-labels aria-label="禁用开启" />
            </div>
        </div>
    </div>
</template>

