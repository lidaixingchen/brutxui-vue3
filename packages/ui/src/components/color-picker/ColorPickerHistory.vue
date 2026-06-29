<script setup lang="ts">
import { computed } from 'vue'
import { X } from '@lucide/vue'
import ColorPickerSwatch from './ColorPickerSwatch.vue'

interface ColorPickerHistoryProps {
    history: readonly string[]
    modelValue?: string | null
    size?: 'sm' | 'default' | 'lg'
    ariaLabel?: string
    clearLabel?: string
}

const props = withDefaults(defineProps<ColorPickerHistoryProps>(), {
    modelValue: null,
    size: 'default',
    ariaLabel: undefined,
    clearLabel: undefined,
})

const emit = defineEmits<{
    select: [value: string]
    clear: []
}>()

const isEmpty = computed(() => props.history.length === 0)
</script>

<template>
    <div v-if="!isEmpty" role="group" :aria-label="ariaLabel">
        <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold uppercase tracking-tight text-brutal-fg">
                {{ ariaLabel }}
            </span>
            <button
                type="button"
                class="inline-flex items-center gap-1 text-xs font-bold text-brutal-fg hover:text-brutal-destructive transition-colors"
                :aria-label="clearLabel"
                @click="emit('clear')"
            >
                <X class="w-3 h-3 stroke-[3]" />
            </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
            <ColorPickerSwatch
                v-for="(color, index) in history"
                :key="`${color}-${index}`"
                :value="color"
                :size="size"
                :selected="color === modelValue"
                :aria-label="color"
                @select="emit('select', $event)"
            />
        </div>
    </div>
</template>
