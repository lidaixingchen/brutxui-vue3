<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { ChevronsUpDown, ChevronRight, X } from '@lucide/vue'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import PopoverContent from '../popover/PopoverContent.vue'
import Checkbox from '../checkbox/Checkbox.vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { useClearableSelection } from '@/composables/useClearableSelection'
import { useSelectableTrigger } from '@/composables/useSelectableTrigger'
import { useSelectionDisplayText } from '@/composables/useSelectionDisplayText'
import { cascaderTriggerVariants, cascaderItemVariants, cascaderContentVariants } from './cascader-variants'
import type { CascaderOption, CascaderValue } from './cascader-types'

interface CascaderProps {
    /** Nested options list */
    options: CascaderOption[]
    /** Selected value paths (Single: CascaderValue[], Multiple: CascaderValue[][]) */
    modelValue?: CascaderValue[] | CascaderValue[][]
    /** Popover open state */
    open?: boolean
    /** Whether multiple values can be selected */
    multiple?: boolean
    /** Whether clear button is displayed */
    clearable?: boolean
    /** Whether parent nodes can be selected individually */
    checkStrictly?: boolean
    /** Separator character for path display */
    separator?: string
    /** Maximum number of paths to display in multiple select before collapsing */
    maxDisplay?: number
    /** Size of the trigger button */
    size?: 'sm' | 'default' | 'lg'
    /** Placeholder text */
    placeholder?: string
    /** Whether component is disabled */
    disabled?: boolean
    /** Custom class for dropdown wrapper */
    dropdownClass?: string
    /** Custom class for trigger button */
    class?: string
    /** ARIA Label for accessibility */
    ariaLabel?: string
}

const props = withDefaults(defineProps<CascaderProps>(), {
    modelValue: () => [],
    open: undefined,
    multiple: false,
    clearable: false,
    checkStrictly: false,
    separator: ' / ',
    maxDisplay: 2,
    size: 'default',
    placeholder: undefined,
    disabled: false,
    dropdownClass: undefined,
    class: undefined,
    ariaLabel: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: CascaderValue[] | CascaderValue[][]]
    'update:open': [value: boolean]
    'change': [value: CascaderValue[] | CascaderValue[][]]
    'open-change': [open: boolean]
}>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('cascader.placeholder'))
const resolvedEmptyText = computed(() => t('cascader.emptyText'))

const internalOpen = ref(false)
const open = computed<boolean>({
    get: () => props.open !== undefined ? props.open : internalOpen.value,
    set: (val) => {
        if (props.open === undefined) {
            internalOpen.value = val
        }
        emit('update:open', val)
    },
})

// Current path of options hovered or navigated to
const activePath = ref<CascaderValue[]>([])
// Currently active column index receiving keyboard focus
const activeColumnIndex = ref(0)
// Focused item index inside the active column
const activeItemIndex = ref(-1)

const uid = useId()
const contentId = `${uid}-content`

function getOptionId(colIdx: number, itemIdx: number): string {
    return `${uid}-col-${colIdx}-item-${itemIdx}`
}

const activeDescendantId = computed(() => {
    if (!open.value || activeItemIndex.value < 0) return undefined
    return getOptionId(activeColumnIndex.value, activeItemIndex.value)
})

// Compute dynamically displayed columns based on activePath
const columns = computed(() => {
    const cols: CascaderOption[][] = [props.options]
    let currentOptions = props.options
    for (let i = 0; i < activePath.value.length; i++) {
        const val = activePath.value[i]
        const option = currentOptions.find(opt => opt.value === val)
        if (option && option.children && option.children.length > 0) {
            cols.push(option.children)
            currentOptions = option.children
        } else {
            break
        }
    }
    return cols
})

// Get full option path up to a column and including the option value
function getOptionPath(option: CascaderOption, colIdx: number): CascaderValue[] {
    return [...activePath.value.slice(0, colIdx), option.value]
}

// 子树叶子路径缓存：同一 option 的叶子集合只依赖其子树，渲染期间稳定。
// 缓存避免每个可见选项每次渲染都递归整棵子树（activePath 变化触发
// 全列重渲染时接近 O(n²)）。缓存值只存「相对路径」（option 自身到叶子的
// 值序列，不含祖先前缀），调用方读取时再拼接当前父路径：同一 option 引用
// 挂在多个父节点（共享子树）时，各父路径下都能得到正确的完整叶子路径。
const leafPathsCache = new Map<CascaderOption, CascaderValue[][]>()

