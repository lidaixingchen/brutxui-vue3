<script setup lang="ts">
import { computed, ref, watch, type ComputedRef } from 'vue'
import { cn } from '@/lib/utils'
import Card from '../card/Card.vue'
import Checkbox from '../checkbox/Checkbox.vue'
import Button from '../button/Button.vue'
import Input from '../input/Input.vue'
import { ChevronLeft, ChevronRight, Search } from '@lucide/vue'
import { useLocale } from '@/composables/useLocale'
import { useTransferPanelSelection } from '@/composables/useTransferPanelSelection'
import { transferItemVariants } from './transfer-variants'
import type { TransferDataItem } from './types'

interface TransferProps {
    class?: string
    modelValue?: (string | number)[]
    data?: TransferDataItem[]
    filterable?: boolean
    filterMethod?: (query: string, item: TransferDataItem) => boolean
    titles?: string[]
    buttonTexts?: string[]
    /** 左右面板宽度（像素），默认 260 */
    panelWidth?: number
    /** 左右面板高度（像素），默认 400 */
    panelHeight?: number
}

const props = withDefaults(defineProps<TransferProps>(), {
    class: undefined,
    modelValue: () => [],
    data: () => [],
    filterable: false,
    filterMethod: undefined,
    titles: undefined,
    buttonTexts: undefined,
    panelWidth: 260,
    panelHeight: 400,
})

const emit = defineEmits<{
    'update:modelValue': [value: (string | number)[]]
    change: [value: (string | number)[], direction: 'left' | 'right', movedKeys: (string | number)[]]
}>()

const { t } = useLocale()

const rootClasses = computed(() => cn(
    'flex w-full min-w-0 max-w-full flex-col items-stretch justify-center gap-4 text-brutal-fg md:flex-row',
    props.class,
))

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

const panelStyle = computed(() => ({
    width: `${props.panelWidth}px`,
    height: `${props.panelHeight}px`,
}))

const dataMap = computed(() => new Map(props.data.map(item => [item.key, item])))

// 源列表（左侧）和目标列表（右侧）的所有项
const sourceData = computed<TransferDataItem[]>(() => {
    const selectedSet = new Set(props.modelValue)
    return props.data.filter(item => !selectedSet.has(item.key))
})

