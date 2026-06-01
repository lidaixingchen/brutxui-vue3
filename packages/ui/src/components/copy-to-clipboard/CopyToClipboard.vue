<script setup lang="ts">

import { Check, Copy } from 'lucide-vue-next'
import { useClipboard } from '../../composables/useClipboard'
import { cn } from '../../lib/utils'

interface CopyToClipboardProps {
    text: string
    duration?: number
    class?: string
}

const props = withDefaults(defineProps<CopyToClipboardProps>(), {
    duration: 2000,
    class: '',
})

const { copy, copied, isSupported } = useClipboard({ duration: props.duration })

const handleCopy = () => {
    if (isSupported) {
        copy(props.text)
    }
}
</script>

<template>
    <button
        type="button"
        :disabled="!isSupported"
        @click="handleCopy"
        :class="cn(
            'inline-flex items-center justify-center gap-2 font-black tracking-wide border-3 border-brutal transition-all duration-150 h-11 px-5 rounded-brutal shadow-brutal select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
            copied
                ? 'bg-brutal-success text-brutal-fg translate-y-[var(--brutal-pressed-offset,2px)] shadow-none'
                : 'bg-brutal-bg text-brutal-fg hover:bg-brutal-muted hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
            props.class
        )"
    >
        <slot :copied="copied">
            <template v-if="copied">
                <Check class="h-4 w-4 stroke-[3]" />
                <span>已复制</span>
            </template>
            <template v-else>
                <Copy class="h-4 w-4 stroke-[3]" />
                <span>复制</span>
            </template>
        </slot>
    </button>
</template>
