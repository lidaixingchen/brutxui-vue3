<script setup lang="ts">
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const value = ref([60])
const rangedValue = ref([25])
const disabledValue = ref([50])
const variantValue = ref([50])
const verticalValue = ref([50])
const marksValue = ref([50])
const tooltipValue = ref([50])
</script>

<template>
    <div class="flex flex-col gap-8 w-full max-w-sm">
        <div class="space-y-2">
            <p class="text-sm font-bold">基础用法</p>
            <Slider v-model="value" :default-value="[60]" />
            <p class="text-sm font-bold text-brutal-muted-foreground">
                值：{{ value[0] }}
            </p>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold">自定义范围 (min=0, max=200, step=10)</p>
            <Slider v-model="rangedValue" :min="0" :max="200" :step="10" />
            <p class="text-sm font-bold text-brutal-muted-foreground">
                值：{{ rangedValue[0] }}
            </p>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold">颜色变体 (variant=primary)</p>
            <Slider v-model="variantValue" variant="primary" />
            <p class="text-sm font-bold text-brutal-muted-foreground">
                值：{{ variantValue[0] }}
            </p>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold">禁用状态</p>
            <Slider v-model="disabledValue" :disabled="true" />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">垂直方向</p>
            <div class="h-48 pl-2">
                <Slider v-model="verticalValue" orientation="vertical" />
            </div>
            <p class="text-sm font-bold text-brutal-muted-foreground">
                值：{{ verticalValue[0] }}
            </p>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">刻度标记</p>
            <Slider v-model="marksValue" :marks="[0, 25, 50, 75, 100]" />
            <p class="text-sm font-bold text-brutal-muted-foreground">
                值：{{ marksValue[0] }}
            </p>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">拖拽提示</p>
            <Slider v-model="tooltipValue" show-tooltip />
            <p class="text-sm font-bold text-brutal-muted-foreground">
                值：{{ tooltipValue[0] }}
            </p>
        </div>
    </div>
</template>
