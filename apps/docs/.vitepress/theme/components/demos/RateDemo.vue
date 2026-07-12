<script setup lang="ts">
import { ref } from 'vue'
import { Rate } from 'brutx-ui-vue'

const val1 = ref(3)
const val2 = ref(2.5)
const val3 = ref(6)
const val4 = ref(4)
const sizeVal = ref(3)
</script>

<template>
    <div class="flex flex-col gap-8 w-full max-w-xl">
        <div>
            <h3 class="text-lg font-bold mb-3">基础评分</h3>
            <Rate v-model="val1" />
            <div class="mt-2 text-sm text-neutral-500">当前分值: {{ val1 }}</div>
        </div>

        <div>
            <h3 class="text-lg font-bold mb-3">允许半星</h3>
            <Rate v-model="val2" allow-half />
            <div class="mt-2 text-sm text-neutral-500">当前分值: {{ val2 }}</div>
        </div>

        <div>
            <h3 class="text-lg font-bold mb-3">自定义最大值 (10颗星)</h3>
            <Rate v-model="val3" :max="10" />
            <div class="mt-2 text-sm text-neutral-500">当前分值: {{ val3 }}</div>
        </div>

        <div>
            <h3 class="text-lg font-bold mb-3">只读模式</h3>
            <Rate v-model="val4" readonly allow-half />
            <div class="mt-2 text-sm text-neutral-500">只读分值: {{ val4 }}</div>
        </div>

        <div>
            <h3 class="text-lg font-bold mb-3">不同的尺寸</h3>
            <div class="flex flex-col gap-3">
                <div class="flex items-center gap-4">
                    <span class="w-16 text-sm text-neutral-500">小 (sm):</span>
                    <Rate v-model="sizeVal" size="sm" />
                </div>
                <div class="flex items-center gap-4">
                    <span class="w-16 text-sm text-neutral-500">中 (md):</span>
                    <Rate v-model="sizeVal" size="md" />
                </div>
                <div class="flex items-center gap-4">
                    <span class="w-16 text-sm text-neutral-500">大 (lg):</span>
                    <Rate v-model="sizeVal" size="lg" />
                </div>
            </div>
        </div>
    </div>
</template>