const targetData = computed<TransferDataItem[]>(() => {
    const uniqueKeys = Array.from(new Set(props.modelValue))
    return uniqueKeys.map(key => dataMap.value.get(key)).filter((item): item is TransferDataItem => !!item)
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

const {
    checked: leftChecked,
    allChecked: leftAllChecked,
    indeterminate: leftIndeterminate,
    handleAllCheckChange: handleLeftAllCheckChange,
    toggleItem: toggleLeftChecked,
    removeKeys: removeLeftCheckedKeys,
    pruneKeys: pruneLeftCheckedKeys,
} = useTransferPanelSelection({
    items: () => filteredSourceData.value,
})

const {
    checked: rightChecked,
    allChecked: rightAllChecked,
    indeterminate: rightIndeterminate,
    handleAllCheckChange: handleRightAllCheckChange,
    toggleItem: toggleRightChecked,
    removeKeys: removeRightCheckedKeys,
    pruneKeys: pruneRightCheckedKeys,
} = useTransferPanelSelection({
    items: () => filteredTargetData.value,
})

const leftCheckedSet: ComputedRef<ReadonlySet<TransferDataItem['key']>> = computed(
    (): ReadonlySet<TransferDataItem['key']> => new Set<TransferDataItem['key']>(leftChecked.value),
)
const rightCheckedSet: ComputedRef<ReadonlySet<TransferDataItem['key']>> = computed(
    (): ReadonlySet<TransferDataItem['key']> => new Set<TransferDataItem['key']>(rightChecked.value),
)

const leftHighlightedKey = ref<TransferDataItem['key']>()
const rightHighlightedKey = ref<TransferDataItem['key']>()
const leftFocusVisibleKey = ref<TransferDataItem['key']>()
const rightFocusVisibleKey = ref<TransferDataItem['key']>()
const itemClasses = computed(() => cn(transferItemVariants()))

const leftMovableKeys = computed(() => {
    const movableKeys = new Set(sourceData.value.filter(item => !item.disabled).map(item => item.key))
    return leftChecked.value.filter(key => movableKeys.has(key))
})
const rightMovableKeys = computed(() => {
    const movableKeys = new Set(targetData.value.filter(item => !item.disabled).map(item => item.key))
    return rightChecked.value.filter(key => movableKeys.has(key))
})

// 监视 props.modelValue 或 props.data 发生变化时，清理无效的选中项
watch(
    [() => props.modelValue, () => props.data],
    () => {
        pruneLeftCheckedKeys(sourceData.value)
        pruneRightCheckedKeys(targetData.value)
        removeLeftCheckedKeys(sourceData.value.filter(item => item.disabled).map(item => item.key))
        removeRightCheckedKeys(targetData.value.filter(item => item.disabled).map(item => item.key))
    },
    { deep: true }
)

watch([filteredSourceData, filteredTargetData], ([sourceItems, targetItems]) => {
    if (leftHighlightedKey.value !== undefined && !sourceItems.some(item => item.key === leftHighlightedKey.value)) {
        leftHighlightedKey.value = undefined
    }
    if (rightHighlightedKey.value !== undefined && !targetItems.some(item => item.key === rightHighlightedKey.value)) {
        rightHighlightedKey.value = undefined
    }
    if (leftFocusVisibleKey.value !== undefined && !sourceItems.some(item => item.key === leftFocusVisibleKey.value)) {
        leftFocusVisibleKey.value = undefined
    }
    if (rightFocusVisibleKey.value !== undefined && !targetItems.some(item => item.key === rightFocusVisibleKey.value)) {
        rightFocusVisibleKey.value = undefined
    }
})

// 按钮禁用状态
const leftToRightDisabled = computed(() => leftMovableKeys.value.length === 0)
const rightToLeftDisabled = computed(() => rightMovableKeys.value.length === 0)

// 源列表 -> 目标列表 (左 -> 右)
const addToRight = () => {
    if (leftToRightDisabled.value) return
    const keysToMove = leftMovableKeys.value
    const newValue = Array.from(new Set([...props.modelValue, ...keysToMove]))
    emit('update:modelValue', newValue)
    emit('change', newValue, 'right', keysToMove)
    removeLeftCheckedKeys(leftChecked.value)
}

// 目标列表 -> 源列表 (右 -> 左)
const addToLeft = () => {
    if (rightToLeftDisabled.value) return
    const keysToMove = rightMovableKeys.value
    const moveSet = new Set(keysToMove)
    const newValue = props.modelValue.filter(key => !moveSet.has(key))
    emit('update:modelValue', newValue)
    emit('change', newValue, 'left', keysToMove)
    removeRightCheckedKeys(rightChecked.value)
}

function handleLeftMouseEnter(item: TransferDataItem) {
    leftHighlightedKey.value = item.disabled ? undefined : item.key
}

function handleRightMouseEnter(item: TransferDataItem) {
    rightHighlightedKey.value = item.disabled ? undefined : item.key
}

function handleLeftMouseLeave(item: TransferDataItem) {
    if (leftHighlightedKey.value === item.key) leftHighlightedKey.value = undefined
}

function handleRightMouseLeave(item: TransferDataItem) {
    if (rightHighlightedKey.value === item.key) rightHighlightedKey.value = undefined
}

function isLeftHighlighted(item: TransferDataItem): boolean {
    return !item.disabled
        && (leftHighlightedKey.value === item.key
            || (leftHighlightedKey.value === undefined && leftFocusVisibleKey.value === item.key))
}

function isRightHighlighted(item: TransferDataItem): boolean {
    return !item.disabled
        && (rightHighlightedKey.value === item.key
            || (rightHighlightedKey.value === undefined && rightFocusVisibleKey.value === item.key))
}

function handleLeftFocusIn(item: TransferDataItem, event: FocusEvent) {
    const target = event.target
    if (!item.disabled && target instanceof HTMLElement && target.matches(':focus-visible')) {
        leftFocusVisibleKey.value = item.key
    }
}

function handleRightFocusIn(item: TransferDataItem, event: FocusEvent) {
    const target = event.target
    if (!item.disabled && target instanceof HTMLElement && target.matches(':focus-visible')) {
        rightFocusVisibleKey.value = item.key
    }
}

function handleLeftFocusOut(item: TransferDataItem, event: FocusEvent) {
    if (leftFocusVisibleKey.value !== item.key) return
    const row = event.currentTarget as HTMLElement
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && row.contains(nextTarget)) return
    leftFocusVisibleKey.value = undefined
}

function handleRightFocusOut(item: TransferDataItem, event: FocusEvent) {
    if (rightFocusVisibleKey.value !== item.key) return
    const row = event.currentTarget as HTMLElement
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && row.contains(nextTarget)) return
    rightFocusVisibleKey.value = undefined
}
</script>

