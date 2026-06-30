<script setup lang="ts">
import { computed, provide, type ComputedRef } from 'vue'
import { TabsRoot } from 'reka-ui'
import { cn } from '../../lib/utils'

interface TabsProps {
    modelValue?: string
    orientation?: 'horizontal' | 'vertical'
    class?: string
}

const props = withDefaults(defineProps<TabsProps>(), {
    modelValue: undefined,
    orientation: 'horizontal',
    class: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const orientation = computed(() => props.orientation)
provide<ComputedRef<'horizontal' | 'vertical'>>('brutx-tabs-orientation', orientation)
</script>

<template>
    <TabsRoot
        :model-value="modelValue"
        :orientation="orientation"
        :class="cn(props.class)"
        @update:model-value="(val) => { if (typeof val === 'string') emit('update:modelValue', val) }"
    >
        <slot />
    </TabsRoot>
</template>
