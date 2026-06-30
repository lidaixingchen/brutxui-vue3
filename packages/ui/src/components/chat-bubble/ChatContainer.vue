<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '../../lib/utils';
import ChatBubble from './ChatBubble.vue';
import type { ChatMessage } from './types';
import { useLocale } from '@/composables/useLocale';

const { t } = useLocale();

interface ChatMessageGroup {
    label: string;
    messages: ChatMessage[];
}

interface ChatContainerProps {
    messages: ChatMessage[];
    groupByTime?: boolean;
    groupInterval?: number;
    showAvatar?: boolean;
    showStatus?: boolean;
    showTimestamp?: boolean;
    dateFormat?: (date: Date) => string;
    class?: string;
}

const props = withDefaults(defineProps<ChatContainerProps>(), {
    groupByTime: false,
    groupInterval: 5,
    showAvatar: true,
    showStatus: true,
    showTimestamp: true,
    dateFormat: undefined,
    class: undefined,
});

function getDateLabel(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
        return t('chatBubble.today');
    }
    if (messageDate.getTime() === yesterday.getTime()) {
        return t('chatBubble.yesterday');
    }
    return date.toLocaleDateString();
}

function groupMessages(messages: ChatMessage[]): ChatMessageGroup[] {
    if (!props.groupByTime) {
        return [{ label: '', messages }];
    }

    const groups: ChatMessageGroup[] = [];
    let currentGroup: ChatMessage[] = [];
    let currentLabel = '';

    for (const message of messages) {
        const timestamp = message.timestamp;
        let date: Date | null = null;

        if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string' && timestamp) {
            date = new Date(timestamp);
        }

        const label = date ? getDateLabel(date) : '';

        if (label !== currentLabel) {
            if (currentGroup.length > 0) {
                groups.push({ label: currentLabel, messages: currentGroup });
            }
            currentGroup = [message];
            currentLabel = label;
        } else {
            currentGroup.push(message);
        }
    }

    if (currentGroup.length > 0) {
        groups.push({ label: currentLabel, messages: currentGroup });
    }

    return groups;
}

const messageGroups = computed(() => groupMessages(props.messages));

const containerClasses = computed(() =>
    cn('flex flex-col gap-4', props.class)
);
</script>

<template>
    <div :class="containerClasses" role="log" :aria-label="t('chatBubble.chatLog')">
        <template v-for="(group, groupIndex) in messageGroups" :key="groupIndex">
            <!-- Time Group Label -->
            <div v-if="group.label" class="flex items-center gap-2 my-2">
                <div class="flex-1 h-px bg-brutal-fg/20" />
                <span class="text-xs font-bold text-brutal-fg/50 px-2">
                    {{ group.label }}
                </span>
                <div class="flex-1 h-px bg-brutal-fg/20" />
            </div>

            <!-- Messages -->
            <ChatBubble
                v-for="message in group.messages"
                :key="message.id"
                :message="message"
                :show-avatar="showAvatar"
                :show-status="showStatus"
                :show-timestamp="showTimestamp"
                :date-format="dateFormat"
            />
        </template>
    </div>
</template>
