<script setup lang="ts">
import { computed, ref, shallowRef, useId, watch } from 'vue'
import { ChevronsUpDown, X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import PopoverContent from '../popover/PopoverContent.vue'
import Input from '../input/Input.vue'
import { useLocale } from '@/composables/useLocale'
import { useClearableSelection } from '@/composables/useClearableSelection'
import { useSelectableTrigger } from '@/composables/useSelectableTrigger'
import { useSelectionDisplayText } from '@/composables/useSelectionDisplayText'
import { treeSelectTriggerVariants } from './tree-select-variants'
import { type TreeNode } from './tree-select-types'
import { type VariantProps } from 'class-variance-authority'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import TreeSelectNode from './TreeSelectNode.vue'

type TreeSelectVariantProps = VariantProps<typeof treeSelectTriggerVariants>
type TreeSelectModelValue = string | string[] | undefined

interface TreeSelectProps {
    /** 树形数据 */
    nodes: TreeNode[]
    /** 选中值（单选为 string，多选为 string[]） */
    modelValue?: string | string[]
    /** 受控展开状态（与 update:open 配合实现 v-model:open） */
    open?: boolean
    /** 是否支持多选 */
    multiple?: boolean
    /** 是否可搜索 */
    searchable?: boolean
    /** 占位文本 */
    placeholder?: string
    /** 搜索框占位文本 */
    searchPlaceholder?: string
    /** 无结果文本 */
    emptyText?: string
    /** 是否可清除 */
    clearable?: boolean
    /** 是否禁用 */
    disabled?: boolean
    /** 尺寸 */
    size?: NonNullable<TreeSelectVariantProps['size']>
    /** ARIA 标签 */
    ariaLabel?: string
    /** 最多显示标签数（多选模式） */
    maxDisplay?: number
    /** 下拉列表最大高度（CSS 值） */
    maxHeight?: string
    /** 下拉列表自定义类名 */
    dropdownClass?: string
    /** 自定义类名 */
    class?: string
    /** 主图标尺寸 */
    iconSize?: IconSize
    /** 下拉项的变体（选中高亮颜色） */
    itemVariant?: 'default' | 'primary' | 'secondary'
}

const props = withDefaults(defineProps<TreeSelectProps>(), {
    modelValue: undefined,
    open: undefined,
    multiple: false,
    searchable: true,
    placeholder: undefined,
    searchPlaceholder: undefined,
    emptyText: undefined,
    clearable: false,
    disabled: false,
    size: 'default',
    ariaLabel: undefined,
    maxDisplay: 3,
    maxHeight: '15rem',
    dropdownClass: undefined,
    class: undefined,
    iconSize: 'default',
    itemVariant: 'default',
})

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('treeSelect.placeholder'))
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder ?? t('treeSelect.searchPlaceholder'))
const resolvedEmptyText = computed(() => props.emptyText ?? t('treeSelect.emptyText'))

const emit = defineEmits<{
    'update:modelValue': [value: string | string[] | undefined]
    'update:open': [value: boolean]
    'select': [node: TreeNode | TreeNode[] | undefined]
    'open-change': [open: boolean]
}>()

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
const searchQuery = ref('')
// 使用 shallowRef 避免对 Set 进行深层响应式转换
const expandedIds = shallowRef<Set<string>>(new Set())
const focusedId = ref<string | undefined>(undefined)

// 迭代式扁平化所有节点（用于查找）- 避免递归栈溢出
function flattenNodes(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = []
    const stack = [...nodes]

    while (stack.length > 0) {
        const node = stack.pop()!
        result.push(node)
        if (node.children?.length) {
            for (let i = node.children.length - 1; i >= 0; i--) {
                stack.push(node.children[i])
            }
        }
    }
    return result
}

const allNodes = computed(() => flattenNodes(props.nodes))

// 查找节点
function findNodeById(id: string): TreeNode | undefined {
    return allNodes.value.find((n) => n.id === id)
}

// 单选模式：选中的节点
const selectedNode = computed(() => {
    if (props.multiple || !props.modelValue || typeof props.modelValue !== 'string') return undefined
    return findNodeById(props.modelValue)
})

