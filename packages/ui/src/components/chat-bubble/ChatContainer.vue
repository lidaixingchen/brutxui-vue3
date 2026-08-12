<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';
import ChatBubble from './ChatBubble.vue';
import type { ChatMessage } from './types';
import { useLocale } from '@/composables/useLocale';

const MS_PER_MINUTE = 60 * 1000;

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

// 时间戳 → 毫秒数；缺失或非法时间戳返回 null（参与排序时沉底、分组时并入当前组）
function toTimestampMs(message: ChatMessage): number | null {
    const timestamp = message.timestamp;
    if (timestamp instanceof Date) {
        return Number.isNaN(timestamp.getTime()) ? null : timestamp.getTime();
    }
    if (typeof timestamp === 'string' && timestamp) {
        const parsed = new Date(timestamp);
        return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    }
    return null;
}

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
    // 非今天/昨天分支优先走 dateFormat，与消息内时间戳格式保持一致；缺失时回退系统日期格式
    return props.dateFormat?.(date) ?? date.toLocaleDateString();
}

// 时间间隔切分产生的组，展示具体时刻（HH:mm 或 dateFormat 自定义格式），使分段在视觉上可感知
function getIntervalLabel(date: Date): string {
    return props.dateFormat?.(date) ?? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupMessages(messages: ChatMessage[]): ChatMessageGroup[] {
    if (!props.groupByTime) {
        return [{ label: '', messages }];
    }

    // 分组状态机隐含「消息按时间升序」的前置条件：此处对副本做排序，保证乱序输入
    // （如先「昨天」后「今天」）仍能得到连续、不来回跳变的日期分组。带有效时间戳的
    // 消息按时间升序排列；无有效时间戳的消息（缺失，或 string 展示型时间戳如 '14:30'、
    // '昨天' 无法被 new Date 解析）按原索引固定在原位、不沉底，避免视觉顺序被静默改变。
    const withTimeMs = [...messages].map((message) => ({ message, timeMs: toTimestampMs(message) }));
    const datedSorted = withTimeMs
        .filter((item) => item.timeMs !== null)
        .sort((a, b) => a.timeMs! - b.timeMs!);
    let datedCursor = 0;
    const sorted = withTimeMs.map((item) => {
        // 无有效时间戳的消息留在原索引位置；其余位置由带时间戳消息按时间升序填充
        if (item.timeMs === null) return item.message;
        return datedSorted[datedCursor++].message;
    });

    const groups: ChatMessageGroup[] = [];
    let currentGroup: ChatMessage[] = [];
    let currentDisplayLabel = '';
    let currentDateKey = '';
    let lastTimestamp: Date | null = null;
    // groupInterval 下限约束为 1 分钟：传 0/负数会让任意相邻时间差都触发切分，退化为逐条成组且无标签
    const intervalMs = Math.max(props.groupInterval, 1) * MS_PER_MINUTE;

    for (const message of sorted) {
        const timestamp = message.timestamp;
        let date: Date | null = null;

        if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string' && timestamp) {
            date = new Date(timestamp);
        }

        if (date && Number.isNaN(date.getTime())) {
            date = null;
        }

        // 分组边界基于真实日历日期（年月日），而非展示字符串：dateFormat 是展示层
        // 格式化函数，若调用方传入时间维度格式（HH:mm、toLocaleString 等），不同日期
        // 可能被格式化出相同字符串而误合并进同一组、或同一日期被拆成多个「新日期」组。
        const dateKey = date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : '';
        const dateLabel = date ? getDateLabel(date) : '';

        const isNewDate = dateKey !== currentDateKey;
        // 边界采用严格 >：时间差恰好等于 intervalMs 仍归入同组（interval 视为组内最大间隔）
        const exceedsInterval =
            date !== null &&
            lastTimestamp !== null &&
            !isNewDate &&
            date.getTime() - lastTimestamp.getTime() > intervalMs;

        if (isNewDate) {
            if (currentGroup.length > 0) {
                groups.push({ label: currentDisplayLabel, messages: currentGroup });
            }
            currentGroup = [message];
            currentDateKey = dateKey;
            currentDisplayLabel = dateLabel;
        } else if (exceedsInterval) {
            if (currentGroup.length > 0) {
                groups.push({ label: currentDisplayLabel, messages: currentGroup });
            }
            currentGroup = [message];
            // 间隔切分产生的组展示具体时刻，而非空白标签，让分组边界可见
            currentDisplayLabel = date ? getIntervalLabel(date) : '';
        } else {
            currentGroup.push(message);
        }

        lastTimestamp = date;
    }

    if (currentGroup.length > 0) {
        groups.push({ label: currentDisplayLabel, messages: currentGroup });
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