// 原地变更（push/splice、修改 children、切换 disabled）不改变 options 引用，
// 必须深度监听才能让叶子缓存失效。代价是每次嵌套变更会全量遍历一次树，
// 数据量极大且高频变更时需评估，必要时可改为由调用方以数据版本号主动失效。
watch(() => props.options, () => {
    leafPathsCache.clear()
}, { deep: true })

// 递归计算 option 到其全部叶子后代的相对路径（不含祖先前缀）。
// disabled 节点不可被勾选：跳过该节点及其整个子树（含其可选后代叶子），
// 与 handleItemClick/toggleCheckbox 对 option.disabled 的拦截语义保持一致
function getRelativeLeafPaths(option: CascaderOption): CascaderValue[][] {
    if (option.disabled) return []
    if (!option.children || option.children.length === 0) {
        return [[option.value]]
    }
    const paths: CascaderValue[][] = []
    for (const child of option.children) {
        for (const leaf of getRelativeLeafPaths(child)) {
            paths.push([option.value, ...leaf])
        }
    }
    return paths
}

// 返回 option 在指定父路径下的完整叶子路径（父路径 + option 自身到叶子的相对路径）
function getLeafPaths(option: CascaderOption, parentPath: CascaderValue[]): CascaderValue[][] {
    // disabled 节点不可被勾选：跳过该节点及其整个子树
    if (option.disabled) return []
    const cached = leafPathsCache.get(option)
    if (cached) {
        return cached.map(leaf => [...parentPath, ...leaf])
    }
    const relativePaths = getRelativeLeafPaths(option)
    leafPathsCache.set(option, relativePaths)
    return relativePaths.map(leaf => [...parentPath, ...leaf])
}

// Check if a specific path is selected
function isPathSelected(path: CascaderValue[]): boolean {
    if (!props.modelValue) return false
    if (props.multiple) {
        if (!Array.isArray(props.modelValue) || props.modelValue.length === 0) return false
        // Ensure structure is correct
        const valArray = props.modelValue as CascaderValue[][]
        return valArray.some(p => isPathEqual(p, path))
    } else {
        if (!Array.isArray(props.modelValue) || props.modelValue.length === 0) return false
        // For single select, modelValue is CascaderValue[]
        const first = props.modelValue[0]
        if (Array.isArray(first)) {
            // Safeguard against invalid model formats
            return false
        }
        return isPathEqual(props.modelValue as CascaderValue[], path)
    }
}

function isPathEqual(p1: CascaderValue[], p2: CascaderValue[]): boolean {
    if (p1.length !== p2.length) return false
    return p1.every((v, i) => v === p2[i])
}

function isPathPrefix(fullPath: CascaderValue[], prefixPath: CascaderValue[]): boolean {
    if (prefixPath.length >= fullPath.length) return false
    return prefixPath.every((v, i) => v === fullPath[i])
}

function isOnSelectedTrail(option: CascaderOption, colIdx: number): boolean {
    if (!props.modelValue) return false
    const optionPath = getOptionPath(option, colIdx)
    if (props.multiple) {
        if (!Array.isArray(props.modelValue) || props.modelValue.length === 0) return false
        const first = props.modelValue[0]
        if (!Array.isArray(first)) return false
        const paths = props.modelValue as CascaderValue[][]
        return paths.some(p => isPathPrefix(p, optionPath))
    } else {
        if (!Array.isArray(props.modelValue)) return false
        if (props.modelValue.length === 0) return false
        return isPathPrefix(props.modelValue as CascaderValue[], optionPath)
    }
}

// Checkbox selection state for an option node
function getOptionCheckState(option: CascaderOption, colIdx: number): 'checked' | 'unchecked' | 'indeterminate' {
    const optionPath = getOptionPath(option, colIdx)
    if (props.checkStrictly) {
        return isPathSelected(optionPath) ? 'checked' : 'unchecked'
    }
    const leaves = getLeafPaths(option, activePath.value.slice(0, colIdx))
    if (leaves.length === 0) return 'unchecked'

    const selectedCount = leaves.filter(p => isPathSelected(p)).length
    if (selectedCount === 0) return 'unchecked'
    if (selectedCount === leaves.length) return 'checked'
    return 'indeterminate'
}

function getCheckboxChecked(option: CascaderOption, colIdx: number): boolean | 'indeterminate' {
    const state = getOptionCheckState(option, colIdx)
    if (state === 'checked') return true
    if (state === 'indeterminate') return 'indeterminate'
    return false
}