// 多选模式：选中的节点列表
const selectedNodes = computed(() => {
    if (!props.multiple || !Array.isArray(props.modelValue)) return []
    return props.modelValue.map(findNodeById).filter((n): n is TreeNode => n != null)
})

// 选中 ID 集合（用于递归组件）
const selectedIds = computed(() => {
    if (props.multiple && Array.isArray(props.modelValue)) {
        return new Set(props.modelValue)
    }
    if (typeof props.modelValue === 'string' && props.modelValue) {
        return new Set([props.modelValue])
    }
    return new Set<string>()
})

const displayNodes = computed(() => {
    if (props.multiple) return selectedNodes.value
    return selectedNode.value ? [selectedNode.value] : []
})

const displayText = useSelectionDisplayText({
    selectedItems: displayNodes,
    placeholder: resolvedPlaceholder,
    multiple: () => props.multiple,
    maxDisplay: () => props.maxDisplay,
    getLabel: (node) => node.label,
    formatCount: (count) => t('treeSelect.selectedCount', { count }),
})

// 优化的递归过滤节点 - 缓存小写查询字符串
function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
    const result: TreeNode[] = []
    const lowerQuery = query.toLowerCase()

    for (const node of nodes) {
        const selfMatches = node.label.toLowerCase().includes(lowerQuery)
        let filteredChildren: TreeNode[] | undefined

        if (node.children?.length) {
            filteredChildren = filterTree(node.children, query)
        }

        if (selfMatches || (filteredChildren && filteredChildren.length > 0)) {
            if (filteredChildren && filteredChildren !== node.children) {
                result.push({ ...node, children: filteredChildren })
            } else {
                result.push(node)
            }
        }
    }
    return result
}

// 过滤后的节点
const filteredNodes = computed(() => {
    if (!searchQuery.value) return props.nodes
    return filterTree(props.nodes, searchQuery.value)
})

// 更新焦点节点当搜索结果变化时
watch(filteredNodes, (nodes) => {
    if (open.value && focusedId.value) {
        // 检查当前焦点节点是否仍在过滤结果中（递归检查子节点）
        const isFocusedVisible = flattenNodes(nodes).some(node => node.id === focusedId.value)
        if (!isFocusedVisible) {
            // 焦点节点不在过滤结果中，重置为第一个节点
            const firstNode = nodes[0]
            focusedId.value = firstNode?.id
        }
    }
})

// 更新焦点节点（roving tabindex）
function handleNodeFocus(id: string) {
    focusedId.value = id
}

// 切换展开
function toggleExpand(id: string) {
    const nextSet = new Set(expandedIds.value)
    if (nextSet.has(id)) {
        nextSet.delete(id)
    } else {
        nextSet.add(id)
    }
    expandedIds.value = nextSet
}

// 选择节点
function handleSelect(node: TreeNode) {
    if (node.disabled) return

    if (props.multiple) {
        // 类型验证：多选模式下 modelValue 应为数组
        if (props.modelValue !== undefined && !Array.isArray(props.modelValue)) {
            emit('update:modelValue', [node.id])
            emit('select', [node])
            return
        }

        const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
        const index = current.indexOf(node.id)
        if (index >= 0) {
            current.splice(index, 1)
        } else {
            current.push(node.id)
        }
        emit('update:modelValue', current)
        emit('select', current.map(findNodeById).filter((n): n is TreeNode => n != null))
    } else {
        emit('update:modelValue', node.id)
        emit('select', node)
        open.value = false
        searchQuery.value = ''
    }
}

const {
    showClear,
    handleClear,
    onMouseEnter: onClearableMouseEnter,
    onMouseLeave: onClearableMouseLeave,
} = useClearableSelection<TreeSelectModelValue>({
    modelValue: () => props.modelValue,
    clearable: () => props.clearable,
    disabled: () => props.disabled,
    emptyValue: () => props.multiple ? [] : undefined,
    onClear: (emptyValue) => {
        emit('update:modelValue', emptyValue)
        emit('select', props.multiple ? [] : undefined)
    },
})

