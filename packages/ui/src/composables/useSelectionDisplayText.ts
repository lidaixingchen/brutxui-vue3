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
        // 空白/纯空格标签视为无效
        if (typeof label === 'string' && label.trim() !== '') return label
    }
    // 无可用 label 返回空串，由调用侧决定回退：
    // 单选路径回退 placeholder，多选列表路径过滤空标签项（不把 [object Object]
    // 之类的内部对象表示暴露给用户）
    return ''
}

// ListFormat 无状态，提升为模块级单例避免每次 computed 重算都重新构造。
// 注意：实例在模块加载时以当时的默认 locale 创建，宿主应用运行时动态切换 locale
// 不会反映到默认列表文案中；动态 locale 场景请通过 formatList 覆盖
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
            // 选中项无可用标签（getLabel 返回空串）时回退 placeholder，
            // 避免显示空白掩盖「已选中」状态
            const label = selected ? getLabel(selected) : ''
            return label || placeholder
        }

        if (items.length === 0) return placeholder

        const maxDisplay = toValue(options.maxDisplay) ?? 3
        if (items.length <= maxDisplay) {
            const formatList = options.formatList ?? defaultFormatList
            // 过滤无可用标签的项（getLabel 返回空串），避免渲染出 "A, , C" 畸形文案
            return formatList(items.map(getLabel).filter((label) => label !== ''))
        }

        return options.formatCount?.(items.length) ?? `${items.length} selected`
    })
}
