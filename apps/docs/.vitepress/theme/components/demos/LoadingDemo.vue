<script setup lang="ts">
import { ref } from 'vue'
import { Loading, vLoading } from 'brutx-ui-vue'

const isLoading1 = ref(false)
const isLoading2 = ref(false)

function toggleLoading1() {
    isLoading1.value = true
    setTimeout(() => {
        isLoading1.value = false
    }, 2000)
}

function toggleLoading2() {
    isLoading2.value = true
    setTimeout(() => {
        isLoading2.value = false
    }, 2000)
}
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">声明式容器加载 Loading</h3>
            <div class="space-y-4">
                <div class="flex gap-4">
                    <button
                        class="inline-flex items-center gap-1.5 text-xs font-bold border-3 border-brutal px-3 py-1.5 rounded-brutal shadow-brutal bg-brutal-yellow transition-all hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none"
                        @click="toggleLoading1"
                    >
                        触发容器加载 (2秒自动关闭)
                    </button>
                </div>
                
                <Loading :loading="isLoading1" text="努力加载中...">
                    <div class="border-3 border-brutal shadow-brutal rounded-brutal p-6 bg-brutal-bg min-h-[160px] flex flex-col justify-center">
                        <h4 class="text-lg font-black mb-2">订单支付明细</h4>
                        <p class="text-xs font-bold opacity-75">应付金额：¥ 199.00</p>
                        <p class="text-xs font-bold opacity-75 mt-1">支付状态：待付</p>
                    </div>
                </Loading>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">指令式加载 v-loading</h3>
            <div class="space-y-4">
                <div class="flex gap-4">
                    <button
                        class="inline-flex items-center gap-1.5 text-xs font-bold border-3 border-brutal px-3 py-1.5 rounded-brutal shadow-brutal bg-brutal-yellow transition-all hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none"
                        @click="toggleLoading2"
                    >
                        触发指令加载 (2秒自动关闭)
                    </button>
                </div>
                
                <ClientOnly>
                    <div
                        v-loading="isLoading2"
                        class="border-3 border-brutal shadow-brutal rounded-brutal p-6 bg-brutal-muted min-h-[160px] flex flex-col justify-center"
                    >
                        <h4 class="text-lg font-black mb-2">用户数据概览</h4>
                        <p class="text-xs font-bold opacity-75">当前在线：3,421 人</p>
                        <p class="text-xs font-bold opacity-75 mt-1">今日流量：15.4 GB</p>
                    </div>
                </ClientOnly>
            </div>
        </div>
    </div>
</template>
