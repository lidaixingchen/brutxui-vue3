<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Zap } from 'lucide-vue-next'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'
import { toastVariants } from './toast-variants'

type ToastVariantProps = VariantProps<typeof toastVariants>

interface ToastProps {
    variant?: NonNullable<ToastVariantProps['variant']>
    size?: NonNullable<ToastVariantProps['size']>
    title?: string
    description?: string
    onClose?: () => void
    duration?: number
    class?: string
}

const props = withDefaults(defineProps<ToastProps>(), {
    variant: 'default',
    size: 'default',
    duration: 5000,
})

const isLeaving = ref(false)
let timer: number | undefined

function startLeave() {
    isLeaving.value = true
    window.setTimeout(() => {
        props.onClose?.()
    }, 200)
}

onMounted(() => {
    if (props.duration && props.onClose) {
        timer = window.setTimeout(() => {
            startLeave()
        }, props.duration)
    }
})

onUnmounted(() => {
    if (timer) window.clearTimeout(timer)
})

const classes = computed(() =>
    cn(
        toastVariants({ variant: props.variant, size: props.size }),
        isLeaving.value && 'animate-out slide-out-to-right-full fade-out-0',
        props.class
    )
)

const iconComponent = computed(() => {
    switch (props.variant) {
        case 'success': return CheckCircle
        case 'error': return AlertCircle
        case 'warning': return AlertTriangle
        case 'info': return Info
        default: return Zap
    }
})

const closeClasses = computed(() =>
    cn(
        'flex-shrink-0 h-8 w-8 flex items-center justify-center',
        'border-2 border-brutal bg-brutal-bg',
        'shadow-brutal-sm',
        'transition-all duration-150',
        'hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5',
        'active:translate-x-1 active:translate-y-1 active:shadow-none',
        'focus:outline-none focus:ring-2 focus:ring-brutal-ring focus:ring-offset-2'
    )
)
</script>

<template>
    <div :class="classes" role="alert">
        <div v-if="duration && onClose" class="absolute top-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
                class="h-full bg-black/30 dark:bg-white/30"
                :style="{ animation: `toast-shrink ${duration}ms linear forwards` }"
            />
        </div>

        <div class="flex items-start gap-4 p-4 pt-5">
            <div class="flex-shrink-0 mt-0.5">
                <component :is="iconComponent" class="h-6 w-6 stroke-[2.5]" />
            </div>

            <div class="flex-1 min-w-0">
                <p v-if="title" class="font-black text-base leading-tight">{{ title }}</p>
                <p v-if="description" class="font-medium text-sm mt-1 opacity-80 leading-snug">{{ description }}</p>
                <slot />
            </div>

            <button v-if="onClose" :class="closeClasses" aria-label="Close" @click="startLeave">
                <X class="h-4 w-4 stroke-[3]" />
            </button>
        </div>
    </div>
</template>

<style>
@keyframes toast-shrink {
    from { width: 100%; }
    to { width: 0%; }
}
</style>
