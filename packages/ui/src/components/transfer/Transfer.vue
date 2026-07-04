<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import Card from '../card/Card.vue'
import Checkbox from '../checkbox/Checkbox.vue'
import Button from '../button/Button.vue'
import Input from '../input/Input.vue'
import { ChevronLeft, ChevronRight, Search } from '@lucide/vue'
import { useLocale } from '@/composables/useLocale'

export interface TransferDataItem {
    key: string | number
    label: string
    disabled?: boolean
}

interface TransferProps {
    modelValue?: (string | number)[]
    data?: TransferDataItem[]
    filterable?: boolean
    filterMethod?: (query: string, item: TransferDataItem) => boolean
    titles?: string[]
    buttonTexts?: string[]
}

const props = withDefaults(defineProps<TransferProps>(), {
    modelValue: () => [],
    data: () => [],
    filterable: false,
    filterMethod: undefined,
    titles: undefined,
    buttonTexts: undefined
})

const emit = defineEmits<{
    'update:modelValue': [value: (string | number)[]]
    change: [value: (string | number)[], direction: 'left' | 'right', movedKeys: (string | number)[]]
}>()

const { t } = useLocale()

// 语言环境回退机制
const resolvedTitles = computed(() => {
    if (props.titles && props.titles.length >= 2) return props.titles
    return [t('transfer.sourceTitle'), t('transfer.targetTitle')]
})

const resolvedButtonTexts = computed(() => {
    if (props.buttonTexts && props.buttonTexts.length >= 2) return props.buttonTexts
    return ['', '']
})

// 左右查询关键词
const leftQuery = ref('')
const rightQuery = ref('')

// 源列表（左侧）和目标列表（右侧）的所有项
const sourceData = computed<TransferDataItem[]>(() => {
    return props.data.filter(item => !props.modelValue.includes(item.key))
})

const targetData = computed<TransferDataItem[]>(() => {
    const keyMap = new Map(props.data.map(item => [item.key, item]))
    return props.modelValue.map(key => keyMap.get(key)).filter((item): item is TransferDataItem => !!item)
})

// 默认过滤方法
const defaultFilterMethod = (query: string, item: TransferDataItem) => {
    return item.label.toLowerCase().includes(query.toLowerCase())
}

const activeFilterMethod = computed(() => {
    return props.filterMethod || defaultFilterMethod
})

// 过滤后的列表
const filteredSourceData = computed<TransferDataItem[]>(() => {
    if (!props.filterable || !leftQuery.value) return sourceData.value
    return sourceData.value.filter(item => activeFilterMethod.value(leftQuery.value, item))
})

const filteredTargetData = computed<TransferDataItem[]>(() => {
    if (!props.filterable || !rightQuery.value) return targetData.value
    return targetData.value.filter(item => activeFilterMethod.value(rightQuery.value, item))
})

// 选中状态（存储被选中的 key）
const leftChecked = ref<(string | number)[]>([])
const rightChecked = ref<(string | number)[]>([])

// 监视 props.modelValue 或 props.data 发生变化时，清理无效的选中项
watch(
    [() => props.modelValue, () => props.data],
    () => {
        const sourceKeys = new Set(sourceData.value.map(item => item.key))
        leftChecked.value = leftChecked.value.filter(key => sourceKeys.has(key))

        const targetKeys = new Set(targetData.value.map(item => item.key))
        rightChecked.value = rightChecked.value.filter(key => targetKeys.has(key))
    },
    { deep: true }
)

// 按钮禁用状态
const leftToRightDisabled = computed(() => leftChecked.value.length === 0)
const rightToLeftDisabled = computed(() => rightChecked.value.length === 0)

// 左侧全选框状态
const leftAllChecked = computed(() => {
    const enabledKeys = filteredSourceData.value.filter(item => !item.disabled).map(item => item.key)
    if (enabledKeys.length === 0) return false
    return enabledKeys.every(key => leftChecked.value.includes(key))
})

const leftIndeterminate = computed(() => {
    const enabledKeys = filteredSourceData.value.filter(item => !item.disabled).map(item => item.key)
    if (enabledKeys.length === 0) return false
    const checkedCount = enabledKeys.filter(key => leftChecked.value.includes(key)).length
    return checkedCount > 0 && checkedCount < enabledKeys.length
})

// 右侧全选框状态
const rightAllChecked = computed(() => {
    const enabledKeys = filteredTargetData.value.filter(item => !item.disabled).map(item => item.key)
    if (enabledKeys.length === 0) return false
    return enabledKeys.every(key => rightChecked.value.includes(key))
})

