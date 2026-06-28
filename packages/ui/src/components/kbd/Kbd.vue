<script setup lang="ts">
import { computed } from 'vue';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { kbdVariants } from './kbd-variants';

type KbdVariantProps = VariantProps<typeof kbdVariants>;

interface KbdProps {
    variant?: NonNullable<KbdVariantProps['variant']>;
    size?: NonNullable<KbdVariantProps['size']>;
    class?: string;
}

const props = withDefaults(defineProps<KbdProps>(), {
    variant: 'default',
    size: 'md',
    class: undefined,
});

const classes = computed(() =>
    cn(kbdVariants({ variant: props.variant, size: props.size }), props.class)
);
</script>

<template>
    <kbd :class="classes">
        <slot />
    </kbd>
</template>
