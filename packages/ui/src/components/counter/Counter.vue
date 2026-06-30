<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, type Component } from 'vue';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { counterVariants } from './counter-variants';

const DEFAULT_COUNTER_DURATION = 2000

type CounterVariantProps = VariantProps<typeof counterVariants>;

interface CounterProps {
    to: number;
    from?: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    prefixComponent?: Component;
    suffixComponent?: Component;
    animatePrefix?: boolean;
    animateSuffix?: boolean;
    separator?: string;
    easing?: 'linear' | 'ease-out' | 'ease-in-out';
    autoStart?: boolean;
    variant?: NonNullable<CounterVariantProps['variant']>;
    size?: NonNullable<CounterVariantProps['size']>;
    class?: string;
}

const props = withDefaults(defineProps<CounterProps>(), {
    from: 0,
    duration: DEFAULT_COUNTER_DURATION,
    decimals: 0,
    prefix: '',
    suffix: '',
    prefixComponent: undefined,
    suffixComponent: undefined,
    animatePrefix: true,
    animateSuffix: true,
    separator: ',',
    easing: 'ease-out',
    autoStart: true,
    variant: 'default',
    size: 'md',
    class: undefined,
});

const emit = defineEmits<{
    complete: [];
}>();

const current = ref(props.from);
const rootRef = ref<HTMLElement | null>(null);
const measureRef = ref<HTMLElement | null>(null);
const scaleFactor = ref(1);
let resizeObserver: ResizeObserver | null = null;
let rafId: number | null = null;
let startTime: number | null = null;
let scaleRafId: number | null = null;

function easingFn(t: number): number {
    if (props.easing === 'linear') return t;
    if (props.easing === 'ease-out') return 1 - Math.pow(1 - t, 3);
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

function play() {
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

defineExpose({ play, stop });

function scheduleUpdateScale() {
    if (scaleRafId !== null) return;
    scaleRafId = requestAnimationFrame(() => {
        scaleRafId = null;
        updateScale();
    });
}

function updateScale() {
    const measure = measureRef.value;
    const root = rootRef.value;
    if (!measure || !root) return;
    const naturalWidth = measure.scrollWidth;
    const constrainedWidth = root.clientWidth;
    if (naturalWidth > constrainedWidth) {
        scaleFactor.value = constrainedWidth / naturalWidth;
    } else {
        scaleFactor.value = 1;
    }
}

onMounted(() => {
    if (props.autoStart) play();
    nextTick(() => {
        const root = rootRef.value;
        if (!root) return;
        updateScale();
        resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(root);
    });
});

onBeforeUnmount(() => {
    stop();
    if (scaleRafId !== null) {
        cancelAnimationFrame(scaleRafId);
        scaleRafId = null;
    }
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
});

watch(() => [props.to, props.from] as const, () => {
    if (props.autoStart) {
        play();
    } else {
        stop(); // Stop any ongoing animation
        current.value = props.from;
    }
});

watch(() => props.duration, (newDuration, oldDuration) => {
    if (startTime === null || rafId === null) return;
    if (!newDuration || !oldDuration) return;
    const now = performance.now();
    const elapsed = now - startTime;
    const oldProgress = Math.min(elapsed / oldDuration, 1);
    startTime = now - oldProgress * newDuration;
});

watch(() => [props.to, props.prefix, props.suffix, props.separator, props.decimals, props.size, props.variant] as const, () => {
    scheduleUpdateScale();
});

const formattedCurrent = computed(() => formatNumber(current.value));

const displayValue = computed(() =>
    `${props.prefix}${formattedCurrent.value}${props.suffix}`
);

const finalDisplayValue = computed(() =>
    `${props.prefix}${formatNumber(props.to)}${props.suffix}`
);

const hasCustomPrefix = computed(() => !!props.prefixComponent);
const hasCustomSuffix = computed(() => !!props.suffixComponent);

const scaleStyle = computed(() => {
    if (scaleFactor.value >= 1) return undefined;
    return {
        transform: `scale(${scaleFactor.value})`,
        transformOrigin: 'left center' as const,
    };
});

const classes = computed(() =>
    cn(counterVariants({ variant: props.variant, size: props.size }), props.class)
);

const measureClasses = computed(() =>
    cn(counterVariants({ variant: props.variant, size: props.size }), props.class, 'absolute invisible whitespace-nowrap !max-w-none')
);
</script>

<template>
    <span class="relative inline-flex max-w-full min-w-0 items-center">
        <span ref="measureRef" :class="measureClasses" aria-hidden="true">
            {{ finalDisplayValue }}
        </span>
        <span ref="rootRef" :class="classes" :style="scaleStyle" aria-live="polite" :aria-label="displayValue">
            <span v-if="animatePrefix && hasCustomPrefix" class="inline-flex">
                <component :is="prefixComponent" />
            </span>
            <span v-else-if="prefix">{{ prefix }}</span>
            {{ formattedCurrent }}
            <span v-if="animateSuffix && hasCustomSuffix" class="inline-flex">
                <component :is="suffixComponent" />
            </span>
            <span v-else-if="suffix">{{ suffix }}</span>
        </span>
    </span>
</template>
