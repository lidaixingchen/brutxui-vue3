<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { type VariantProps } from 'class-variance-authority';
import { Check, CheckCheck, AlertCircle, Loader2 } from '@lucide/vue';
import { cn } from '@/lib/utils';
import { chatBubbleVariants, chatAvatarVariants } from './chat-bubble-variants';
import type { ChatMessage } from './types';

type ChatBubbleCvaProps = VariantProps<typeof chatBubbleVariants>;

interface ChatBubbleProps {
    message: ChatMessage;
    color?: NonNullable<ChatBubbleCvaProps['color']>;
    size?: NonNullable<ChatBubbleCvaProps['size']>;
    showAvatar?: boolean;
    showStatus?: boolean;
    showTimestamp?: boolean;
    dateFormat?: (date: Date) => string;
    class?: string;
}

const props = withDefaults(defineProps<ChatBubbleProps>(), {
    color: 'default',
    size: 'default',
    showAvatar: true,
    showStatus: true,
    showTimestamp: true,
    dateFormat: undefined,
    class: undefined,
});

const isSent = computed(() => props.message.variant === 'sent');
const isSystem = computed(() => props.message.variant === 'system');

const wrapperClass = computed(() =>
    cn(
        'flex gap-2 w-full',
        isSent.value ? 'flex-row-reverse' : 'flex-row',
        isSystem.value ? 'justify-center' : '',
    )
);

const bubbleClass = computed(() =>
    cn(
        chatBubbleVariants({
            variant: props.message.variant ?? 'received',
            color: props.color,
            size: props.size,
        }),
        isSystem.value && 'text-xs',
        props.class
    )
);

const avatarClass = computed(() => cn(chatAvatarVariants({ size: props.size })));

const contentWrapperClass = computed(() =>
    cn('flex flex-col gap-1', isSent.value ? 'items-end' : 'items-start')
);

const initials = computed(() => {
    const name = props.message.name?.trim();
    if (!name) return '?';
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }
    return words.map(w => w[0]).join('').slice(0, 2).toUpperCase();
});

const formattedTimestamp = computed(() => {
    if (!props.message.timestamp) return '';
    if (typeof props.message.timestamp === 'string') return props.message.timestamp;
    if (props.dateFormat) return props.dateFormat(props.message.timestamp);
    return props.message.timestamp.toLocaleString();
});

const avatarError = ref(false);
watch(() => props.message.avatar, () => {
    avatarError.value = false;
});

const statusIcon = computed(() => {
    if (!props.message.status) return null;
    switch (props.message.status) {
        case 'sending': return Loader2;
        case 'sent': return Check;
        case 'delivered': return CheckCheck;
        case 'read': return CheckCheck;
        case 'failed': return AlertCircle;
        default: return null;
    }
});

const statusClass = computed(() => {
    if (!props.message.status) return '';
    switch (props.message.status) {
        case 'sending': return 'text-brutal-fg/50 animate-spin';
        case 'sent': return 'text-brutal-fg/50';
        case 'delivered': return 'text-brutal-fg/70';
        case 'read': return 'text-brutal-primary';
        case 'failed': return 'text-brutal-destructive';
        default: return '';
    }
});
</script>

<template>
    <div :class="wrapperClass">
        <!-- Avatar -->
        <div
            v-if="showAvatar && !isSystem"
            :class="avatarClass"
            :title="message.name"
        >
            <img
                v-if="message.avatar && !avatarError"
                :src="message.avatar"
                :alt="message.name"
                class="w-full h-full object-cover rounded-brutal"
                @error="avatarError = true"
            >
            <span v-else>{{ initials }}</span>
        </div>

        <!-- Content -->
        <div :class="contentWrapperClass">
            <span v-if="message.name && !isSystem" class="text-xs font-bold text-brutal-fg opacity-60 px-1">
                {{ message.name }}
            </span>
            <div :class="bubbleClass">
                <slot>{{ message.content }}</slot>
            </div>
            <div v-if="showTimestamp || showStatus" class="flex items-center gap-1 px-1">
                <span v-if="showTimestamp && formattedTimestamp" class="text-xs opacity-40 font-medium">
                    {{ formattedTimestamp }}
                </span>
                <component
                    :is="statusIcon"
                    v-if="showStatus && isSent && statusIcon"
                    :class="cn('w-3 h-3', statusClass)"
                    :aria-label="message.status"
                    role="img"
                />
            </div>
        </div>
    </div>
</template>
