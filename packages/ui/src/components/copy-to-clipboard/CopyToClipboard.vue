<script setup lang="ts">
import { computed, onUnmounted, ref, toRef } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Check, Copy, X } from '@lucide/vue'
import { useClipboard, DEFAULT_COPIED_DURATION } from '@/composables/useClipboard'
import { useLocale } from '@/composables/useLocale'
import { cn } from '@/lib/utils'
import { copyToClipboardVariants } from './copy-to-clipboard-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

type CopyToClipboardVariantProps = VariantProps<typeof copyToClipboardVariants>

interface CopyToClipboardProps {
    text: string
    duration?: number
    variant?: NonNullable<CopyToClipboardVariantProps['variant']>
    size?: NonNullable<CopyToClipboardVariantProps['size']>
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<CopyToClipboardProps>(), {
    duration: DEFAULT_COPIED_DURATION,
    variant: 'default',
    size: 'default',
    class: undefined,
    iconSize: 'md',
})

const { t } = useLocale()
// duration 响应性说明：useClipboard 每次 copy 时经 toValue 读取最新 duration，变更对后续复制生效；
// 但已在 copied 进行中的定时器不会随 duration 变更重置（沿用触发复制时读到的旧时长），属预期限制
const { copy, copied, isSupported } = useClipboard({ duration: toRef(props, 'duration') })

// 复制失败反馈：useClipboard 内部已 catch 并 console.error，但组件层面若不反馈，
// 用户看到按钮「无反应」（静默失败）；isSupported 是初始化快照，运行时失效仍由
// copy 返回 false 兜底
const failed = ref(false)
let failedTimeoutId: ReturnType<typeof setTimeout> | null = null
onUnmounted(() => {
    if (failedTimeoutId) clearTimeout(failedTimeoutId)
})

const handleCopy = async () => {
    if (!isSupported.value) return
    const succeeded = await copy(props.text)
    if (!succeeded) {
        failed.value = true
        if (failedTimeoutId) clearTimeout(failedTimeoutId)
        failedTimeoutId = setTimeout(() => {
            failed.value = false
        }, DEFAULT_COPIED_DURATION)
    }
}

const state = computed<'idle' | 'copied' | 'failed'>(() => {
    if (copied.value) return 'copied'
    if (failed.value) return 'failed'
    return 'idle'
})

const classes = computed(() =>
    cn(
        copyToClipboardVariants({
            variant: props.variant,
            size: props.size,
            state: state.value,
        }),
        props.class
    )
)

// 视觉隐藏的 live region：让屏幕阅读器在按钮未聚焦时也能感知复制成功/失败状态变化
const statusAnnouncement = computed(() => {
    if (copied.value) return t('copyToClipboard.copied')
    if (failed.value) return t('copyToClipboard.copyFailed')
    return ''
})

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <button
        type="button"
        :disabled="!isSupported"
        :class="classes"
        @click="handleCopy"
    >
        <slot :copied="copied" :failed="failed">
            <template v-if="failed">
                <X :class="iconClasses" />
                <span>{{ t('copyToClipboard.copyFailed') }}</span>
            </template>
            <template v-else-if="copied">
                <Check :class="iconClasses" />
                <span>{{ t('copyToClipboard.copied') }}</span>
            </template>
            <template v-else>
                <Copy :class="iconClasses" />
                <span>{{ t('copyToClipboard.copy') }}</span>
            </template>
        </slot>
    </button>
    <span class="sr-only" role="status">{{ statusAnnouncement }}</span>
</template>
