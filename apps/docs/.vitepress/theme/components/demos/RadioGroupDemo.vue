<script setup lang="ts">
import { ref } from 'vue'
import { RadioGroup, RadioGroupItem } from 'brutx-ui-vue'

const selected = ref('option-1')
const density = ref('comfortable')
</script>

<template>
    <div class="space-y-6">
        <RadioGroup v-model="selected" default-value="option-1">
            <div class="flex items-center gap-3">
                <RadioGroupItem value="option-1" />
                <span class="text-sm font-bold">默认</span>
            </div>
            <div class="flex items-center gap-3">
                <RadioGroupItem value="option-2" variant="secondary" />
                <span class="text-sm font-bold">次要</span>
            </div>
            <div class="flex items-center gap-3">
                <RadioGroupItem value="option-3" variant="danger" />
                <span class="text-sm font-bold">危险</span>
            </div>
        </RadioGroup>

        <div class="pt-4 border-t-3 border-brutal-border">
            <p class="text-sm font-black mb-2">自定义 aria-label</p>
            <RadioGroup v-model="density" aria-label="布局密度">
                <div class="flex items-center gap-3">
                    <RadioGroupItem value="default" />
                    <span class="text-sm font-bold">默认</span>
                </div>
                <div class="flex items-center gap-3">
                    <RadioGroupItem value="comfortable" />
                    <span class="text-sm font-bold">舒适</span>
                </div>
                <div class="flex items-center gap-3">
                    <RadioGroupItem value="compact" />
                    <span class="text-sm font-bold">紧凑</span>
                </div>
            </RadioGroup>
        </div>
    </div>
</template>
