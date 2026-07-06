<script setup lang="ts">
import { computed } from 'vue'
import { Check, AlertTriangle, Info, X, FolderOpen } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

interface ResultProps {
    status?: 'success' | 'warning' | 'info' | 'error' | 'empty'
    title?: string
    subTitle?: string
    variant?: 'plain' | 'card'
    iconSize?: IconSize
    titleAs?: 'h2' | 'h3'
    class?: string
}

const props = withDefaults(defineProps<ResultProps>(), {
    status: 'info',
    title: undefined,
    subTitle: undefined,
    variant: 'card',
    iconSize: undefined,
    titleAs: 'h2',
    class: undefined,
})

const statusConfig = {
    success: {
        icon: Check,
        colorClass: 'bg-[#22c55e] text-brutal-black dark:text-white',
    },
    warning: {
        icon: AlertTriangle,
        colorClass: 'bg-brutal-yellow text-brutal-black',
    },
    info: {
        icon: Info,
        colorClass: 'bg-[#3b82f6] text-brutal-black dark:text-white',
    },
    error: {
        icon: X,
        colorClass: 'bg-brutal-destructive text-white',
    },
    empty: {
        icon: FolderOpen,
        colorClass: 'bg-brutal-accent text-brutal-black',
    },
}

const activeConfig = computed(() => statusConfig[props.status] || statusConfig.info)
const rootClasses = computed(() =>
    cn(
        'flex flex-col items-center justify-center text-center',
        props.variant === 'card'
            ? 'p-8 border-3 border-brutal-black dark:border-white bg-white dark:bg-brutal-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]'
            : 'p-0',
        props.class
    )
)
const iconClasses = computed(() => cn(props.iconSize ? iconSizeVariants({ size: props.iconSize }) : 'w-10 h-10', 'stroke-[3]'))
</script>

<template>
    <div :class="rootClasses">
        <div class="mb-6 select-none">
            <slot name="icon">
                <div
                    :class="cn(
                        'w-16 h-16 rounded-none flex items-center justify-center border-3 border-brutal-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
                        activeConfig.colorClass
                    )"
                >
                    <component 
                        :is="activeConfig.icon" 
                        :class="iconClasses"
                    />
                </div>
            </slot>
        </div>

        <component
            :is="titleAs"
            v-if="title || $slots.title" 
            class="text-2xl font-black text-brutal-black dark:text-white mb-2 uppercase tracking-wide"
        >
            <slot name="title">
                {{ title }}
            </slot>
        </component>

        <p 
            v-if="subTitle || $slots.subTitle" 
            class="text-sm font-bold text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed"
        >
            <slot name="subTitle">
                {{ subTitle }}
            </slot>
        </p>

        <div 
            v-if="$slots.extra" 
            class="flex items-center gap-3 mt-2"
        >
            <slot name="extra" />
        </div>
    </div>
</template>