const rightIndeterminate = computed(() => {
    const enabledKeys = filteredTargetData.value.filter(item => !item.disabled).map(item => item.key)
    if (enabledKeys.length === 0) return false
    const checkedCount = enabledKeys.filter(key => rightChecked.value.includes(key)).length
    return checkedCount > 0 && checkedCount < enabledKeys.length
})

// 处理左侧全选点击
const handleLeftAllCheckChange = (checked: boolean | 'indeterminate') => {
    const enabledKeys = filteredSourceData.value.filter(item => !item.disabled).map(item => item.key)
    if (checked === true || checked === 'indeterminate') {
        const uniqueKeys = new Set([...leftChecked.value, ...enabledKeys])
        leftChecked.value = Array.from(uniqueKeys)
    } else {
        leftChecked.value = leftChecked.value.filter(key => !enabledKeys.includes(key))
    }
}

// 处理右侧全选点击
const handleRightAllCheckChange = (checked: boolean | 'indeterminate') => {
    const enabledKeys = filteredTargetData.value.filter(item => !item.disabled).map(item => item.key)
    if (checked === true || checked === 'indeterminate') {
        const uniqueKeys = new Set([...rightChecked.value, ...enabledKeys])
        rightChecked.value = Array.from(uniqueKeys)
    } else {
        rightChecked.value = rightChecked.value.filter(key => !enabledKeys.includes(key))
    }
}

// 切换左侧单项选中状态
const toggleLeftChecked = (item: TransferDataItem) => {
    if (item.disabled) return
    const index = leftChecked.value.indexOf(item.key)
    if (index > -1) {
        leftChecked.value.splice(index, 1)
    } else {
        leftChecked.value.push(item.key)
    }
}

// 切换右侧单项选中状态
const toggleRightChecked = (item: TransferDataItem) => {
    if (item.disabled) return
    const index = rightChecked.value.indexOf(item.key)
    if (index > -1) {
        rightChecked.value.splice(index, 1)
    } else {
        rightChecked.value.push(item.key)
    }
}

// 源列表 -> 目标列表 (左 -> 右)
const addToRight = () => {
    if (leftToRightDisabled.value) return
    const keysToMove = leftChecked.value.filter(key => {
        const item = props.data.find(d => d.key === key)
        return item && !item.disabled
    })
    const newValue = [...props.modelValue, ...keysToMove]
    emit('update:modelValue', newValue)
    emit('change', newValue, 'right', keysToMove)
    leftChecked.value = leftChecked.value.filter(key => !keysToMove.includes(key))
}

// 目标列表 -> 源列表 (右 -> 左)
const addToLeft = () => {
    if (rightToLeftDisabled.value) return
    const keysToMove = rightChecked.value.filter(key => {
        const item = props.data.find(d => d.key === key)
        return item && !item.disabled
    })
    const newValue = props.modelValue.filter(key => !keysToMove.includes(key))
    emit('update:modelValue', newValue)
    emit('change', newValue, 'left', keysToMove)
    rightChecked.value = rightChecked.value.filter(key => !keysToMove.includes(key))
}
</script>

