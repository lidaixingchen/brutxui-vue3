<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import { Check } from 'lucide-vue-next'

interface CheckboxProps {
    class?: string
    disabled?: boolean
}

const props = defineProps<CheckboxProps>()

const classes = computed(() =>
    cn(
        'peer h-6 w-6 shrink-0',
        'border-3 border-black dark:border-white',
        'bg-white dark:bg-gray-800',
        'flex items-center justify-center',
        'transition-all duration-150',
        'shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-[#7FB069]',
        props.class
    )
)
</script>

<template>
    <CheckboxRoot :class="classes" :disabled="disabled">
        <CheckboxIndicator class="flex items-center justify-center text-current">
            <Check class="h-4 w-4 stroke-[3] text-black dark:text-white" />
        </CheckboxIndicator>
    </CheckboxRoot>
</template>
