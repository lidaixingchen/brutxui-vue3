<script setup lang="ts">
import { computed } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { useClipboard } from '../../composables/useClipboard'
import { cn } from '../../lib/utils'
import { copyToClipboardVariants } from './copy-to-clipboard-variants'

const DEFAULT_COPY_DURATION = 2000

interface CopyToClipboardProps {
    text: string
    duration?: number
    class?: string
}

const props = withDefaults(defineProps<CopyToClipboardProps>(), {
    duration: DEFAULT_COPY_DURATION,
    class: '',
})

const { copy, copied, isSupported } = useClipboard({ duration: props.duration })

const handleCopy = () => {
    if (isSupported) {
        copy(props.text)
    }
}

const classes = computed(() =>
    cn(
        copyToClipboardVariants({ state: copied.value ? 'copied' : 'idle' }),
        props.class
    )
)
</script>

<template>
    <button
        type="button"
        :disabled="!isSupported"
        @click="handleCopy"
        :class="classes"
    >
        <slot :copied="copied">
            <template v-if="copied">
                <Check class="h-4 w-4 stroke-[3]" />
                <span>Copied</span>
            </template>
            <template v-else>
                <Copy class="h-4 w-4 stroke-[3]" />
                <span>Copy</span>
            </template>
        </slot>
    </button>
</template>
