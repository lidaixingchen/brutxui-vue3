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
        colorClass: 'bg-brutal-status-success text-brutal-status-success-foreground',
    },
    warning: {
        icon: AlertTriangle,
        colorClass: 'bg-brutal-status-warning text-brutal-status-warning-foreground',
    },
    info: {
        icon: Info,
        colorClass: 'bg-brutal-status-info text-brutal-status-info-foreground',
    },
    error: {
        icon: X,
        colorClass: 'bg-brutal-status-error text-brutal-status-error-foreground',
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
            ? 'p-8 border-3 border-brutal bg-brutal-bg shadow-brutal-lg'
            : 'p-0',
        props.class
    )
)
const iconClasses = computed(() => cn(props.iconSize ? iconSizeVariants({ size: props.iconSize }) : 'w-10 h-10', 'stroke-[3]'))
</script>

<template>
    <div :class="rootClasses" role="status">
        <div class="mb-6 select-none" aria-hidden="true">
            <slot name="icon">
                <div
                    :class="cn(
                        'w-16 h-16 rounded-none flex items-center justify-center border-3 border-brutal shadow-[3px_3px_0px_0px_var(--brutal-shadow-color,#000000)]',
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
            v-if="title !== undefined || $slots.title" 
            class="text-2xl font-black text-brutal-fg mb-2 uppercase tracking-wide"
        >
            <slot name="title">
                {{ title }}
            </slot>
        </component>

        <p 
            v-if="subTitle !== undefined || $slots.subTitle" 
            class="text-sm font-bold text-brutal-muted-foreground max-w-md mb-6 leading-relaxed"
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