watch(open, (isOpen) => {
    emit('open-change', isOpen)
    if (!isOpen) {
        searchQuery.value = ''
        focusedId.value = undefined
    } else {
        // 打开时设置第一个节点为焦点节点（roving tabindex）
        const firstNode = filteredNodes.value[0]
        if (firstNode) {
            focusedId.value = firstNode.id
        }
    }
})

const { triggerClasses } = useSelectableTrigger<TreeSelectModelValue>({
    modelValue: () => props.modelValue,
    baseClass: () => treeSelectTriggerVariants({ size: props.size }),
    class: () => props.class,
})

const triggerIconClasses = computed(() =>
    cn('shrink-0 opacity-50 stroke-3', iconSizeVariants({ size: props.iconSize }))
)

const clearIconClasses = cn(iconSizeVariants({ size: 'sm' }), 'stroke-3')

const triggerRef = ref<HTMLElement | null>(null)

defineExpose({
    open,
    searchQuery,
    selectedNodes,
    expandedIds,
    focus: () => triggerRef.value?.focus(),
})

const contentId = `tree-select-content-${useId()}`
</script>

<template>
    <PopoverRoot v-model:open="open">
        <PopoverTrigger as-child>
            <!-- 修复：使用 div 替代嵌套 button -->
            <div
                role="combobox"
                :aria-expanded="open"
                :aria-controls="open ? contentId : undefined"
                :aria-label="ariaLabel"
                aria-haspopup="listbox"
                :aria-multiselectable="multiple ? 'true' : undefined"
                :tabindex="disabled ? -1 : 0"
                :aria-disabled="disabled"
                :class="triggerClasses"
                @mouseenter="onClearableMouseEnter"
                @mouseleave="onClearableMouseLeave"
                @keydown.enter="!disabled && (open = !open)"
                @keydown.space.prevent="!disabled && (open = !open)"
                @keydown.escape="open = false"
            >
                <span class="truncate">{{ displayText }}</span>
                <span class="flex items-center gap-1">
                    <!-- 修复：清除按钮使用 span + role="button" -->
                    <span
                        v-if="showClear"
                        role="button"
                        :tabindex="disabled ? -1 : 0"
                        class="p-0.5 hover:bg-brutal-muted rounded-brutal focus:outline-none focus:ring-2 focus:ring-brutal-ring"
                        :aria-label="t('treeSelect.clear')"
                        @click="handleClear"
                        @keydown.enter="handleClear"
                        @keydown.space.prevent="handleClear"
                    >
                        <X :class="clearIconClasses" />
                    </span>
                    <ChevronsUpDown :class="triggerIconClasses" />
                </span>
            </div>
        </PopoverTrigger>
        <PopoverContent class="w-(--reka-popover-trigger-width) p-0" align="start">
          <div :id="contentId" class="flex flex-col">
                <!-- 搜索框 -->
                <div v-if="searchable" class="border-b-3 border-brutal p-2">
                    <Input
                        v-model="searchQuery"
                        type="text"
                        size="sm"
                        :placeholder="resolvedSearchPlaceholder"
                        :aria-label="t('treeSelect.search')"
                        class="w-full"
                    />
                </div>
                <!-- 树形列表 - 使用递归组件 -->
                <div
                    class="overflow-y-auto p-1"
                    :class="dropdownClass"
                    :style="{ maxHeight }"
                    role="tree"
                    :aria-label="ariaLabel"
                    :aria-multiselectable="multiple ? 'true' : undefined"
                >
                    <template v-if="filteredNodes.length > 0">
                        <TreeSelectNode
                            v-for="node in filteredNodes"
                            :key="node.id"
                            :node="node"
                            :selected-ids="selectedIds"
                            :expanded-ids="expandedIds"
                            :multiple="multiple"
                            :focused-id="focusedId"
                            :variant="itemVariant"
                            @toggle="toggleExpand"
                            @select="handleSelect"
                            @focus="handleNodeFocus"
                        />
                    </template>
                    <div v-else class="px-2 py-4 text-sm text-brutal-muted-foreground text-center">
                        {{ resolvedEmptyText }}
                    </div>
                </div>
            </div>
        </PopoverContent>
    </PopoverRoot>
</template>
