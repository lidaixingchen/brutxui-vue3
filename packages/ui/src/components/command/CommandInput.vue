<script setup lang="ts">
import { computed } from 'vue'
import { ListboxFilter } from 'reka-ui'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { Search } from 'lucide-vue-next'
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

function handleInput(event: InputEvent) {
    const value = (event.target as HTMLInputElement).value
    rootContext.filterSearch.value = value
    emit('update:modelValue', value)
}
</script>

<template>
    <div :class="wrapperClasses" data-slot="command-input">
        <Search class="size-5 shrink-0 stroke-[3] text-brutal-fg" />
        <ListboxFilter
            :model-value="modelValue"
            :placeholder="resolvedPlaceholder"
            :class="inputClasses"
            auto-focus
            @input="handleInput"
            @update:model-value="emit('update:modelValue', $event)"
        />
    </div>
</template>
