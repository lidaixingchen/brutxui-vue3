<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue';
import { type VariantProps } from 'class-variance-authority';
import { Check, CheckCheck, AlertCircle, Loader2 } from '@lucide/vue';
import { cn } from '@/lib/utils';
import { chatBubbleVariants, chatAvatarVariants } from './chat-bubble-variants';
import type { ChatMessage, MessageStatus } from './types';

type ChatBubbleCvaProps = VariantProps<typeof chatBubbleVariants>;

interface ChatBubbleProps {
    message: ChatMessage;
    /** sent 气泡的配色；**仅对 `variant='sent'` 生效**，received/system 传此值会被静默忽略 */
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

// 按 Unicode 码点截取（Array.from），避免 emoji 等非 BMP 字符被 UTF-16 代理对从中间切断产生乱码
const toInitials = (input: string): string => Array.from(input).slice(0, 2).join('').toUpperCase();

const initials = computed(() => {
    const name = props.message.name?.trim();
    if (!name) return '?';
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
        return toInitials(words[0]);
    }
    return toInitials(words.map(w => Array.from(w)[0] ?? '').join(''));
});

const formattedTimestamp = computed(() => {
    if (!props.message.timestamp) return '';
    if (typeof props.message.timestamp === 'string') return props.message.timestamp;
    if (props.dateFormat) return props.dateFormat(props.message.timestamp);
    return props.message.timestamp.toLocaleString();
});

// 同时监听 message 引用与 avatar 字符串：父组件整体替换 message 对象（如服务端重发同 URL 头像）
// 而 avatar 值不变时，也要重置错误态，避免头像占位符无法恢复为正常图片。
const avatarError = ref(false);
watch(
    () => [props.message, props.message.avatar],
    () => {
        avatarError.value = false;
    }
);

// 单一配置表：Record<MessageStatus, ...> 对闭联合类型做穷尽性检查，
// 未来新增状态时漏配图标或样式会在编译期报错，而非静默失效。
const STATUS_META: Record<MessageStatus, { icon: Component; className: string }> = {
    sending: { icon: Loader2, className: 'text-brutal-fg/50 animate-spin' },
    sent: { icon: Check, className: 'text-brutal-fg/50' },
    delivered: { icon: CheckCheck, className: 'text-brutal-fg/70' },
    read: { icon: CheckCheck, className: 'text-brutal-primary' },
    failed: { icon: AlertCircle, className: 'text-brutal-destructive' },
};

// 消息数据通常来自后端 API，status 运行时可能拿到联合类型之外的未知值；
// 用可选链兜底避免 STATUS_META[...] 为 undefined 时访问 .icon/.className 抛 TypeError
const statusIcon = computed(() => (props.message.status ? STATUS_META[props.message.status]?.icon ?? null : null));
const statusClass = computed(() => (props.message.status ? STATUS_META[props.message.status]?.className ?? '' : ''));
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
