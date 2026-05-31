<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'

interface Props {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    showText?: boolean
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    size: 'md',
    showText: true,
    class: '',
})

const sizeConfig = computed(() => {
    const configs = {
        sm: { box: 'h-7 w-7', text: 'text-xs', gap: 'gap-1.5', layers: 'h-2.5 w-2.5' },
        md: { box: 'h-9 w-9', text: 'text-sm', gap: 'gap-2', layers: 'h-3 w-3' },
        lg: { box: 'h-11 w-11', text: 'text-base', gap: 'gap-2.5', layers: 'h-4 w-4' },
        xl: { box: 'h-14 w-14', text: 'text-lg', gap: 'gap-3', layers: 'h-5 w-5' },
    }
    return configs[props.size]
})

const wrapperClass = computed(() =>
    cn('inline-flex items-center font-brutal font-bold', sizeConfig.value.gap, props.class),
)

const boxClass = computed(() =>
    cn(
        'relative border-3 border-brutal shadow-brutal bg-brutal-bg flex items-center justify-center',
        sizeConfig.value.box,
    ),
)

const labelClass = computed(() =>
    cn('text-brutal-fg font-brutal font-bold', sizeConfig.value.text),
)
</script>

<template>
    <div :class="wrapperClass">
        <div :class="boxClass">
            <div
                :class="cn('absolute -top-1 -left-1 bg-brutal-primary border-2 border-brutal', sizeConfig.layers)"
            />
            <div
                :class="cn('absolute -bottom-1 -right-1 bg-brutal-secondary border-2 border-brutal', sizeConfig.layers)"
            />
            <div
                :class="cn('absolute -top-1 -right-1 bg-brutal-accent border-2 border-brutal', sizeConfig.layers)"
            />
            <span class="relative z-10 font-brutal font-black text-brutal-fg" :class="sizeConfig.text">
                BX
            </span>
        </div>
        <span v-if="showText" :class="labelClass">
            BrutxUI
        </span>
    </div>
</template>
