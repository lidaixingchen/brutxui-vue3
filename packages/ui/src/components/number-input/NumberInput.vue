<script setup lang="ts">
import { computed } from 'vue'
import {
    NumberFieldRoot,
    type NumberFieldRootProps,
    type NumberFieldRootEmits,
    NumberFieldInput,
    NumberFieldIncrement,
    NumberFieldDecrement,
    useForwardPropsEmits
} from 'reka-ui'
import { Plus, Minus, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { cn } from '../../lib/utils'

interface NumberInputProps extends NumberFieldRootProps {
    layout?: 'split' | 'stacked'
    placeholder?: string
    class?: string
}

const props = withDefaults(defineProps<NumberInputProps>(), {
    layout: 'split',
    placeholder: '',
    class: '',
})

const emits = defineEmits<NumberFieldRootEmits>()

const delegatedProps = computed(() => {
    const { class: _, layout: __, placeholder: ___, ...delegated } = props
    return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const containerClasses = computed(() =>
    cn(
        'flex items-stretch border-3 border-brutal bg-brutal-bg rounded-brutal shadow-brutal overflow-hidden transition-all duration-150 focus-within:ring-2 focus-within:ring-brutal-ring focus-within:ring-offset-2',
        props.class
    )
)
</script>

<template>
    <NumberFieldRoot v-bind="forwarded" :class="containerClasses">
        <!-- Split Layout: Minus on left, input in middle, Plus on right -->
        <template v-if="layout === 'split'">
            <NumberFieldDecrement
                class="px-4 border-r-3 border-brutal flex items-center justify-center bg-brutal-accent hover:bg-brutal-muted active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer"
            >
                <Minus class="h-4 w-4 stroke-[3]" />
            </NumberFieldDecrement>

            <NumberFieldInput
                :placeholder="placeholder"
                class="flex-1 min-w-0 bg-transparent text-center font-black py-2 px-3 text-base placeholder:text-brutal-placeholder placeholder:font-normal focus:outline-none"
            />

            <NumberFieldIncrement
                class="px-4 border-l-3 border-brutal flex items-center justify-center bg-brutal-primary hover:bg-brutal-muted active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer"
            >
                <Plus class="h-4 w-4 stroke-[3]" />
            </NumberFieldIncrement>
        </template>

        <!-- Stacked Layout: Input on left, small increment/decrement vertically stacked on right -->
        <template v-else>
            <NumberFieldInput
                :placeholder="placeholder"
                class="flex-1 min-w-0 bg-transparent font-black py-2 px-4 text-base placeholder:text-brutal-placeholder placeholder:font-normal focus:outline-none"
            />

            <div class="flex flex-col border-l-3 border-brutal w-10 shrink-0">
                <NumberFieldIncrement
                    class="flex-1 flex items-center justify-center border-b-3 border-brutal bg-brutal-accent hover:bg-brutal-muted active:translate-y-[1px] transition-all duration-75 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer"
                >
                    <ChevronUp class="h-4 w-4 stroke-[3]" />
                </NumberFieldIncrement>
                <NumberFieldDecrement
                    class="flex-1 flex items-center justify-center bg-brutal-primary hover:bg-brutal-muted active:translate-y-[1px] transition-all duration-75 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer"
                >
                    <ChevronDown class="h-4 w-4 stroke-[3]" />
                </NumberFieldDecrement>
            </div>
        </template>
    </NumberFieldRoot>
</template>
