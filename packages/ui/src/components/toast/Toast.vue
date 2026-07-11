<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Zap } from '@lucide/vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import Button from '../button/Button.vue'
import { toastVariants } from './toast-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import { DEFAULT_TOAST_DURATION } from '@/composables/useToast'

type ToastVariantProps = VariantProps<typeof toastVariants>

const LEAVE_ANIMATION_DELAY = 300

interface ToastProps {
    variant?: NonNullable<ToastVariantProps['variant']>
    size?: NonNullable<ToastVariantProps['size']>
    title?: string
    description?: string
    duration?: number
    pauseOnHover?: boolean
    class?: string
    iconSize?: IconSize
    count?: number
}

const props = withDefaults(defineProps<ToastProps>(), {
    variant: 'default',
    size: 'default',
    title: undefined,
    description: undefined,
    duration: DEFAULT_TOAST_DURATION,
    pauseOnHover: true,
    class: undefined,
    iconSize: 'xl',
    count: 1,
})

const emit = defineEmits<{ close: [] }>()

const { t } = useLocale()

const isLeaving = ref(false)
const isPaused = ref(false)
const timer = ref<number | undefined>(undefined)
const leaveTimer = ref<number | undefined>(undefined)
const remainingTime = ref(props.duration)
let startTime = 0

function startLeave() {
    if (isLeaving.value) return
    isLeaving.value = true
    leaveTimer.value = setTimeout(() => {
        emit('close')
    }, LEAVE_ANIMATION_DELAY)
}

function startTimer() {
    startTime = performance.now()
    timer.value = setTimeout(() => {
        startLeave()
    }, remainingTime.value)
}

function pauseTimer() {
    if (isLeaving.value || !timer.value) return
    clearTimeout(timer.value)
    timer.value = undefined
    remainingTime.value -= performance.now() - startTime
    isPaused.value = true
}

function resumeTimer() {
    if (!props.duration) return
    if (isLeaving.value || timer.value) return
    if (remainingTime.value <= 0) {
        startLeave()
        return
    }
    isPaused.value = false
    startTimer()
}

onMounted(() => {
    if (props.duration) {
        remainingTime.value = props.duration
        startTimer()
    }
})

watch(() => props.duration, (newDuration) => {
    if (isLeaving.value) return
    if (timer.value) {
        clearTimeout(timer.value)
        timer.value = undefined
    }
    remainingTime.value = newDuration
    if (newDuration > 0 && !isPaused.value) {
        startTimer()
    }
})

onBeforeUnmount(() => {
    if (timer.value) clearTimeout(timer.value)
    if (leaveTimer.value) clearTimeout(leaveTimer.value)
})

function onMouseEnter() {
    if (props.pauseOnHover) pauseTimer()
}

function onMouseLeave() {
    if (props.pauseOnHover) resumeTimer()
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
        startLeave()
    }
}

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

/** 紧急变体（error/warning）使用 role="alert" + aria-live="assertive"，其他使用 role="status" + aria-live="polite" */
const isUrgentVariant = computed(() => props.variant === 'error' || props.variant === 'warning')
const ariaRole = computed(() => isUrgentVariant.value ? 'alert' : 'status')
const ariaLive = computed(() => isUrgentVariant.value ? 'assertive' : 'polite')

const progressBarStyle = computed(() => ({
    animationDuration: `${props.duration}ms`,
    animationPlayState: isPaused.value ? 'paused' as const : 'running' as const,
}))
</script>

<template>
    <div :class="classes" :role="ariaRole" :aria-live="ariaLive" tabindex="0" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" @keydown="onKeydown">
        <div v-if="duration" class="absolute top-0 left-0 right-0 h-1 bg-brutal-fg/10 overflow-hidden">
            <div
                class="h-full bg-brutal-fg/30 animate-nb-shrink"
                :style="progressBarStyle"
            />
        </div>

        <div class="flex items-start gap-4 p-4 pt-5">
            <div class="flex-shrink-0 mt-0.5">
                <component :is="iconComponent" :class="mainIconClasses" />
            </div>

            <div class="flex-1 min-w-0">
                <p v-if="title" class="font-black text-base leading-tight">
{{ title }}{{ count && count > 1 ? ` (${count})` : '' }}
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
