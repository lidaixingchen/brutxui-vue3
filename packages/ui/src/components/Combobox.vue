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

export interface ComboboxOption {
    value: string
    label: string
    disabled?: boolean
}

interface ComboboxProps {
    options: ComboboxOption[]
    modelValue?: string
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<ComboboxProps>(), {
    placeholder: 'Select option...',
    searchPlaceholder: 'Search...',
    emptyText: 'No results found.',
    disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
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

const triggerClasses = computed(() =>
    cn(
        buttonVariants({ variant: 'outline' }),
        'w-full justify-between font-semibold',
        !props.modelValue && 'text-gray-500',
        props.class
    )
)

function handleSelect(value: string) {
    emit('update:modelValue', value === props.modelValue ? '' : value)
    open.value = false
    searchQuery.value = ''
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
                <span>{{ selectedOption ? selectedOption.label : placeholder }}</span>
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
                            <Check
                                :class="cn(
                                    'mr-2 h-4 w-4 stroke-[3]',
                                    modelValue === option.value ? 'opacity-100' : 'opacity-0'
                                )"
                            />
                            {{ option.label }}
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </PopoverContent>
    </PopoverRoot>
</template>
