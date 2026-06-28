<script setup lang="ts">
import { ref } from 'vue'
import { Counter } from 'brutx-ui-vue'
import { RotateCcw } from '@lucide/vue'

const RESET_DELAY = 2000

const stats = [
    { to: 12800, suffix: '+', label: '组件安装次数', size: 'lg' as const },
    { to: 99.9, suffix: '%', decimals: 1, label: '可用性', size: 'lg' as const },
    { to: 56, label: '内置组件数', size: 'lg' as const },
]

const key = ref(0)
function restart() { key.value++ }

const completeMessage = ref('')
function onComplete() {
    completeMessage.value = '计数完成！'
    setTimeout(() => { completeMessage.value = '' }, RESET_DELAY)
}
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">基础用法</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                    v-for="stat in stats"
                    :key="stat.label"
                    class="flex flex-col items-center gap-2 border-3 border-brutal shadow-brutal rounded-brutal p-4 bg-brutal-bg"
                >
                    <Counter
                        :key="key"
                        :to="stat.to"
                        :suffix="stat.suffix ?? ''"
                        :decimals="stat.decimals ?? 0"
                        :size="stat.size"
                        :duration="RESET_DELAY"
                        easing="ease-out"
                    />
                    <p class="text-xs font-bold opacity-60 text-center">{{ stat.label }}</p>
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

        <div>
            <h3 class="text-sm font-black mb-3">prefix 前缀（如货币符号）</h3>
            <div class="flex flex-wrap items-center gap-6">
                <Counter :key="key" :to="9999" prefix="$" size="lg" :duration="RESET_DELAY" />
                <Counter :key="key" :to="52800" prefix="¥" size="lg" :duration="RESET_DELAY" />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">separator 千分位分隔符</h3>
            <div class="flex flex-wrap items-center gap-6">
                <Counter :key="key" :to="1234567" separator="," size="lg" :duration="RESET_DELAY" />
                <Counter :key="key" :to="1234567" separator="." size="lg" :duration="RESET_DELAY" />
                <Counter :key="key" :to="1234567" separator="" size="lg" :duration="RESET_DELAY" />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">from 起始值</h3>
            <div class="flex flex-wrap items-center gap-6">
                <Counter :key="key" :from="100" :to="500" size="lg" :duration="RESET_DELAY" />
                <Counter :key="key" :from="1000" :to="0" size="lg" :duration="RESET_DELAY" />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">尺寸：SM / MD / LG / XL</h3>
            <div class="flex flex-wrap items-end gap-6">
                <div class="flex flex-col items-center gap-1">
                    <Counter :key="key" :to="42" size="sm" :duration="RESET_DELAY" />
                    <span class="text-xs font-bold opacity-60">SM</span>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <Counter :key="key" :to="42" size="md" :duration="RESET_DELAY" />
                    <span class="text-xs font-bold opacity-60">MD</span>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <Counter :key="key" :to="42" size="lg" :duration="RESET_DELAY" />
                    <span class="text-xs font-bold opacity-60">LG</span>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <Counter :key="key" :to="42" size="xl" :duration="RESET_DELAY" />
                    <span class="text-xs font-bold opacity-60">XL</span>
                </div>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">complete 事件</h3>
            <div class="flex flex-col items-start gap-2">
                <Counter :key="key" :to="100" size="lg" :duration="RESET_DELAY" @complete="onComplete" />
                <span v-if="completeMessage" class="text-sm font-black text-brutal-success border-3 border-brutal-success px-3 py-1 rounded-brutal shadow-brutal-sm">
                    {{ completeMessage }}
                </span>
            </div>
        </div>
    </div>
</template>
