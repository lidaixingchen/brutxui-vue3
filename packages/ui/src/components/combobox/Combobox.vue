<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { Check, ChevronsUpDown } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { buttonVariants } from '../button/button-variants'
import { comboboxTriggerVariants, comboboxContentVariants } from './combobox-variants'
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

import { type ComboboxOption } from './combobox-types'

interface ComboboxProps {
    options: ComboboxOption[]
    modelValue?: string
    open?: boolean
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
    loading?: boolean
    creative?: boolean
    ariaLabel?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<ComboboxProps>(), {
    modelValue: undefined,
    open: undefined,
    placeholder: undefined,
    searchPlaceholder: undefined,
    emptyText: undefined,
    disabled: false,
    loading: false,
    creative: false,
    ariaLabel: undefined,
    class: undefined,
    iconSize: 'default',
})

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('combobox.placeholder'))
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder ?? t('combobox.searchPlaceholder'))
const resolvedEmptyText = computed(() => props.emptyText ?? t('combobox.emptyText'))

const emit = defineEmits<{
    'update:modelValue': [value: string | undefined]
    'update:open': [value: boolean]
    'create': [value: string]
}>()

const internalOpen = ref(false)
const open = computed<boolean>({
    get: () => props.open !== undefined ? props.open : internalOpen.value,
    set: (val) => {
        internalOpen.value = val
        emit('update:open', val)
    },
})
const searchQuery = ref('')

const selectedOption = computed(() =>
    props.options.find((option) => option.value === props.modelValue)
)

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
        comboboxTriggerVariants({ hasValue: !!props.modelValue }),
        props.class
    )
)

const contentClasses = comboboxContentVariants()

function handleSelect(value: string) {
    emit('update:modelValue', value === props.modelValue ? undefined : value)
    open.value = false
    searchQuery.value = ''
}

function handleCreate() {
    if (!searchQuery.value.trim()) return
    emit('create', searchQuery.value)
    open.value = false
    searchQuery.value = ''
}

watch(open, (isOpen) => {
    if (!isOpen) {
        searchQuery.value = ''
    }
})

const triggerIconClasses = computed(() =>
    cn('ml-2 shrink-0 opacity-50 stroke-[3]', iconSizeVariants({ size: props.iconSize }))
)

const checkSelectedClasses = cn(iconSizeVariants({ size: 'sm' }), 'stroke-[3] text-brutal-fg')
const checkUnselectedClasses = cn(iconSizeVariants({ size: 'sm' }), 'opacity-0')

const contentId = `combobox-content-${useId()}`
</script>

<template>
    <PopoverRoot v-model:open="open">
        <PopoverTrigger as-child>
            <button
                type="button"
                role="combobox"
                :aria-expanded="open"
                :aria-controls="open ? contentId : undefined"
                :aria-label="ariaLabel"
                aria-haspopup="listbox"
                :disabled="disabled"
                :class="triggerClasses"
            >
                <span>{{ selectedOption ? selectedOption.label : resolvedPlaceholder }}</span>
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
                            <Check
                                :class="props.modelValue === option.value ? checkSelectedClasses : checkUnselectedClasses"
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
