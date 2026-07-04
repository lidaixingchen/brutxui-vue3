<script setup lang="ts">
import { ref } from 'vue'
import { Statistic } from 'brutx-ui-vue'
import { ArrowUpRight, ArrowDownRight, RotateCcw } from '@lucide/vue'

const key = ref(0)
function restart() {
    key.value++
}
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">基础与卡片风格</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Statistic
                    title="活跃用户 (基础模式)"
                    :value="268400"
                    separator=","
                    :key="key"
                />
                
                <Statistic
                    title="月营业额 (Card 粗野边框投影卡片)"
                    :value="938450"
                    prefix="¥"
                    separator=","
                    card
                    :key="key"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">精度控制与前后缀/插槽组件</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Statistic
                    title="转化率提升"
                    :value="12.35"
                    :precision="2"
                    suffix="%"
                    :suffix-component="ArrowUpRight"
                    variant="success"
                    card
                    :key="key"
                />
                
                <Statistic
                    title="退单率 (Danger 变体)"
                    :value="1.8"
                    :precision="1"
                    suffix="%"
                    :suffix-component="ArrowDownRight"
                    variant="danger"
                    card
                    :key="key"
                />
            </div>
        </div>

        <div class="flex justify-center mt-4">
            <button
                class="inline-flex items-center gap-1.5 text-xs font-bold border-3 border-brutal px-3 py-1.5 rounded-brutal shadow-brutal bg-brutal-muted transition-all hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none"
                @click="restart"
            >
                <RotateCcw class="h-3.5 w-3.5 stroke-[3]" />
                重新播放动画
            </button>
        </div>
    </div>
</template>