// Handle checkbox clicking in multi-select mode
function toggleCheckbox(option: CascaderOption, colIdx: number, checked?: boolean | 'indeterminate') {
    if (option.disabled) return
    const optionPath = getOptionPath(option, colIdx)
    
    if (props.checkStrictly) {
        const current = Array.isArray(props.modelValue) && Array.isArray(props.modelValue[0]) 
            ? [...props.modelValue] as CascaderValue[][] 
            : []
        const index = current.findIndex(p => isPathEqual(p, optionPath))
        
        const shouldSelect = checked !== undefined
            ? checked === true || checked === 'indeterminate'
            : index < 0

        if (shouldSelect) {
            if (index < 0) {
                current.push(optionPath)
            }
        } else {
            if (index >= 0) {
                current.splice(index, 1)
            }
        }
        emit('update:modelValue', current)
        emit('change', current)
    } else {
        const leaves = getLeafPaths(option, activePath.value.slice(0, colIdx))
        const current = Array.isArray(props.modelValue) && (props.modelValue.length === 0 || Array.isArray(props.modelValue[0]))
            ? [...props.modelValue] as CascaderValue[][]
            : []
        const currentState = getOptionCheckState(option, colIdx)
        
        const shouldDeselect = checked !== undefined
            ? checked === false
            : currentState === 'checked'
        
        let next: CascaderValue[][]
        if (shouldDeselect) {
            // Deselect all descendant leaf paths
            next = current.filter(p => !leaves.some(l => isPathEqual(l, p)))
        } else {
            // Select all descendant leaf paths
            next = [...current]
            for (const leaf of leaves) {
                if (!next.some(p => isPathEqual(p, leaf))) {
                    next.push(leaf)
                }
            }
        }
        emit('update:modelValue', next)
        emit('change', next)
    }
}

// Get path labels by traversing options tree
function getPathLabels(path: CascaderValue[]): string[] {
    const labels: string[] = []
    let currentOptions = props.options
    for (const val of path) {
        const opt = currentOptions.find(o => o.value === val)
        if (opt) {
            labels.push(opt.label)
            currentOptions = opt.children || []
        } else {
            break
        }
    }
    return labels
}

const selectedDisplayPaths = computed(() => {
    if (!hasValue.value) return []
    if (props.multiple && Array.isArray(props.modelValue)) {
        return props.modelValue as CascaderValue[][]
    }
    if (Array.isArray(props.modelValue) && props.modelValue.length > 0) {
        const labels = getPathLabels(props.modelValue as CascaderValue[])
        return labels.length > 0 ? [props.modelValue as CascaderValue[]] : []
    }
    return []
})

const { hasValue, triggerClasses } = useSelectableTrigger<CascaderValue[] | CascaderValue[][]>({
    modelValue: () => props.modelValue,
    baseClass: () => cascaderTriggerVariants({ size: props.size }),
    class: () => props.class,
})

const displayText = useSelectionDisplayText({
    selectedItems: selectedDisplayPaths,
    placeholder: resolvedPlaceholder,
    multiple: () => props.multiple,
    maxDisplay: () => props.maxDisplay,
    getLabel: (path) => getPathLabels(path).join(props.separator),
    formatList: (labels) => labels.join(', '),
    formatCount: (count) => t('cascader.selectedCount', { count }),
})

function setActiveItem(option: CascaderOption, colIdx: number) {
    activeColumnIndex.value = colIdx
    const currentColumnOptions = columns.value[colIdx] || []
    activeItemIndex.value = currentColumnOptions.findIndex(o => o.value === option.value)
    activePath.value = [...activePath.value.slice(0, colIdx), option.value]
}

function handleMouseEnter(option: CascaderOption, colIdx: number) {
    if (option.disabled) return
    setActiveItem(option, colIdx)
}

function handleItemClick(option: CascaderOption, colIdx: number) {
    if (option.disabled) return

    setActiveItem(option, colIdx)

    const hasChildren = option.children && option.children.length > 0
    
    if (props.multiple) {
        toggleCheckbox(option, colIdx)
    } else {
        if (!hasChildren || props.checkStrictly) {
            const newPath = [...activePath.value.slice(0, colIdx), option.value]
            emit('update:modelValue', newPath)
            emit('change', newPath)
            if (!hasChildren) {
                open.value = false
            }
        }
    }
}

const {
    showClear,
    handleClear,
    onMouseEnter: onClearableMouseEnter,
    onMouseLeave: onClearableMouseLeave,
} = useClearableSelection<CascaderValue[] | CascaderValue[][]>({
    modelValue: () => props.modelValue,
    clearable: () => props.clearable,
    disabled: () => props.disabled,
    // 清空值形状与模式契约一致：多选为 CascaderValue[][]，单选为 CascaderValue[]
    emptyValue: () => props.multiple ? [] as CascaderValue[][] : [] as CascaderValue[],
    onClear: (emptyValue) => {
        emit('update:modelValue', emptyValue)
        emit('change', emptyValue)
    },
})

