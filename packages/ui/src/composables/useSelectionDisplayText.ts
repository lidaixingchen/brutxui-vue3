import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'

export interface UseSelectionDisplayTextOptions<TItem> {
    selectedItems: MaybeRefOrGetter<readonly TItem[]>
    placeholder: MaybeRefOrGetter<string>
    multiple?: MaybeRefOrGetter<boolean | undefined>
    maxDisplay?: MaybeRefOrGetter<number | undefined>
    getLabel?: (item: TItem) => string
    formatCount?: (count: number) => string
    formatList?: (labels: string[]) => string
}

function defaultGetLabel<TItem>(item: TItem): string {
    if (typeof item === 'string') return item
    if (typeof item === 'number' || typeof item === 'boolean') return String(item)
    if (item && typeof item === 'object' && 'label' in item) {
        const label = (item as { label?: unknown }).label
        if (typeof label === 'string') return label
    }
    return ''
}

function defaultFormatList(labels: string[]): string {
    if (typeof Intl !== 'undefined' && 'ListFormat' in Intl) {
        const listFormatter = new Intl.ListFormat(undefined, { style: 'long', type: 'conjunction' })
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
