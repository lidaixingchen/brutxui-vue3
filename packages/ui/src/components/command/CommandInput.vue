<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { Search } from '@lucide/vue'
import { commandInputWrapperVariants } from './command-variants'
import { injectCommandRootContext } from './command-context'

interface CommandInputProps {
    modelValue?: string
    placeholder?: string
    class?: string
}

const props = withDefaults(defineProps<CommandInputProps>(), {
    modelValue: undefined,
    placeholder: undefined,
    class: undefined,
})

const { t } = useLocale()
const rootContext = injectCommandRootContext()

const resolvedPlaceholder = computed(() => props.placeholder ?? t('command.placeholder'))

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const searchValue = ref(props.modelValue ?? '')

watch(() => props.modelValue, (val) => {
    searchValue.value = val ?? ''
})

watch(searchValue, (val) => {
    rootContext.filterSearch.value = val
    emit('update:modelValue', val)
})

function handleInput(event: Event) {
    searchValue.value = (event.target as HTMLInputElement).value
}

const wrapperClasses = computed(() =>
    cn(commandInputWrapperVariants())
)

const inputClasses = computed(() =>
    cn(
        'flex h-full w-full bg-transparent py-3',
        'text-sm font-bold text-brutal-fg placeholder:text-brutal-placeholder',
        'outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.class
    )
)
</script>

<template>
    <div :class="wrapperClasses" data-slot="command-input">
        <Search class="size-5 shrink-0 stroke-[3] text-brutal-fg" />
        <input
            :value="searchValue"
            :placeholder="resolvedPlaceholder"
            :class="inputClasses"
            type="text"
            role="searchbox"
            aria-autocomplete="list"
            @input="handleInput"
        >
    </div>
</template>