// Synchronize keyboard focus state on popover open state transition
watch(open, (isOpen) => {
    emit('open-change', isOpen)
    if (isOpen) {
        const hasValue = Array.isArray(props.modelValue) && props.modelValue.length > 0
        let valPath: CascaderValue[] | null = null
        
        if (hasValue) {
            if (props.multiple) {
                const first = props.modelValue[0]
                if (Array.isArray(first)) {
                    valPath = first as CascaderValue[]
                }
            } else {
                const first = props.modelValue[0]
                if (!Array.isArray(first)) {
                    valPath = props.modelValue as CascaderValue[]
                }
            }
        }
        
        if (valPath && valPath.length > 0) {
            activePath.value = [...valPath]
            // 预选路径可能包含已失效的中间节点：columns 按 activePath 展开，实际列数
            // 可能少于 valPath 长度。clamp 到最后一列，避免 activeColumnIndex 指向
            // 不存在的列导致高亮/键盘导航失效
            const maxColumn = Math.max(0, columns.value.length - 1)
            activeColumnIndex.value = Math.min(valPath.length - 1, maxColumn)
            const currentOptions = columns.value[activeColumnIndex.value] || []
            const activeVal = valPath[activeColumnIndex.value]
            const foundIndex = currentOptions.findIndex(o => o.value === activeVal)
            // 预选值未找到时不高亮任何项（-1），避免错误高亮首项误导用户
            activeItemIndex.value = foundIndex
        } else {
            activePath.value = []
            activeColumnIndex.value = 0
            // 无选中值时不预置高亮：实际焦点仍在触发按钮上，aria-activedescendant
            // 应保持 undefined，直到用户真正开始键盘导航
            activeItemIndex.value = -1
        }
    } else {
        activePath.value = []
        activeColumnIndex.value = 0
        activeItemIndex.value = -1
    }
})

// Keyboard navigation events handling
function handleKeyDown(e: KeyboardEvent) {
    if (props.disabled) return
    
    if (!open.value) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault()
            open.value = true
            return
        }
    }
    
    const currentColumnOptions = columns.value[activeColumnIndex.value] || []
    if (currentColumnOptions.length === 0) return

    // 从当前项沿指定方向查找下一个非 disabled 项（循环）；
    // 全列无可用项时返回 -1：清除高亮（aria-activedescendant 回到 undefined，
    // 焦点保持在触发按钮），避免按键后高亮与 activePath 均无变化的「无响应」观感
    const findNavigableIndex = (direction: 1 | -1): number => {
        const len = currentColumnOptions.length
        if (len === 0) return -1
        const start = activeItemIndex.value === -1
            ? (direction === 1 ? -1 : len)
            : activeItemIndex.value
        for (let step = 1; step <= len; step++) {
            const candidateIdx = (start + direction * step + len) % len
            const candidate = currentColumnOptions[candidateIdx]
            if (candidate && !candidate.disabled) return candidateIdx
        }
        return -1
    }

    switch (e.key) {
        case 'ArrowDown': {
            e.preventDefault()
            activeItemIndex.value = findNavigableIndex(1)
            if (activeItemIndex.value >= 0) {
                const activeVal = currentColumnOptions[activeItemIndex.value].value
                activePath.value = [...activePath.value.slice(0, activeColumnIndex.value), activeVal]
            }
            break
        }
        case 'ArrowUp': {
            e.preventDefault()
            activeItemIndex.value = findNavigableIndex(-1)
            if (activeItemIndex.value >= 0) {
                const activeVal = currentColumnOptions[activeItemIndex.value].value
                activePath.value = [...activePath.value.slice(0, activeColumnIndex.value), activeVal]
            }
            break
        }
        case 'ArrowRight': {
            e.preventDefault()
            const currentOpt = currentColumnOptions[activeItemIndex.value]
            if (currentOpt && currentOpt.children && currentOpt.children.length > 0) {
                activeColumnIndex.value += 1
                activeItemIndex.value = 0
                activePath.value = [...activePath.value.slice(0, activeColumnIndex.value), currentOpt.children[0].value]
            }
            break
        }
        case 'ArrowLeft': {
            e.preventDefault()
            if (activeColumnIndex.value > 0) {
                activeColumnIndex.value -= 1
                const parentVal = activePath.value[activeColumnIndex.value]
                const parentColumnOptions = columns.value[activeColumnIndex.value] || []
                activeItemIndex.value = Math.max(0, parentColumnOptions.findIndex(o => o.value === parentVal))
            }
            break
        }
        case 'Enter':
        case ' ': {
            e.preventDefault()
            const currentOpt = currentColumnOptions[activeItemIndex.value]
            if (currentOpt) {
                handleItemClick(currentOpt, activeColumnIndex.value)
            }
            break
        }
        case 'Escape': {
            e.preventDefault()
            open.value = false
            break
        }
    }
}