<template>
    <div :class="rootClasses">
        <!-- 左侧源列表面板 -->
        <Card
            variant="flat"
            padding="none"
            class="flex flex-col max-w-full border-3 border-brutal bg-brutal-bg shadow-brutal overflow-hidden rounded-brutal"
            :style="panelStyle"
        >
            <!-- 头部 -->
            <div class="flex items-center justify-between px-4 py-3 bg-brutal-muted border-b-3 border-brutal select-none">
                <div class="flex items-center gap-2">
                    <Checkbox
                        :checked="leftIndeterminate ? 'indeterminate' : leftAllChecked"
                        size="sm"
                        @update:checked="handleLeftAllCheckChange"
                    />
                    <span class="min-w-0 break-words font-bold text-sm select-none">{{ resolvedTitles[0] }}</span>
                </div>
                <span class="text-xs font-semibold text-brutal-muted-foreground">
                    {{ leftMovableKeys.length }}/{{ filteredSourceData.length }}
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
                    :class="itemClasses"
                    data-slot="transfer-item"
                    :data-highlighted="isLeftHighlighted(item) ? '' : undefined"
                    :data-focus-visible="leftFocusVisibleKey === item.key ? '' : undefined"
                    :data-disabled="item.disabled ? '' : undefined"
                    @mouseenter="handleLeftMouseEnter(item)"
                    @mouseleave="handleLeftMouseLeave(item)"
                    @focusin="handleLeftFocusIn(item, $event)"
                    @focusout="handleLeftFocusOut(item, $event)"
                    @click="toggleLeftChecked(item)"
                >
                    <Checkbox
                        :checked="leftCheckedSet.has(item.key)"
                        :disabled="item.disabled"
                        size="sm"
                        @click.stop
                        @update:checked="() => toggleLeftChecked(item)"
                    />
                    <span class="min-w-0 break-words text-sm font-medium">{{ item.label }}</span>
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
        <div class="flex flex-row md:flex-col justify-center items-center gap-3 px-2 py-1 md:py-0">
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
            class="flex flex-col max-w-full border-3 border-brutal bg-brutal-bg shadow-brutal overflow-hidden rounded-brutal"
            :style="panelStyle"
        >
            <!-- 头部 -->
            <div class="flex items-center justify-between px-4 py-3 bg-brutal-muted border-b-3 border-brutal select-none">
                <div class="flex items-center gap-2">
                    <Checkbox
                        :checked="rightIndeterminate ? 'indeterminate' : rightAllChecked"
                        size="sm"
                        @update:checked="handleRightAllCheckChange"
                    />
                    <span class="min-w-0 break-words font-bold text-sm select-none">{{ resolvedTitles[1] }}</span>
                </div>
                <span class="text-xs font-semibold text-brutal-muted-foreground">
                    {{ rightMovableKeys.length }}/{{ filteredTargetData.length }}
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
                    :class="itemClasses"
                    data-slot="transfer-item"
                    :data-highlighted="isRightHighlighted(item) ? '' : undefined"
                    :data-focus-visible="rightFocusVisibleKey === item.key ? '' : undefined"
                    :data-disabled="item.disabled ? '' : undefined"
                    @mouseenter="handleRightMouseEnter(item)"
                    @mouseleave="handleRightMouseLeave(item)"
                    @focusin="handleRightFocusIn(item, $event)"
                    @focusout="handleRightFocusOut(item, $event)"
                    @click="toggleRightChecked(item)"
                >
                    <Checkbox
                        :checked="rightCheckedSet.has(item.key)"
                        :disabled="item.disabled"
                        size="sm"
                        @click.stop
                        @update:checked="() => toggleRightChecked(item)"
                    />
                    <span class="min-w-0 break-words text-sm font-medium">{{ item.label }}</span>
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
