<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { Check, ChevronsUpDown } from '@lucide/vue'
import { cn } from '@/lib/utils'
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
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import { useSelectableTrigger } from '@/composables/useSelectableTrigger'
import { useSelectionDisplayText } from '@/composables/useSelectionDisplayText'

import { type ComboboxOption } from './combobox-types'

interface ComboboxProps {
    options: ComboboxOption[]
    modelValue?: string | string[]
    multiple?: boolean
    open?: boolean
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
    loading?: boolean
    creative?: boolean
    maxDisplay?: number
    ariaLabel?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<ComboboxProps>(), {
    modelValue: undefined,
    multiple: false,
    open: undefined,
    placeholder: undefined,
    searchPlaceholder: undefined,
    emptyText: undefined,
    disabled: false,
    loading: false,
    creative: false,
    maxDisplay: 3,
    ariaLabel: undefined,
    class: undefined,
    iconSize: 'default',
})

const { t } = useLocale()

const resolvedPlaceholder = computed(() =>
    props.placeholder ?? (props.multiple ? t('combobox.multiPlaceholder') : t('combobox.placeholder'))
)
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder ?? t('combobox.searchPlaceholder'))
const resolvedEmptyText = computed(() => props.emptyText ?? t('combobox.emptyText'))

const emit = defineEmits<{
    'update:modelValue': [value: string | string[] | undefined]
    'update:open': [value: boolean]
    'create': [value: string]
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

const selectedOptions = computed(() => {
    if (props.multiple) {
        const selected = Array.isArray(props.modelValue) ? props.modelValue : []
        return props.options.filter((o) => selected.includes(o.value))
    }
    const found = props.options.find((o) => o.value === props.modelValue)
    return found ? [found] : []
})

const displayText = useSelectionDisplayText({
    selectedItems: selectedOptions,
    placeholder: resolvedPlaceholder,
    multiple: () => props.multiple,
    maxDisplay: () => props.maxDisplay,
    getLabel: (option) => option.label,
    formatList: (labels) => labels.join(', '),
    formatCount: (count) => t('combobox.selectedCount', { count }),
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

const { triggerClasses } = useSelectableTrigger<string | string[]>({
    modelValue: () => props.modelValue,
    baseClass: ({ hasValue }) => cn(
        buttonVariants({ variant: 'outline' }),
        comboboxTriggerVariants({ hasValue })
    ),
    class: () => props.class,
    emptyClass: false,
})

const contentClasses = comboboxContentVariants()

const checkboxSelectedClasses = comboboxCheckboxVariants({ selected: true })
const checkboxUnselectedClasses = comboboxCheckboxVariants({ selected: false })
const checkSelectedClasses = cn(iconSizeVariants({ size: 'sm' }), 'stroke-[3] text-brutal-fg')
const checkUnselectedClasses = cn(iconSizeVariants({ size: 'sm' }), 'opacity-0')
const checkIconClasses = cn(iconSizeVariants({ size: 'sm' }), 'stroke-[3] text-brutal-fg')

const triggerIconClasses = computed(() =>
    cn('ml-2 shrink-0 opacity-50 stroke-[3]', iconSizeVariants({ size: props.iconSize }))
)

const contentId = `combobox-content-${useId()}`

function isSelected(optionValue: string): boolean {
    if (props.multiple) {
        return Array.isArray(props.modelValue) && props.modelValue.includes(optionValue)
    }
    return props.modelValue === optionValue
}

function handleSelect(value: string) {
    if (props.multiple) {
        const current = Array.isArray(props.modelValue) ? props.modelValue : []
        const newValue = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value]
        emit('update:modelValue', newValue)
    } else {
        emit('update:modelValue', value === props.modelValue ? undefined : value)
        open.value = false
        searchQuery.value = ''
    }
}

function handleCreate() {
    if (!searchQuery.value.trim()) return
    emit('create', searchQuery.value)
    if (!props.multiple) {
        open.value = false
    }
    searchQuery.value = ''
}

watch(open, (isOpen) => {
    if (!isOpen) {
        searchQuery.value = ''
    }
})

const triggerRef = ref<HTMLElement | null>(null)

defineExpose({
    open,
    searchQuery,
    selectedValue: computed(() => props.modelValue),
    focus: () => triggerRef.value?.focus(),
})
</script>

<template>
    <PopoverRoot v-model:open="open">
        <PopoverTrigger as-child>
            <button
                ref="triggerRef"
                type="button"
                role="combobox"
                :aria-expanded="open"
                :aria-controls="open ? contentId : undefined"
                :aria-label="ariaLabel"
                :aria-multiselectable="multiple || undefined"
                aria-haspopup="listbox"
                :disabled="disabled"
                :class="triggerClasses"
            >
                <span :class="multiple ? 'truncate' : undefined">{{ displayText }}</span>
                <ChevronsUpDown :class="triggerIconClasses" />
            </button>
        </PopoverTrigger>
        <PopoverContent :class="contentClasses" align="start">
          <div :id="contentId">
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
                            <template v-if="multiple">
                                <div
                                    :class="isSelected(option.value) ? checkboxSelectedClasses : checkboxUnselectedClasses"
                                >
                                    <Check v-if="isSelected(option.value)" :class="checkIconClasses" />
                                </div>
                            </template>
                            <Check
                                v-else
                                :class="isSelected(option.value) ? checkSelectedClasses : checkUnselectedClasses"
                            />
                            {{ option.label }}
                        </CommandItem>
                    </CommandGroup>
                    <div v-if="loading" class="flex items-center justify-center py-2">
                        <Spinner size="sm" />
                    </div>
                </CommandList>
            </Command>
          </div>
        </PopoverContent>
    </PopoverRoot>
</template>
