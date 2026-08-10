import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { isDev } from '@/lib/env'

export interface UseSelectionDisplayTextOptions<TItem> {
    selectedItems: MaybeRefOrGetter<readonly TItem[]>
    placeholder: MaybeRefOrGetter<string>
    multiple?: MaybeRefOrGetter<boolean | undefined>
    maxDisplay?: MaybeRefOrGetter<number | undefined>
    getLabel?: (item: TItem) => string
    /**
     * 超出 maxDisplay 时的数量文案（默认 `${count} selected` 为英文硬编码）。
     * 多语言场景请提供此回调，如 `(count) => t('xxx.selectedCount', { count })`。
     */
    formatCount?: (count: number) => string
    formatList?: (labels: string[]) => string
}

function defaultGetLabel<TItem>(item: TItem): string {
    if (typeof item === 'string') return item
    if (typeof item === 'number' || typeof item === 'boolean') return String(item)
    if (item && typeof item === 'object' && 'label' in item) {
        const label = (item as { label?: unknown }).label
        // 空白/纯空格标签视为无效，避免多选列表渲染出 "A, , C" 畸形文案
        if (typeof label === 'string' && label.trim() !== '') return label
    }
    // 对象缺少可用 label 时回退到 String()，避免单选模式显示空白（该空串会掩盖
    // "已选中" 状态）；null/undefined 仍返回空串
    return typeof item === 'object' && item !== null ? String(item) : ''
}

// ListFormat 无状态，提升为模块级单例避免每次 computed 重算都重新构造
const listFormatter =
    typeof Intl !== 'undefined' && 'ListFormat' in Intl
        ? new Intl.ListFormat(undefined, { style: 'long', type: 'conjunction' })
        : null

function defaultFormatList(labels: string[]): string {
    if (listFormatter) {
        return listFormatter.format(labels)
    }
    return labels.join(', ')
}

export function useSelectionDisplayText<TItem>(
    options: UseSelectionDisplayTextOptions<TItem>
): ComputedRef<string> {
    return computed(() => {
        const items = [...toValue(options.selectedItems)]
        const placeholder = toValue(options.placeholder)
        const getLabel = options.getLabel ?? defaultGetLabel

        if (!toValue(options.multiple)) {
            // 非多选模式下仅展示首项，其余选中项被静默忽略；dev 环境给出提示避免调用方误以为展示完整选中集
            if (items.length > 1 && isDev()) {
                console.warn('[useSelectionDisplayText] multiple is false but multiple items are selected; only the first item is displayed.')
            }
            const selected = items[0]
            return selected ? getLabel(selected) : placeholder
        }

        if (items.length === 0) return placeholder

        const maxDisplay = toValue(options.maxDisplay) ?? 3
        if (items.length <= maxDisplay) {
            const formatList = options.formatList ?? defaultFormatList
            return formatList(items.map(getLabel))
        }

        return options.formatCount?.(items.length) ?? `${items.length} selected`
    })
}
