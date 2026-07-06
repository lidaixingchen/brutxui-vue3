import { computed, ref, type MaybeRefOrGetter, toValue } from 'vue'
import type { SearchSuggestion } from './types'

interface UseSearchWidgetOptions {
    suggestions: MaybeRefOrGetter<SearchSuggestion[]>
    recent: MaybeRefOrGetter<SearchSuggestion[]>
    onSearch: (value: string) => void
    onSelect: (suggestion: SearchSuggestion) => void
}

export function useSearchWidget(options: UseSearchWidgetOptions) {
    const query = ref('')

    const filteredSuggestions = computed(() => {
        if (!query.value) return []
        const normalizedQuery = query.value.toLowerCase()
        return toValue(options.suggestions).filter(suggestion =>
            suggestion.label.toLowerCase().includes(normalizedQuery)
        )
    })

    const groupedSuggestions = computed(() => {
        const groups: Record<string, SearchSuggestion[]> = {}
        for (const suggestion of filteredSuggestions.value) {
            const group = suggestion.group ?? ''
            if (!groups[group]) groups[group] = []
            groups[group].push(suggestion)
        }
        return groups
    })

    const showRecent = computed(() => !query.value && toValue(options.recent).length > 0)
    const showSuggestions = computed(() => !!query.value)

    function handleSearch(value: string) {
        query.value = value
        options.onSearch(value)
    }

    function handleSelect(value: string) {
        const suggestion = toValue(options.suggestions).find(item => item.value === value)
        if (suggestion) {
            options.onSelect(suggestion)
        }
    }

    function handleRecentSelect(value: string) {
        const suggestion = toValue(options.recent).find(item => item.value === value)
        if (!suggestion) return
        query.value = suggestion.label
        options.onSelect(suggestion)
    }

    return {
        query,
        filteredSuggestions,
        groupedSuggestions,
        showRecent,
        showSuggestions,
        handleSearch,
        handleSelect,
        handleRecentSelect,
    }
}
