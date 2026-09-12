<script setup lang="ts">
import { computed, ref } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { switchRootVariants, switchThumbVariants } from './switch-variants'
import { useLocale } from '@/composables/useLocale'
import { useBrutalHaptics } from '@/composables/useBrutalHaptics'

type SwitchRootVariantProps = VariantProps<typeof switchRootVariants>

export interface SwitchProps {
    class?: string
    /**
     * 绑定值，支持 v-model（受控模式）。传入 null 时视作 false 关闭状态。
     */
    modelValue?: boolean | null
    /**
     * 非受控模式下的初始选中状态；优先级高于 defaultChecked。
     */
    defaultValue?: boolean
    /**
     * 非受控模式下的初始选中状态（defaultValue 的别名）。
     */
    defaultChecked?: boolean
    disabled?: boolean
    variant?: NonNullable<SwitchRootVariantProps['variant']>
    shape?: NonNullable<SwitchRootVariantProps['shape']>
    size?: NonNullable<SwitchRootVariantProps['size']>
    /** 是否在轨道内呈现工控 I / O 通断铭牌刻印（纯视觉层，零 a11y 负担） */
    showLabels?: boolean
    /** 无障碍标签，未提供时使用 locale 默认值 */
    ariaLabel?: string
    /** 显式开启切换时的继电器吸合音效（snap）；默认静音 */
    sound?: boolean
}

const props = withDefaults(defineProps<SwitchProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    defaultChecked: undefined,
    disabled: false,
    variant: 'default',
    shape: 'slider',
    size: 'default',
    showLabels: false,
    class: undefined,
    ariaLabel: undefined,
    sound: false,
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const { t } = useLocale()

const haptics = useBrutalHaptics({ sound: () => props.sound })

const resolvedAriaLabel = computed(() => props.ariaLabel?.trim() || t('switch.toggle'))

const internalValue = ref(props.defaultValue ?? props.defaultChecked ?? false)
const isControlled = computed(() => props.modelValue !== undefined)
const currentValue = computed({
    get: () => (isControlled.value ? Boolean(props.modelValue) : internalValue.value),
    set: (val: boolean) => {
        if (!isControlled.value) {
            internalValue.value = val
        }
        emit('update:modelValue', val)
    },
})

/** 用户切换入口：音效副作用在此处只触发一次（computed setter 可能被响应式链路重入多次） */
function onUserToggle(val: boolean | string | number): void {
    const next = Boolean(val)
    if (next !== currentValue.value) {
        haptics.snap()
    }
    currentValue.value = next
}

const classes = computed(() =>
    cn(
        switchRootVariants({
            variant: props.variant,
            shape: props.shape,
            size: props.size,
        }),
        props.class,
    ),
)

const thumbClasses = computed(() =>
    cn(
        switchThumbVariants({
            shape: props.shape,
            size: props.size,
        }),
    ),
)
</script>

<template>
    <SwitchRoot
        :class="classes"
        :model-value="currentValue"
        :disabled="disabled"
        :aria-label="resolvedAriaLabel"
        @update:model-value="onUserToggle"
    >
        <!-- 工控通断铭牌刻印层（纯视觉呈现，打上 aria-hidden） -->
        <span
            v-if="props.showLabels"
            class="pointer-events-none absolute inset-0 flex select-none items-center justify-between px-2 font-mono text-[10px] font-black"
            aria-hidden="true"
        >
            <span :class="currentValue ? 'opacity-30' : 'opacity-100 text-brutal-fg'">O</span>
            <span :class="currentValue ? 'opacity-100 text-brutal-primary-foreground' : 'opacity-30'">I</span>
        </span>

        <!-- 3D 机械滑块键帽 -->
        <SwitchThumb :class="thumbClasses">
            <span class="flex items-center justify-center gap-0.5" aria-hidden="true">
                <span class="h-2 w-[1.5px] bg-brutal-border-color/60" />
                <span class="h-2 w-[1.5px] bg-brutal-border-color/60" />
            </span>
        </SwitchThumb>
    </SwitchRoot>
</template>

