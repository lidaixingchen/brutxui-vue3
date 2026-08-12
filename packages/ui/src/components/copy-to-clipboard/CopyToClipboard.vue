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
    if (succeeded) {
        // 清除失败反馈残留：copied 由 useClipboard 内部定时器控制，此处只需同步清理
        // 组件自有的 failed 状态（含定时器），保证两者互斥
        if (failedTimeoutId) clearTimeout(failedTimeoutId)
        failed.value = false
        return
    }
    failed.value = true
    if (failedTimeoutId) clearTimeout(failedTimeoutId)
    // 失败反馈时长复用 props.duration，与成功态保持一致；下限保护防止 0/负数导致反馈瞬间消失
    failedTimeoutId = setTimeout(() => {
        failed.value = false
    }, Math.max(props.duration, 100))
}

// 状态优先级需与模板 v-if 顺序保持一致：failed 优先于 copied，避免二者同时为真时
// 样式/文案/live region 播报各自为政（copied 由 useClipboard 定时器控制，组件侧无法清零）
const state = computed<'idle' | 'copied' | 'failed'>(() => {
    if (failed.value) return 'failed'
    if (copied.value) return 'copied'
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
// 优先级与模板/state 一致：failed 优先
const statusAnnouncement = computed(() => {
    if (failed.value) return t('copyToClipboard.copyFailed')
    if (copied.value) return t('copyToClipboard.copied')
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
