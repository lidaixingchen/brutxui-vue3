<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox } from 'brutx-ui-vue'

const checked = ref(false)
const primaryChecked = ref(true)
const dangerChecked = ref(false)
const labeledChecked = ref(false)
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
            <Checkbox v-model:checked="checked" />
            <span class="text-sm font-bold">默认</span>
        </div>
        <div class="flex items-center gap-3">
            <Checkbox v-model:checked="primaryChecked" variant="primary" />
            <span class="text-sm font-bold">主要</span>
        </div>
        <div class="flex items-center gap-3">
            <Checkbox v-model:checked="dangerChecked" variant="danger" />
            <span class="text-sm font-bold">危险</span>
        </div>
        <div class="flex items-center gap-3">
            <Checkbox :checked="'indeterminate'" aria-label="部分选中" />
            <span class="text-sm font-bold">不确定状态（Minus 图标）</span>
        </div>
        <div class="flex items-center gap-3">
            <Checkbox v-model:checked="labeledChecked" aria-label="接收营销邮件" />
            <span class="text-sm font-bold">自定义 aria-label</span>
        </div>
    </div>
</template>
