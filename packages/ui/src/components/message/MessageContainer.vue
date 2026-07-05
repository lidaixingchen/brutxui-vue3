<script setup lang="ts">
import { computed } from 'vue'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { messageStore, removeMessage, type MessageItem, type MessageType } from '@/composables/useMessage'
import Button from '../button/Button.vue'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import { Z_INDEX } from '@/lib/z-index'

const { t } = useLocale()

const iconMap: Record<MessageType, typeof Info> = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
}

const typeClasses: Record<MessageType, string> = {
    info: 'bg-brutal-secondary text-brutal-fg border-brutal',
    success: 'bg-brutal-success text-brutal-fg border-brutal',
    warning: 'bg-brutal-accent text-brutal-fg border-brutal',
    error: 'bg-brutal-destructive text-brutal-fg border-brutal',
}

const iconColorClasses: Record<MessageType, string> = {
    info: 'text-brutal-fg',
    success: 'text-brutal-fg',
    warning: 'text-brutal-fg',
    error: 'text-brutal-fg',
}

function messageClasses(msg: MessageItem): string {
    return cn(
        'pointer-events-auto min-w-[320px] max-w-[480px]',
        'border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]',
        typeClasses[msg.type],
    )
}

const iconClasses = computed(() => cn(iconSizeVariants({ size: 'xl' }), 'stroke-[2.5]'))
const closeIconClasses = cn(iconSizeVariants({ size: 'default' }), 'stroke-[3]')

function handleClose(id: string): void {
    removeMessage(id)
}
</script>

<template>
    <div
        class="fixed top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none"
        :style="{ zIndex: Z_INDEX.MESSAGE }"
    >
        <TransitionGroup name="brutx-message">
            <div
                v-for="msg in messageStore"
                :key="msg.id"
                :class="messageClasses(msg)"
                role="status"
                aria-live="polite"
            >
                <div class="flex items-start gap-3 p-4">
                    <div class="flex-shrink-0 mt-0.5">
                        <component :is="iconMap[msg.type]" :class="[iconClasses, iconColorClasses[msg.type]]" />
                    </div>

                    <div class="flex-1 min-w-0">
                        <p v-if="msg.title" class="font-black text-base leading-tight">
                            {{ msg.title }}
                        </p>
                        <p v-if="msg.description" class="text-sm font-medium mt-1 opacity-80 leading-snug">
                            {{ msg.description }}
                        </p>
                    </div>

                    <Button
                        v-if="msg.closable"
                        variant="default"
                        size="icon"
                        class="h-8 w-8 shrink-0"
                        :aria-label="t('message.close')"
                        @click="handleClose(msg.id)"
                    >
                        <X :class="closeIconClasses" />
                    </Button>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<style scoped>
.brutx-message-enter-active {
    transition: all 0.3s ease-out;
}

.brutx-message-leave-active {
    transition: all 0.25s ease-in;
}

.brutx-message-enter-from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
}

.brutx-message-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

.brutx-message-move {
    transition: transform 0.3s ease;
}
</style>
