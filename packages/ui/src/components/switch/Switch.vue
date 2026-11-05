<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, type VNode } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Primitive, SwitchRoot, SwitchThumb, useForwardExpose } from 'reka-ui'
import { switchLabelVariants, switchRootVariants, switchThumbVariants } from './switch-variants'
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
     * 非受控模式下的初始状态，也是所属表单重置时恢复的状态。
     */
    defaultValue?: boolean
    disabled?: boolean
    variant?: NonNullable<SwitchRootVariantProps['variant']>
    size?: NonNullable<SwitchRootVariantProps['size']>
    /** 是否在滑钮内显示当前状态标签；标签仅用于装饰。 */
    showLabels?: boolean
    /** 开启状态的标签，未提供时使用 locale 默认值 I；建议使用单字符。 */
    checkedLabel?: string
    /** 关闭状态的标签，未提供时使用 locale 默认值 O；建议使用单字符。 */
    uncheckedLabel?: string
    /** 控件 ID，用于通过 Label 的 for 属性关联可见名称。 */
    id?: string
    /** 表单字段名；选中且未禁用时随所属 form 提交。 */
    name?: string
    /** 选中时提交的字段值；未提供时使用原语默认值 on。 */
    value?: string
    /** 所属原生表单要求此开关开启。 */
    required?: boolean
    /** 关联名称元素的 ID，优先于其他无障碍名称。 */
    ariaLabelledby?: string
    /** 显式无障碍名称；缺少显式名称和关联 Label 时使用 locale 默认值。 */
    ariaLabel?: string
    /** 显式开启切换时的继电器吸合音效（snap）；默认静音 */
    sound?: boolean
}

const props = withDefaults(defineProps<SwitchProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    disabled: false,
    variant: 'default',
    size: 'default',
    showLabels: false,
    checkedLabel: undefined,
    uncheckedLabel: undefined,
    id: undefined,
    name: undefined,
    value: undefined,
    required: false,
    ariaLabelledby: undefined,
    class: undefined,
    ariaLabel: undefined,
    sound: false,
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const { t } = useLocale()

const haptics = useBrutalHaptics({ sound: () => props.sound })

const { forwardRef, currentElement } = useForwardExpose()
const rootElement = computed(() => currentElement.value as HTMLButtonElement | undefined)
const resolvedAriaLabel = computed(() => props.ariaLabelledby?.trim()
    ? undefined
    : props.ariaLabel?.trim() || undefined,
)
const showFallbackName = computed(() => !resolvedAriaLabel.value && !props.ariaLabelledby?.trim())

function bindRoot(vnode: VNode): void {
    forwardRef(vnode.el as HTMLButtonElement)
}

const initialValue = props.defaultValue ?? false
const internalValue = ref(initialValue)
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

/** 用户切换播放音效；程序化更新与表单重置仅同步状态。 */
function onUserToggle(next: boolean): void {
    if (next !== currentValue.value) {
        haptics.snap()
    }
    currentValue.value = next
}

const classes = computed(() =>
    cn(
        switchRootVariants({
            variant: props.variant,
            size: props.size,
        }),
        props.class,
    ),
)

const thumbClasses = computed(() =>
    cn(
        switchThumbVariants(),
    ),
)

const labelClasses = computed(() =>
    cn(
        switchLabelVariants({ variant: currentValue.value ? props.variant : 'unchecked' }),
    ),
)

const statusLabel = computed(() => currentValue.value
    ? (props.checkedLabel ?? t('switch.checkedLabel'))
    : (props.uncheckedLabel ?? t('switch.uncheckedLabel')),
)

let ownerForm: HTMLFormElement | null = null

function onFormReset(event: Event): void {
    const input = props.name ? rootElement.value?.nextElementSibling as HTMLInputElement | null : null
    // 浏览器在 reset 事件之后读取 defaultChecked，保证同步读取表单时即得到重置值。
    if (input) {
        const checked = input.checked
        input.defaultChecked = isControlled.value ? currentValue.value : initialValue
        input.checked = checked
    }
    void nextTick(() => {
        if (event.defaultPrevented) return
        if (!isControlled.value) internalValue.value = initialValue
        if (input) input.checked = currentValue.value
    })
}

function syncFormOwner(): void {
    const element = rootElement.value
    const form = element?.form ?? null
    if (form === ownerForm) return
    ownerForm?.removeEventListener('reset', onFormReset)
    ownerForm = form
    ownerForm?.addEventListener('reset', onFormReset)
}

onMounted(syncFormOwner)
onUpdated(syncFormOwner)
onBeforeUnmount(() => ownerForm?.removeEventListener('reset', onFormReset))
</script>

<template>
    <SwitchRoot
        as-child
        :class="classes"
        :model-value="currentValue"
        :disabled="disabled"
        :name="name"
        :value="value"
        :required="required"
        @update:model-value="onUserToggle"
    >
        <Primitive
            :id="id"
            as="button"
            :aria-labelledby="ariaLabelledby"
            :aria-label="resolvedAriaLabel"
            @vue:mounted="bindRoot"
        >
            <SwitchThumb data-slot="switch-thumb" :class="thumbClasses">
                <span
                    v-if="props.showLabels"
                    :class="labelClasses"
                    aria-hidden="true"
                >{{ statusLabel }}</span>
            </SwitchThumb>
            <span v-if="showFallbackName" class="sr-only">{{ t('switch.toggle') }}</span>
        </Primitive>
    </SwitchRoot>
</template>

