<script setup lang="ts">
import { ref } from 'vue'
import { useData } from 'vitepress'
import { Calendar } from 'brutx-ui-vue/calendar'

const { lang } = useData()

const selectedDate = ref<Date | null>(null)
const rangeDate = ref<Date[] | null>(null)
</script>

<template>
    <div class="w-full min-w-0 space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">基础用法</h3>
            <div class="flex w-full min-w-0 justify-center">
                <Calendar :locale="lang" />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">v-model 绑定（选中日期：{{ selectedDate ? selectedDate.toLocaleDateString() : '未选择' }}）</h3>
            <div class="flex w-full min-w-0 justify-center">
                <Calendar v-model="selectedDate" :locale="lang" />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">日期范围选择（isRange）</h3>
            <div class="flex w-full min-w-0 flex-col items-center gap-2">
                <span v-if="rangeDate && rangeDate.length === 2" class="text-xs font-bold">
                    {{ rangeDate[0].toLocaleDateString() }} — {{ rangeDate[1].toLocaleDateString() }}
                </span>
                <span v-else class="text-xs font-bold opacity-60">点击选择起始日期，再点击选择结束日期</span>
                <Calendar v-model="rangeDate" :locale="lang" :is-range="true" />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">禁用状态</h3>
            <div class="flex w-full min-w-0 justify-center">
                <Calendar :locale="lang" :disabled="true" />
            </div>
        </div>
    </div>
</template>