<template>
    <div :class="cn('flex items-stretch justify-center gap-4 text-brutal-fg', $attrs.class as string)">
        <!-- 左侧源列表面板 -->
        <Card
            variant="flat"
            padding="none"
            class="flex flex-col w-[260px] h-[400px] border-3 border-brutal bg-brutal-bg shadow-brutal overflow-hidden rounded-brutal"
        >
            <!-- 头部 -->
            <div class="flex items-center justify-between px-4 py-3 bg-brutal-muted border-b-3 border-brutal select-none">
                <div class="flex items-center gap-2">
                    <Checkbox
                        :checked="leftIndeterminate ? 'indeterminate' : leftAllChecked"
                        size="sm"
                        @update:checked="handleLeftAllCheckChange"
                    />
                    <span class="font-bold text-sm select-none">{{ resolvedTitles[0] }}</span>
                </div>
                <span class="text-xs font-semibold text-brutal-muted-foreground">
                    {{ leftChecked.length }}/{{ filteredSourceData.length }}
                </span>
            </div>

            <!-- 搜索框 -->
            <div v-if="filterable" class="p-2 border-b-3 border-brutal">
                <Input
                    v-model="leftQuery"
                    size="sm"
                    :placeholder="t('transfer.placeholder')"
                    class="w-full"
                    :prefix-icon="Search"
                    clearable
                />
            </div>

            <!-- 列表内容 -->
            <div class="flex-1 overflow-y-auto p-2 space-y-1 bg-brutal-bg">
                <div
                    v-for="item in filteredSourceData"
                    :key="item.key"
                    :class="cn(
                        'flex items-center gap-3 px-2 py-1.5 rounded border border-transparent select-none cursor-pointer transition-colors',
                        item.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'hover:bg-brutal-muted',
                        leftChecked.includes(item.key) && 'bg-brutal-muted border-brutal'
                    )"
                    @click="toggleLeftChecked(item)"
                >
                    <Checkbox
                        :checked="leftChecked.includes(item.key)"
                        :disabled="item.disabled"
                        size="sm"
                        @click.stop
                        @update:checked="() => toggleLeftChecked(item)"
                    />
                    <span class="text-sm font-medium">{{ item.label }}</span>
                </div>
                <div
                    v-if="filteredSourceData.length === 0"
                    class="flex flex-col items-center justify-center h-full text-brutal-muted-foreground text-xs py-8 select-none"
                >
                    {{ t('transfer.emptyText') }}
                </div>
            </div>
        </Card>

        <!-- 中间操作按钮 -->
        <div class="flex flex-col justify-center items-center gap-3 px-2">
            <Button
                variant="default"
                size="sm"
                :disabled="leftToRightDisabled"
                class="flex items-center justify-center gap-1 border-3 border-brutal min-w-[48px] shadow-brutal-sm"
                aria-label="Move selected to right"
                @click="addToRight"
            >
                <span v-if="resolvedButtonTexts[1]" class="text-xs font-bold">{{ resolvedButtonTexts[1] }}</span>
                <ChevronRight class="h-4 w-4" />
            </Button>
            <Button
                variant="default"
                size="sm"
                :disabled="rightToLeftDisabled"
                class="flex items-center justify-center gap-1 border-3 border-brutal min-w-[48px] shadow-brutal-sm"
                aria-label="Move selected to left"
                @click="addToLeft"
            >
                <ChevronLeft class="h-4 w-4" />
                <span v-if="resolvedButtonTexts[0]" class="text-xs font-bold">{{ resolvedButtonTexts[0] }}</span>
            </Button>
        </div>

        <!-- 右侧目标列表面板 -->
        <Card
            variant="flat"
            padding="none"
            class="flex flex-col w-[260px] h-[400px] border-3 border-brutal bg-brutal-bg shadow-brutal overflow-hidden rounded-brutal"
        >
            <!-- 头部 -->
            <div class="flex items-center justify-between px-4 py-3 bg-brutal-muted border-b-3 border-brutal select-none">
                <div class="flex items-center gap-2">
                    <Checkbox
                        :checked="rightIndeterminate ? 'indeterminate' : rightAllChecked"
                        size="sm"
                        @update:checked="handleRightAllCheckChange"
                    />
                    <span class="font-bold text-sm select-none">{{ resolvedTitles[1] }}</span>
                </div>
                <span class="text-xs font-semibold text-brutal-muted-foreground">
                    {{ rightChecked.length }}/{{ filteredTargetData.length }}
                </span>
            </div>

            <!-- 搜索框 -->
            <div v-if="filterable" class="p-2 border-b-3 border-brutal">
                <Input
                    v-model="rightQuery"
                    size="sm"
                    :placeholder="t('transfer.placeholder')"
                    class="w-full"
                    :prefix-icon="Search"
                    clearable
                />
            </div>

            <!-- 列表内容 -->
            <div class="flex-1 overflow-y-auto p-2 space-y-1 bg-brutal-bg">
                <div
                    v-for="item in filteredTargetData"
                    :key="item.key"
                    :class="cn(
                        'flex items-center gap-3 px-2 py-1.5 rounded border border-transparent select-none cursor-pointer transition-colors',
                        item.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'hover:bg-brutal-muted',
                        rightChecked.includes(item.key) && 'bg-brutal-muted border-brutal'
                    )"
                    @click="toggleRightChecked(item)"
                >
                    <Checkbox
                        :checked="rightChecked.includes(item.key)"
                        :disabled="item.disabled"
                        size="sm"
                        @click.stop
                        @update:checked="() => toggleRightChecked(item)"
                    />
                    <span class="text-sm font-medium">{{ item.label }}</span>
                </div>
                <div
                    v-if="filteredTargetData.length === 0"
                    class="flex flex-col items-center justify-center h-full text-brutal-muted-foreground text-xs py-8 select-none"
                >
                    {{ t('transfer.emptyText') }}
                </div>
            </div>
        </Card>
    </div>
</template>
