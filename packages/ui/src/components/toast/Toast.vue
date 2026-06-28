<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Zap } from '@lucide/vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import Button from '../button/Button.vue'
import { toastVariants } from './toast-variants'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

type ToastVariantProps = VariantProps<typeof toastVariants>

const DEFAULT_DURATION = 5000
const LEAVE_ANIMATION_DELAY = 300

interface ToastProps {
    variant?: NonNullable<ToastVariantProps['variant']>
    size?: NonNullable<ToastVariantProps['size']>
    title?: string
    description?: string
    duration?: number
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<ToastProps>(), {
    variant: 'default',
    size: 'default',
    title: undefined,
    description: undefined,
    duration: DEFAULT_DURATION,
    class: undefined,
    iconSize: 'xl',
})

const emit = defineEmits<{ close: [] }>()

const { t } = useLocale()

const isLeaving = ref(false)
const timer = ref<number | undefined>(undefined)
const leaveTimer = ref<number | undefined>(undefined)

function startLeave() {
    if (isLeaving.value) return
    isLeaving.value = true
    leaveTimer.value = window.setTimeout(() => {
        emit('close')
    }, LEAVE_ANIMATION_DELAY)
}

onMounted(() => {
    if (props.duration) {
        timer.value = window.setTimeout(() => {
            startLeave()
        }, props.duration)
    }
})

onUnmounted(() => {
    if (timer.value) window.clearTimeout(timer.value)
    if (leaveTimer.value) window.clearTimeout(leaveTimer.value)
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

const mainIconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[2.5]')
)

const closeIconClasses = cn(iconSizeVariants({ size: 'default' }), 'stroke-[3]')
</script>

<template>
    <div :class="classes" role="alert">
        <div v-if="duration" class="absolute top-0 left-0 right-0 h-1 bg-brutal-fg/10 overflow-hidden">
            <div
                class="h-full bg-brutal-fg/30 animate-nb-shrink"
                :style="{ animationDuration: `${duration}ms` }"
            />
        </div>

        <div class="flex items-start gap-4 p-4 pt-5">
            <div class="flex-shrink-0 mt-0.5">
                <component :is="iconComponent" :class="mainIconClasses" />
            </div>

            <div class="flex-1 min-w-0">
                <p v-if="title" class="font-black text-base leading-tight">
{{ title }}
</p>
                <p v-if="description" class="font-medium text-sm mt-1 opacity-80 leading-snug">
{{ description }}
</p>
                <slot />
            </div>

            <Button
                variant="default"
                size="icon"
                class="h-8 w-8 shrink-0"
                :aria-label="t('toast.close')"
                @click="startLeave"
            >
                <X :class="closeIconClasses" />
            </Button>
        </div>
    </div>
</template>