function getItemClasses(option: CascaderOption, colIdx: number) {
    const isSelected = isPathSelected(getOptionPath(option, colIdx))
    const isActive = activePath.value[colIdx] === option.value && activeColumnIndex.value === colIdx
    const isTrailActive = activePath.value[colIdx] === option.value
    const onSelectedTrail = isOnSelectedTrail(option, colIdx)

    return cn(
        cascaderItemVariants({
            selected: isSelected,
            // active 与 selected 互斥：选中项固定显示 selected 高亮（bg-brutal-primary），
            // 避免同元素叠加 active（bg-brutal-muted）导致背景色由样式表顺序决定
            active: (isActive || isTrailActive) && !isSelected,
            trail: onSelectedTrail && !isSelected,
        }),
        option.disabled && 'opacity-50 pointer-events-none'
    )
}
</script>

<template>
    <PopoverRoot v-model:open="open">
        <PopoverTrigger as-child>
            <div
                role="combobox"
                :aria-expanded="open"
                :aria-label="ariaLabel"
                :tabindex="disabled ? -1 : 0"
                :aria-disabled="disabled"
                :aria-controls="open ? contentId : undefined"
                :aria-activedescendant="activeDescendantId"
                :class="triggerClasses"
                @mouseenter="onClearableMouseEnter"
                @mouseleave="onClearableMouseLeave"
                @keydown="handleKeyDown"
            >
                <span class="truncate">{{ displayText }}</span>
                <span class="flex items-center gap-1">
                    <!-- 与 lib/utils FOCUS_OUTLINE_CLASSES 保持一致 -->
                    <span
                        v-if="showClear"
                        role="button"
                        :tabindex="disabled ? -1 : 0"
                        class="p-0.5 hover:bg-brutal-muted rounded-brutal focus-visible:outline-2 focus-visible:outline-brutal-ring focus-visible:outline-offset-2"
                        @click="handleClear"
                        @keydown.enter="handleClear"
                        @keydown.space.prevent="handleClear"
                    >
                        <X class="w-3.5 h-3.5 stroke-3" />
                    </span>
                    <ChevronsUpDown class="shrink-0 opacity-50 stroke-3 w-4 h-4" />
                </span>
            </div>
        </PopoverTrigger>
        <PopoverContent :class="cn(cascaderContentVariants(), 'p-0 !w-auto', dropdownClass)" align="start">
            <div v-if="options.length === 0" class="px-4 py-6 text-sm text-brutal-muted-foreground text-center">
                {{ resolvedEmptyText }}
            </div>
            <div v-else :id="contentId" class="grid grid-flow-col auto-cols-[180px] divide-x-3 divide-brutal h-64 overflow-x-auto overflow-y-hidden w-max bg-brutal-bg text-brutal-fg">
                <div
                    v-for="(col, colIdx) in columns"
                    :key="colIdx"
                    role="listbox"
                    class="overflow-y-auto p-1 flex flex-col gap-1 max-h-full"
                >
                    <div
                        v-for="(option, optIdx) in col"
                        :id="getOptionId(colIdx, optIdx)"
                        :key="option.value"
                        role="option"
                        :aria-selected="isPathSelected(getOptionPath(option, colIdx))"
                        :class="getItemClasses(option, colIdx)"
                        @mouseenter="handleMouseEnter(option, colIdx)"
                        @click="handleItemClick(option, colIdx)"
                    >
                        <div class="flex items-center gap-2 truncate">
                            <Checkbox
                                v-if="multiple"
                                :checked="getCheckboxChecked(option, colIdx)"
                                size="sm"
                                @update:checked="(checked) => toggleCheckbox(option, colIdx, checked)"
                                @click.stop
                            />
                            <span class="truncate">{{ option.label }}</span>
                        </div>
                        <ChevronRight
                            v-if="option.children && option.children.length > 0"
                            class="w-4 h-4 shrink-0 stroke-3"
                        />
                    </div>
                </div>
            </div>
        </PopoverContent>
    </PopoverRoot>
</template>
