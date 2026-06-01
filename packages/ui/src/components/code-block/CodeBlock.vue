<script setup lang="ts">
import { computed } from 'vue'
import CopyToClipboard from '../copy-to-clipboard/CopyToClipboard.vue'
import { cn } from '../../lib/utils'

interface CodeBlockProps {
    code: string
    language?: string
    filename?: string
    showLineNumbers?: boolean
    class?: string
}

const props = withDefaults(defineProps<CodeBlockProps>(), {
    language: 'plaintext',
    filename: '',
    showLineNumbers: false,
    class: '',
})

const lines = computed(() => {
    return props.code.split('\n')
})
</script>

<template>
    <div :class="cn('border-3 border-brutal bg-brutal-bg text-brutal-fg rounded-brutal shadow-brutal overflow-hidden', props.class)">
        <!-- Header Bar -->
        <div class="bg-brutal-muted border-b-3 border-brutal flex justify-between items-center px-4 py-2 text-xs font-black select-none">
            <div class="flex items-center gap-2">
                <span class="bg-brutal-accent text-brutal-fg border-2 border-brutal rounded-sm px-1.5 py-0.5 text-[10px] uppercase font-black tracking-wider">
                    {{ language }}
                </span>
                <span v-if="filename" class="text-brutal-fg/80 font-black">
                    {{ filename }}
                </span>
            </div>
            <!-- Copy Button Integration -->
            <CopyToClipboard
                :text="code"
                class="h-7 px-3 text-xs border-2 shadow-brutal-sm active:translate-y-[1px] bg-brutal-bg hover:bg-brutal-muted"
            >
                <template #default="{ copied }">
                    <span>{{ copied ? '已复制' : '复制' }}</span>
                </template>
            </CopyToClipboard>
        </div>

        <!-- Code Body -->
        <div class="relative flex items-stretch p-4 overflow-x-auto text-sm font-mono bg-brutal-bg">
            <!-- Line Numbers Column -->
            <div
                v-if="showLineNumbers"
                class="flex flex-col text-right text-brutal-fg/40 select-none pr-4 mr-4 border-r-2 border-brutal font-bold"
            >
                <span v-for="(_, i) in lines" :key="i">{{ i + 1 }}</span>
            </div>

            <!-- Raw Code Display -->
            <pre class="flex-1 min-w-0 m-0"><code class="block whitespace-pre font-bold"><slot v-if="$slots.default"></slot><template v-else>{{ code }}</template></code></pre>
        </div>
    </div>
</template>
