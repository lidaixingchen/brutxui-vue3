<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { Search } from '@lucide/vue'
import { commandInputWrapperVariants } from './command-variants'
import { injectCommandRootContext } from './command-context'

interface CommandInputProps {
    modelValue?: string
    placeholder?: string
    class?: ClassValue
}

const props = withDefaults(defineProps<CommandInputProps>(), {
    modelValue: undefined,
    placeholder: undefined,
    class: undefined,
})

const { t } = useLocale()
const rootContext = injectCommandRootContext()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('command.placeholder'))

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// 初始化以 props.modelValue 为准，缺失时回退到共享 filterSearch，覆盖「重挂载时输入框与过滤状态失步」的场景
const searchValue = ref(props.modelValue ?? rootContext.filterSearch.value)

function applyFilterSearch(val: string) {
    rootContext.filterSearch.value = val
}

// 父级 v-model 驱动：只回写 searchValue，由下方 watcher 同步到 filterSearch，不再向父组件回 emit
watch(() => props.modelValue, (val) => {
    const next = val ?? ''
    if (next !== searchValue.value) searchValue.value = next
})

// searchValue 是唯一写入口：变化时同步 filterSearch
watch(searchValue, (val) => {
    applyFilterSearch(val)
})

// 共享过滤状态被外部重置（如选中命令后经 Command 暴露的 filterSearch 清空搜索）时回写输入框；
// 与 props.modelValue 的回写去重：写入相同值时 Vue 不会再次触发，避免回环
watch(rootContext.filterSearch, (val) => {
    const next = val ?? ''
    if (next !== searchValue.value) searchValue.value = next
})

applyFilterSearch(searchValue.value)

function handleInput(event: Event) {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) return
    searchValue.value = target.value
    // 仅在真正的用户输入处 emit，避免父驱动更新被再次回显形成多余事件
    emit('update:modelValue', target.value)
}

const wrapperClasses = computed(() =>
    cn(commandInputWrapperVariants())
)

const inputClasses = computed(() =>
    cn(
        'flex h-full w-full bg-transparent py-3',
        'text-sm font-bold text-brutal-fg placeholder:text-brutal-placeholder',
        'outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.class
    )
)
</script>

<template>
    <div :class="wrapperClasses" data-slot="command-input">
        <Search class="size-5 shrink-0 stroke-[3] text-brutal-fg" />
        <input
            :value="searchValue"
            :placeholder="resolvedPlaceholder"
            :class="inputClasses"
            type="text"
            role="searchbox"
            aria-autocomplete="list"
            :aria-label="t('command.searchLabel')"
            @input="handleInput"
        >
    </div>
</template>
