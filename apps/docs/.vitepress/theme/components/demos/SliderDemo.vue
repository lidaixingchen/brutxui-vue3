<script setup lang="ts">
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const value = ref([60])
const rangedValue = ref([25])
const disabledValue = ref([50])
</script>

<template>
    <div class="flex flex-col gap-8 w-full max-w-sm">
        <div class="space-y-2">
            <p class="text-sm font-bold">基础用法</p>
            <Slider v-model="value" :default-value="[60]" />
            <p class="text-sm font-bold text-brutal-muted-foreground">
                Value: {{ value[0] }}
            </p>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold">自定义范围 (min=0, max=200, step=10)</p>
            <Slider v-model="rangedValue" :min="0" :max="200" :step="10" />
            <p class="text-sm font-bold text-brutal-muted-foreground">
                Value: {{ rangedValue[0] }}
            </p>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold">禁用状态</p>
            <Slider v-model="disabledValue" :disabled="true" />
        </div>
    </div>
</template>
