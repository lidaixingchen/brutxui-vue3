<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, ChevronsUpDown } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { buttonVariants } from '../button/button-variants'
import { comboboxTriggerVariants, comboboxContentVariants, comboboxCheckboxVariants } from './combobox-variants'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import PopoverContent from '../popover/PopoverContent.vue'
import Command from '../command/Command.vue'
import CommandInput from '../command/CommandInput.vue'
import CommandList from '../command/CommandList.vue'
import CommandEmpty from '../command/CommandEmpty.vue'
import CommandGroup from '../command/CommandGroup.vue'
import CommandItem from '../command/CommandItem.vue'
import Spinner from '../spinner/Spinner.vue'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import { type ComboboxOption } from './combobox-types'

const DEFAULT_MAX_DISPLAY = 3

interface ComboboxMultiProps {
    options: ComboboxOption[]
    modelValue?: string[]
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
    loading?: boolean
    creative?: boolean
    ariaLabel?: string
    maxDisplay?: number
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<ComboboxMultiProps>(), {
    modelValue: () => [],
    placeholder: undefined,
    searchPlaceholder: undefined,
    emptyText: undefined,
    disabled: false,
    loading: false,
    creative: false,
    ariaLabel: undefined,
    maxDisplay: DEFAULT_MAX_DISPLAY,
    class: undefined,
    iconSize: 'default',
})

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('combobox.multiPlaceholder'))
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder ?? t('combobox.searchPlaceholder'))
const resolvedEmptyText = computed(() => props.emptyText ?? t('combobox.emptyText'))

const emit = defineEmits<{
    'update:modelValue': [value: string[]]
    'create': [value: string]
}>()

const open = ref(false)
const searchQuery = ref('')

const selectedOptions = computed(() =>
    props.options.filter((option) => props.modelValue.includes(option.value))
)

const displayText = computed(() => {
    if (selectedOptions.value.length === 0) return resolvedPlaceholder.value
    if (selectedOptions.value.length <= props.maxDisplay) {
        return selectedOptions.value.map((o) => o.label).join(', ')
    }
    return t('combobox.selectedCount', { count: selectedOptions.value.length })
})

const filteredOptions = computed(() => {
    if (!searchQuery.value) return props.options
    const query = searchQuery.value.toLowerCase()
    return props.options.filter((option) =>
        option.label.toLowerCase().includes(query)
    )
})

const showCreateItem = computed(() =>
    props.creative && filteredOptions.value.length === 0 && !!searchQuery.value.trim()
)

const createItemLabel = computed(() =>
    t('combobox.create', { query: searchQuery.value })
)

const triggerClasses = computed(() =>
    cn(
        buttonVariants({ variant: 'outline' }),
        comboboxTriggerVariants({ hasValue: selectedOptions.value.length > 0 }),
        props.class
    )
)

const contentClasses = comboboxContentVariants()

function handleSelect(optionValue: string) {
    const newValue = props.modelValue.includes(optionValue)
        ? props.modelValue.filter((v) => v !== optionValue)
        : [...props.modelValue, optionValue]
    emit('update:modelValue', newValue)
}

function handleCreate() {
    if (!searchQuery.value.trim()) return
    emit('create', searchQuery.value)
    searchQuery.value = ''
}

const checkboxSelectedClasses = comboboxCheckboxVariants({ selected: true })
const checkboxUnselectedClasses = comboboxCheckboxVariants({ selected: false })

const triggerIconClasses = computed(() =>
    cn('ml-2 shrink-0 opacity-50 stroke-[3]', iconSizeVariants({ size: props.iconSize }))
)

const checkIconClasses = cn(iconSizeVariants({ size: 'sm' }), 'stroke-[3] text-brutal-fg')

watch(open, (isOpen) => {
    if (!isOpen) {
        searchQuery.value = ''
    }
})
</script>

<template>
    <PopoverRoot v-model:open="open">
        <PopoverTrigger as-child>
            <button
                type="button"
                role="combobox"
                :aria-expanded="open"
                :aria-label="ariaLabel"
                aria-haspopup="listbox"
                :disabled="disabled"
                :class="triggerClasses"
            >
                <span class="truncate">{{ displayText }}</span>
                <ChevronsUpDown :class="triggerIconClasses" />
            </button>
        </PopoverTrigger>
        <PopoverContent :class="contentClasses" align="start">
            <Command disable-filter>
                <CommandInput v-model="searchQuery" :placeholder="resolvedSearchPlaceholder" />
                <CommandList>
                    <CommandEmpty v-if="!showCreateItem">
                        {{ resolvedEmptyText }}
                    </CommandEmpty>
                    <CommandItem
                        v-if="showCreateItem"
                        :value="searchQuery"
                        @select="handleCreate"
                    >
                        {{ createItemLabel }}
                    </CommandItem>
                    <CommandGroup>
                        <CommandItem
                            v-for="option in filteredOptions"
                            :key="option.value"
                            :value="option.value"
                            :disabled="option.disabled"
                            @select="handleSelect"
                        >
                            <div
                                :class="props.modelValue.includes(option.value) ? checkboxSelectedClasses : checkboxUnselectedClasses"
                            >
                                <Check v-if="props.modelValue.includes(option.value)" :class="checkIconClasses" />
                            </div>
                            {{ option.label }}
                        </CommandItem>
                    </CommandGroup>
                    <div v-if="loading" class="flex items-center justify-center py-2">
                        <Spinner size="sm" />
                    </div>
                </CommandList>
            </Command>
        </PopoverContent>
    </PopoverRoot>
</template>
