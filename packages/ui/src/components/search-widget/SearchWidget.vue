<script setup lang="ts">
import { computed } from 'vue'
import { Search } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import Card from '../card/Card.vue'
import CardContent from '../card/CardContent.vue'
import Command from '../command/Command.vue'
import CommandInput from '../command/CommandInput.vue'
import CommandList from '../command/CommandList.vue'
import CommandGroup from '../command/CommandGroup.vue'
import CommandItem from '../command/CommandItem.vue'
import CommandEmpty from '../command/CommandEmpty.vue'
import Spinner from '../spinner/Spinner.vue'
import type { SearchSuggestion } from './types'
import { useSearchWidget } from './useSearchWidget'

export type { SearchSuggestion };

interface SearchWidgetProps {
    placeholder?: string
    suggestions?: SearchSuggestion[]
    recent?: SearchSuggestion[]
    loading?: boolean
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<SearchWidgetProps>(), {
    placeholder: undefined,
    suggestions: () => [],
    recent: () => [],
    loading: false,
    class: undefined,
    iconSize: 'default',
})

const { t } = useLocale()

const emit = defineEmits<{
    search: [value: string]
    select: [suggestion: SearchSuggestion]
}>()

const rootClasses = computed(() => cn('w-full max-w-lg', props.class))

const resolvedPlaceholder = computed(() => props.placeholder ?? t('searchWidget.defaultPlaceholder'))

const {
    query,
    groupedSuggestions,
    showRecent,
    showSuggestions,
    handleSearch,
    handleSelect,
    handleRecentSelect,
} = useSearchWidget({
    suggestions: () => props.suggestions,
    recent: () => props.recent,
    onSearch: value => emit('search', value),
    onSelect: suggestion => emit('select', suggestion),
})

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)

</script>

<template>
    <Card :class="rootClasses" variant="default">
        <CardContent class="p-0">
            <Command disable-filter>
                <CommandInput
                    :placeholder="resolvedPlaceholder"
                    :model-value="query"
                    @update:model-value="handleSearch"
                />
                <CommandList v-if="showSuggestions">
                    <CommandEmpty />
                    <CommandGroup
                        v-for="(groupSuggestions, groupKey) in groupedSuggestions"
                        :key="groupKey"
                        :title="groupKey || undefined"
                    >
                        <CommandItem
                            v-for="suggestion in groupSuggestions"
                            :key="suggestion.value"
                            :value="suggestion.value"
                            @select="handleSelect"
                        >
                            <Search :class="iconClasses" />
                            {{ suggestion.label }}
                        </CommandItem>
                    </CommandGroup>
                    <div v-if="loading" class="flex items-center justify-center py-2">
                        <Spinner size="sm" />
                    </div>
                </CommandList>
                <CommandList v-else-if="showRecent">
                    <CommandGroup :title="t('searchWidget.recentSearches')">
                        <CommandItem
                            v-for="item in recent"
                            :key="item.value"
                            :value="item.value"
                            @select="handleRecentSelect"
                        >
                            <Search :class="iconClasses" />
                            {{ item.label }}
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
            <slot name="actions" />
        </CardContent>
    </Card>
</template>
