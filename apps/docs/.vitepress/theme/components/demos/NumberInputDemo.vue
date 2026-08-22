<script setup lang="ts">
import { ref } from 'vue'
import { NumberInput } from 'brutx-ui-vue'

const val1 = ref(10)
const val2 = ref(20)
</script>

<template>
    <div class="flex flex-col gap-6 w-full max-w-[300px]">
        <div>
            <label class="block text-sm font-black mb-2">双侧分立式</label>
            <NumberInput v-model="val1" :min="0" :max="100" layout="split" />
        </div>
        <div>
            <label class="block text-sm font-black mb-2">右侧堆叠式</label>
            <NumberInput v-model="val2" :min="0" :max="100" layout="stacked" />
        </div>
        <div>
            <label class="block text-sm font-black mb-2">机械音效（sound）</label>
            <NumberInput v-model="val1" :min="0" :max="100" sound />
            <p class="mt-1 text-xs font-medium opacity-60">步进点击时播放机械咔哒声（首次交互后生效）</p>
        </div>
    </div>
</template>
