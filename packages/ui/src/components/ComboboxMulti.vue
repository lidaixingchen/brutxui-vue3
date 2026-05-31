<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { cn } from '../lib/utils'
import { buttonVariants } from './button-variants'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import PopoverContent from './PopoverContent.vue'
import Command from './Command.vue'
import CommandInput from './CommandInput.vue'
import CommandList from './CommandList.vue'
import CommandEmpty from './CommandEmpty.vue'
import CommandGroup from './CommandGroup.vue'
import CommandItem from './CommandItem.vue'
import type { ComboboxOption } from './Combobox.vue'

interface ComboboxMultiProps {
    options: ComboboxOption[]
    modelValue?: string[]
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
    maxDisplay?: number
    class?: string
}

const props = withDefaults(defineProps<ComboboxMultiProps>(), {
    modelValue: () => [],
    placeholder: 'Select options...',
    searchPlaceholder: 'Search...',
    emptyText: 'No results found.',
    disabled: false,
    maxDisplay: 3,
})

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const open = ref(false)
const searchQuery = ref('')

const selectedOptions = computed(() =>
    props.options.filter((option) => props.modelValue.includes(option.value))
)

const displayText = computed(() => {
    if (selectedOptions.value.length === 0) return props.placeholder
    if (selectedOptions.value.length <= props.maxDisplay) {
        return selectedOptions.value.map((o) => o.label).join(', ')
    }
    return `${selectedOptions.value.length} selected`
})

const filteredOptions = computed(() => {
    if (!searchQuery.value) return props.options
    const query = searchQuery.value.toLowerCase()
    return props.options.filter((option) =>
        option.label.toLowerCase().includes(query)
    )
})

const triggerClasses = computed(() =>
    cn(
        buttonVariants({ variant: 'outline' }),
        'w-full justify-between font-semibold',
        selectedOptions.value.length === 0 && 'text-gray-500',
        props.class
    )
)

function handleSelect(optionValue: string) {
    const newValue = props.modelValue.includes(optionValue)
        ? props.modelValue.filter((v) => v !== optionValue)
        : [...props.modelValue, optionValue]
    emit('update:modelValue', newValue)
}
</script>

<template>
    <PopoverRoot v-model:open="open">
        <PopoverTrigger as-child :disabled="disabled">
            <button
                type="button"
                role="combobox"
                :aria-expanded="open"
                :class="triggerClasses"
            >
                <span class="truncate">{{ displayText }}</span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50 stroke-[3]" />
            </button>
        </PopoverTrigger>
        <PopoverContent class="w-[var(--reka-popover-trigger-width)] p-0" align="start">
            <Command>
                <CommandInput v-model="searchQuery" :placeholder="searchPlaceholder" />
                <CommandList>
                    <CommandEmpty>{{ emptyText }}</CommandEmpty>
                    <CommandGroup>
                        <CommandItem
                            v-for="option in filteredOptions"
                            :key="option.value"
                            :value="option.value"
                            :disabled="option.disabled"
                            @select="handleSelect"
                        >
                            <div
                                :class="cn(
                                    'mr-2 flex h-4 w-4 items-center justify-center',
                                    'border-2 border-brutal',
                                    modelValue.includes(option.value)
                                        ? 'bg-brutal-secondary'
                                        : 'bg-brutal-bg'
                                )"
                            >
                                <Check v-if="modelValue.includes(option.value)" class="h-3 w-3 stroke-[3] text-black" />
                            </div>
                            {{ option.label }}
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </PopoverContent>
    </PopoverRoot>
</template>
