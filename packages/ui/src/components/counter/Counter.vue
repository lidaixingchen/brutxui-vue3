<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { counterVariants } from './counter-variants';

type CounterVariantProps = VariantProps<typeof counterVariants>;

interface CounterProps {
    to: number;
    from?: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    separator?: string;
    easing?: 'linear' | 'ease-out' | 'ease-in-out';
    autoStart?: boolean;
    size?: NonNullable<CounterVariantProps['size']>;
    class?: string;
}

const props = withDefaults(defineProps<CounterProps>(), {
    from: 0,
    duration: 2000,
    decimals: 0,
    prefix: '',
    suffix: '',
    separator: ',',
    easing: 'ease-out',
    autoStart: true,
    size: 'md',
});

const emit = defineEmits<{
    complete: [];
}>();

const current = ref(props.from);
let rafId: number | null = null;
let startTime: number | null = null;

function easingFn(t: number): number {
    if (props.easing === 'linear') return t;
    if (props.easing === 'ease-out') return 1 - Math.pow(1 - t, 3);
    // ease-in-out
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function formatNumber(val: number): string {
    const fixed = val.toFixed(props.decimals);
    if (!props.separator) return fixed;
    const [int, dec] = fixed.split('.');
    const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, props.separator);
    return dec !== undefined ? `${formatted}.${dec}` : formatted;
}

function animate(ts: number) {
    if (startTime === null) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / props.duration, 1);
    const eased = easingFn(progress);
    current.value = props.from + (props.to - props.from) * eased;

    if (progress < 1) {
        rafId = requestAnimationFrame(animate);
    } else {
        current.value = props.to;
        emit('complete');
    }
}

function start() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    startTime = null;
    current.value = props.from;
    rafId = requestAnimationFrame(animate);
}

function stop() {
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}

// Expose for manual control
defineExpose({ start, stop });

onMounted(() => {
    if (props.autoStart) start();
});

onUnmounted(() => {
    stop();
});

watch(() => props.to, () => {
    if (props.autoStart) start();
});

const displayValue = computed(() =>
    `${props.prefix}${formatNumber(current.value)}${props.suffix}`
);

const classes = computed(() =>
    cn(counterVariants({ size: props.size }), props.class)
);
</script>

<template>
    <span :class="classes" aria-live="polite" :aria-label="displayValue">
        {{ displayValue }}
    </span>
</template>
