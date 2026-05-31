<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'
import { SwitchRoot, SwitchThumb } from 'reka-ui'

interface SwitchProps {
    class?: string
    defaultValue?: boolean
    disabled?: boolean
}

const props = defineProps<SwitchProps>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const classes = computed(() =>
    cn(
        'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center',
        'border-3 border-black dark:border-white',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-[#7FB069] data-[state=unchecked]:bg-white dark:data-[state=unchecked]:bg-gray-900',
        props.class
    )
)
</script>

<template>
    <SwitchRoot
        :class="classes"
        :default-checked="defaultValue"
        :disabled="disabled"
        @update:checked="emit('update:modelValue', $event)"
    >
        <SwitchThumb
            class="pointer-events-none block h-5 w-5 bg-black dark:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] transition-transform duration-150 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
        />
    </SwitchRoot>
</template>
