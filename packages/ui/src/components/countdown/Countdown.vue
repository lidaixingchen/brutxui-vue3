<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import Statistic from '../statistic/Statistic.vue'
import type { CountdownProps, CountdownEmits } from './types'
import { countdownVariants } from './countdown-variants'
import { parseCountdownTarget, formatCountdown } from './countdown-format'

const props = withDefaults(defineProps<CountdownProps>(), {
    value: undefined,
    format: 'HH:mm:ss',
    title: undefined,
    prefix: undefined,
    suffix: undefined,
    placeholder: undefined,
    variant: 'default',
    size: 'default',
    class: undefined,
})

const emit = defineEmits<CountdownEmits>()

defineSlots<{
    title?: (props: { title?: string }) => unknown
    prefix?: (props: { prefix?: string }) => unknown
    suffix?: (props: { suffix?: string }) => unknown
    default?: (props: { remaining: number; formatted: string; isFinished: boolean }) => unknown
}>()

const { t } = useLocale()

const isMounted = ref(false)
let timerId: ReturnType<typeof setTimeout> | null = null

const targetTimestamp = computed(() => parseCountdownTarget(props.value))

function clearTimer(): void {
    if (timerId !== null) {
        clearTimeout(timerId)
        timerId = null
    }
}

function calculateRemaining(): number {
    if (targetTimestamp.value === null) return 0
    return Math.max(0, targetTimestamp.value - Date.now())
}

const remaining = ref(calculateRemaining())
const isFinished = ref(targetTimestamp.value !== null && remaining.value === 0)

function tick(): void {
    if (targetTimestamp.value === null) {
        remaining.value = 0
        clearTimer()
        return
    }

    const rem = calculateRemaining()
    remaining.value = rem
    emit('change', rem)

    if (rem === 0) {
        clearTimer()
        if (!isFinished.value) {
            isFinished.value = true
            emit('finish')
        }
        return
    }

    const hasMs = /S/.test(props.format)
    const delay = hasMs
        ? Math.min(rem, 33)
        : Math.min(rem, (rem % 1000) || 1000)

    timerId = setTimeout(tick, delay)
}

function restartCountdown(): void {
    clearTimer()

    if (targetTimestamp.value === null) {
        remaining.value = 0
        isFinished.value = false
        return
    }

    const rem = calculateRemaining()
    remaining.value = rem
    emit('change', rem)

    if (rem === 0) {
        if (!isFinished.value) {
            isFinished.value = true
            emit('finish')
        }
        return
    }

    isFinished.value = false
    if (isMounted.value) {
        const hasMs = /S/.test(props.format)
        const delay = hasMs
            ? Math.min(rem, 33)
            : Math.min(rem, (rem % 1000) || 1000)
        timerId = setTimeout(tick, delay)
    }
}

function handleVisibilityChange(): void {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (!isFinished.value && targetTimestamp.value !== null) {
            clearTimer()
            tick()
        }
    }
}

function handleWindowFocus(): void {
    if (!isFinished.value && targetTimestamp.value !== null) {
        clearTimer()
        tick()
    }
}

watch(targetTimestamp, () => {
    restartCountdown()
})

watch(() => props.format, () => {
    if (isMounted.value && !isFinished.value && targetTimestamp.value !== null) {
        clearTimer()
        tick()
    }
})

onMounted(() => {
    isMounted.value = true
    if (targetTimestamp.value !== null) {
        const rem = calculateRemaining()
        remaining.value = rem
        if (rem === 0) {
            isFinished.value = true
            emit('finish')
        } else {
            isFinished.value = false
            const hasMs = /S/.test(props.format)
            const delay = hasMs
                ? Math.min(rem, 33)
                : Math.min(rem, (rem % 1000) || 1000)
            timerId = setTimeout(tick, delay)
        }
    }
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange)
    }
    if (typeof window !== 'undefined') {
        window.addEventListener('focus', handleWindowFocus)
    }
})

onBeforeUnmount(() => {
    clearTimer()
    if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWindowFocus)
    }
})

const formattedDisplay = computed(() => {
    if (targetTimestamp.value === null) {
        return props.placeholder ?? '-'
    }
    return formatCountdown(remaining.value, props.format)
})

const classes = computed(() =>
    cn(countdownVariants({ variant: props.variant }), props.class)
)
</script>

<template>
    <div :class="classes" :aria-live="isFinished ? 'polite' : 'off'">
        <Statistic
            variant="default"
            :size="size"
        >
            <template v-if="title || $slots.title" #title>
                <slot name="title" :title="title">{{ title }}</slot>
            </template>
            <template v-if="prefix || $slots.prefix" #prefix>
                <slot name="prefix" :prefix="prefix">{{ prefix }}</slot>
            </template>
            <template #default>
                <slot
                    :remaining="remaining"
                    :formatted="formattedDisplay"
                    :is-finished="isFinished"
                >
                    {{ formattedDisplay }}
                </slot>
            </template>
            <template v-if="suffix || $slots.suffix" #suffix>
                <slot name="suffix" :suffix="suffix">{{ suffix }}</slot>
            </template>
        </Statistic>
        <span v-if="isFinished" class="sr-only" role="status">
            {{ t('countdown.finished') }}
        </span>
    </div>
</template>
