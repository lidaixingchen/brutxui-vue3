<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { Check, Copy } from '@lucide/vue'
import { cn } from '../lib/utils'

interface Props {
    text: string
    iconSize?: number
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    iconSize: 16,
    class: '',
})

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function handleCopy() {
    try {
        if (!navigator.clipboard) {
            throw new Error('Clipboard API unavailable')
        }
        await navigator.clipboard.writeText(props.text)
        copied.value = true
        if (copyTimer) clearTimeout(copyTimer)
        copyTimer = setTimeout(() => {
            copied.value = false
            copyTimer = null
        }, 2000)
    } catch {
        copied.value = false
    }
}

onBeforeUnmount(() => {
    if (copyTimer) clearTimeout(copyTimer)
})

const buttonClass = computed(() =>
    cn(
        'inline-flex items-center justify-center border-3 border-brutal font-black text-xs',
        'transition-all duration-150',
        copied.value
            ? 'bg-brutal-accent text-black shadow-brutal-sm'
            : 'bg-brutal-secondary text-black shadow-brutal-sm hover:bg-brutal-accent hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        props.class,
    ),
)
</script>

<template>
    <button
        type="button"
        :class="buttonClass"
        :title="copied ? 'Copied!' : 'Copy to clipboard'"
        :aria-label="copied ? 'Copied' : 'Copy to clipboard'"
        @click="handleCopy"
    >
        <Check v-if="copied" :size="iconSize" :stroke-width="3" />
        <Copy v-else :size="iconSize" :stroke-width="3" />
    </button>
</template>
