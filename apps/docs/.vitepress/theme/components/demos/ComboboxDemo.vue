<script setup lang="ts">
import { ref } from 'vue'
import { Combobox, ComboboxMulti, Button } from 'brutx-ui-vue'

const selected = ref<string | undefined>(undefined)

const options = [
    { value: 'vue', label: 'Vue' },
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
]

const loading = ref(false)

function toggleLoading() {
    loading.value = true
    setTimeout(() => { loading.value = false }, 2000)
}

const creativeOptions = ref([
    { value: 'vue', label: 'Vue' },
    { value: 'react', label: 'React' },
])
const creativeSelected = ref<string | undefined>(undefined)

function handleCreate(value: string) {
    const optionValue = value.toLowerCase()
    creativeOptions.value.push({ value: optionValue, label: value })
    creativeSelected.value = optionValue
}

const multiOptions = ref([
    { value: 'vue', label: 'Vue' },
    { value: 'react', label: 'React' },
])
const multiSelected = ref<string[]>([])

function handleMultiCreate(value: string) {
    const optionValue = value.toLowerCase()
    multiOptions.value.push({ value: optionValue, label: value })
    multiSelected.value = [...multiSelected.value, optionValue]
}
</script>

<template>
    <div class="w-full max-w-sm space-y-6">
        <Combobox
            v-model="selected"
            :options="options"
            placeholder="请选择框架..."
            search-placeholder="搜索框架..."
        />

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">加载状态</p>
            <p class="text-xs opacity-60">点击按钮触发 loading，列表底部显示 Spinner。</p>
            <div class="flex gap-2">
                <Button variant="outline" size="sm" :disabled="loading" @click="toggleLoading">
                    {{ loading ? '加载中...' : '模拟加载' }}
                </Button>
            </div>
            <Combobox
                v-model="selected"
                :options="options"
                :loading="loading"
                placeholder="请选择框架..."
                search-placeholder="搜索框架..."
            />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">创建选项（单选）</p>
            <p class="text-xs opacity-60">输入无匹配项时显示「创建」选项，创建后关闭下拉。</p>
            <Combobox
                v-model="creativeSelected"
                :options="creativeOptions"
                creative
                placeholder="选择或创建..."
                search-placeholder="搜索或输入..."
                @create="handleCreate"
            />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">创建选项（多选）</p>
            <p class="text-xs opacity-60">创建后不关闭下拉，可继续创建多项。</p>
            <ComboboxMulti
                v-model="multiSelected"
                :options="multiOptions"
                creative
                placeholder="选择或创建..."
                search-placeholder="搜索或输入..."
                @create="handleMultiCreate"
            />
        </div>
    </div>
</template>
