<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
    DialogRoot,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from 'reka-ui'
import {
    Info,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    X,
} from '@lucide/vue'
import Button from '../button/Button.vue'
import Input from '../input/Input.vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import {
    messageBoxCardVariants,
    messageBoxIconVariants,
    type MessageBoxType,
} from './message-box-variants'
import { iconSizeVariants } from '@/lib/icon-size-variants'

export interface MessageBoxProps {
    open?: boolean
    title?: string
    message?: string
    type?: MessageBoxType
    showCancelButton?: boolean
    showCloseButton?: boolean
    confirmButtonText?: string
    cancelButtonText?: string
    confirmButtonClass?: string
    cancelButtonClass?: string
    showInput?: boolean
    inputPlaceholder?: string
    inputValue?: string
    inputPattern?: RegExp
    inputErrorMessage?: string
    zIndex?: number
    class?: string
}

const props = withDefaults(defineProps<MessageBoxProps>(), {
    open: true,
    title: undefined,
    message: undefined,
    type: 'info',
    showCancelButton: true,
    showCloseButton: true,
    confirmButtonText: undefined,
    cancelButtonText: undefined,
    confirmButtonClass: undefined,
    cancelButtonClass: undefined,
    showInput: false,
    inputPlaceholder: undefined,
    inputValue: '',
    inputPattern: undefined,
    inputErrorMessage: undefined,
    zIndex: undefined,
    class: undefined,
})

const emit = defineEmits<{
    (e: 'update:open', val: boolean): void
    (e: 'confirm', val?: string): void
    (e: 'cancel'): void
}>()

const { t } = useLocale()

const currentInputValue = ref(props.inputValue ?? '')
const hasValidationError = ref(false)

watch(
    () => props.open,
    (opened) => {
        if (opened) {
            currentInputValue.value = props.inputValue ?? ''
            hasValidationError.value = false
        }
    }
)

watch(
    () => props.inputValue,
    (newVal) => {
        currentInputValue.value = newVal ?? ''
    }
)

watch(currentInputValue, () => {
    if (hasValidationError.value) {
        hasValidationError.value = false
    }
})

const displayTitle = computed(() => props.title ?? t('messageBox.defaultTitle'))
const confirmText = computed(() => props.confirmButtonText ?? t('messageBox.confirm'))
const cancelText = computed(() => props.cancelButtonText ?? t('messageBox.cancel'))
const errorMessageText = computed(() => props.inputErrorMessage ?? t('messageBox.inputError'))

const cardClasses = computed(() => cn(messageBoxCardVariants(), props.class))
const iconWrapperClasses = computed(() => messageBoxIconVariants({ type: props.type }))
const iconClasses = computed(() => cn(iconSizeVariants({ size: 'md' }), 'stroke-[2.5]'))
const closeIconClasses = computed(() => cn(iconSizeVariants({ size: 'md' }), 'stroke-[3]'))

const typeIconComponent = computed(() => {
    switch (props.type) {
        case 'success':
            return CheckCircle2
        case 'warning':
            return AlertTriangle
        case 'error':
            return AlertCircle
        case 'info':
        default:
            return Info
    }
})

function handleConfirm(): void {
    if (props.showInput) {
        if (props.inputPattern) {
            const pattern = new RegExp(props.inputPattern.source, props.inputPattern.flags)
            if (!pattern.test(currentInputValue.value)) {
                hasValidationError.value = true
                return
            }
        }
        emit('confirm', currentInputValue.value)
    } else {
        emit('confirm')
    }
    emit('update:open', false)
}

function handleCancel(): void {
    emit('cancel')
    emit('update:open', false)
}
</script>

<template>
    <DialogRoot
        :open="props.open"
        @update:open="(val: boolean) => emit('update:open', val)"
    >
        <DialogPortal>
            <DialogOverlay
                class="fixed inset-0 z-dialog bg-overlay backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                :style="props.zIndex !== undefined ? { zIndex: props.zIndex } : undefined"
            />
            <div
                class="fixed inset-0 z-dialog flex items-center justify-center p-4"
                :style="props.zIndex !== undefined ? { zIndex: props.zIndex } : undefined"
            >
                <DialogContent
                    :class="cardClasses"
                    @escape-key-down="handleCancel"
                    @pointer-down-outside="handleCancel"
                >
                    <!-- 顶部标题与关闭按钮 -->
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <div :class="iconWrapperClasses" aria-hidden="true">
                                <component :is="typeIconComponent" :class="iconClasses" />
                            </div>
                            <DialogTitle class="text-lg font-black tracking-tight text-brutal-fg">
                                {{ displayTitle }}
                            </DialogTitle>
                        </div>
                        <DialogClose
                            v-if="props.showCloseButton"
                            class="inline-flex items-center justify-center p-1 text-brutal-fg hover:bg-brutal-muted border-2 border-transparent hover:border-brutal transition-colors focus:outline-none"
                            @click="handleCancel"
                        >
                            <X :class="closeIconClasses" aria-hidden="true" />
                            <span class="sr-only">{{ t('dialog.close') }}</span>
                        </DialogClose>
                    </div>

                    <!-- 消息正文与输入框 -->
                    <div class="flex flex-col gap-4">
                        <DialogDescription
                            :class="props.message ? 'text-sm font-medium text-muted-foreground leading-relaxed break-words' : 'sr-only'"
                        >
                            {{ props.message || displayTitle }}
                        </DialogDescription>

                        <div v-if="props.showInput" class="flex flex-col gap-1.5">
                            <Input
                                v-model="currentInputValue"
                                :placeholder="props.inputPlaceholder"
                                :variant="hasValidationError ? 'error' : 'default'"
                                :error-message="hasValidationError ? errorMessageText : undefined"
                                autofocus
                                @keydown.enter.prevent="handleConfirm"
                            />
                        </div>
                    </div>

                    <!-- 底部操作按钮组 -->
                    <div class="flex justify-end gap-3 mt-2">
                        <Button
                            v-if="props.showCancelButton"
                            variant="outline"
                            :class="props.cancelButtonClass"
                            @click="handleCancel"
                        >
                            {{ cancelText }}
                        </Button>
                        <Button
                            variant="default"
                            :class="props.confirmButtonClass"
                            @click="handleConfirm"
                        >
                            {{ confirmText }}
                        </Button>
                    </div>
                </DialogContent>
            </div>
        </DialogPortal>
    </DialogRoot>
</template>
