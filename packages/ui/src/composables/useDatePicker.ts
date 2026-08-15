import { ref, computed, watch, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
import { formatDate } from '../lib/date'

type DatePickerEmit = ((event: 'open') => void)
    & ((event: 'close') => void)
    & ((event: 'change', value: Date | null) => void)
    & ((event: 'update:modelValue', value: Date | null) => void)

export interface UseDatePickerOptions {
    modelValue?: MaybeRefOrGetter<Date | null>
    displayFormat?: MaybeRefOrGetter<string>
    disabled?: MaybeRefOrGetter<boolean>
    readonly?: MaybeRefOrGetter<boolean>
    openProp?: MaybeRefOrGetter<boolean | undefined>
    emitUpdateOpen?: (value: boolean) => void
    emit: DatePickerEmit
}

export interface UseDatePickerReturn {
    open: Ref<boolean>
    displayValue: Ref<Date | null>
    formattedDisplay: ComputedRef<string>
    handlePanelUpdate: (value: Date | null) => void
    handlePanelConfirm: (value: Date | null) => void
    handlePanelClear: () => void
    handleClearClick: (event: Event) => void
    handleTriggerKeydown: (event: KeyboardEvent) => void
}

export function useDatePicker(options: UseDatePickerOptions): UseDatePickerReturn {
    const internalOpen = ref(false)

    const open = computed<boolean>({
        get: () => {
            const controlled = toValue(options.openProp)
            return controlled !== undefined ? controlled : internalOpen.value
        },
        set: (val) => {
            if (val && toValue(options.readonly)) return
            const controlled = toValue(options.openProp)
            if (controlled === undefined) {
                internalOpen.value = val
            }
            options.emitUpdateOpen?.(val)
        },
    })

    const displayValue = ref<Date | null>(toValue(options.modelValue) ?? null)

    let suppressCloseChange = false

    watch(open, (isOpen) => {
        if (isOpen) {
            suppressCloseChange = false
            // 打开时以 modelValue 重新初始化 displayValue：父组件单向绑定时，
            // 上次关闭前未确认的选择残留会让下次打开的面板显示过期值
            displayValue.value = toValue(options.modelValue) ?? null
            options.emit('open')
        } else {
            options.emit('close')
            if (suppressCloseChange) {
                suppressCloseChange = false
                return
            }
            const currentModel = toValue(options.modelValue) ?? null
            if (displayValue.value?.getTime() !== currentModel?.getTime()) {
                options.emit('change', displayValue.value)
            }
        }
    })

    // 无条件注册：openProp 为 undefined（非受控）时 watcher 无副作用（val 恒为 undefined 不写入），
    // 但运行期从非受控切换到受控（openProp 传入值为 undefined 的 ref 或动态引入）时，
    // 注册条件与取值能保持一致，internalOpen 不会与受控值脱节
    watch(() => toValue(options.openProp), (val) => {
        if (val !== undefined) internalOpen.value = val
    }, { immediate: true })

    watch(() => toValue(options.modelValue), (value) => {
        displayValue.value = value ?? null
    })

    const formattedDisplay = computed(() => {
        const value = toValue(options.modelValue)
        if (!value) return ''
        return formatDate(value, toValue(options.displayFormat) ?? 'YYYY-MM-DD')
    })

    function handlePanelUpdate(value: Date | null) {
        displayValue.value = value
        // 仅在新值非空时取消抑制：面板清除按钮会先 emit('clear') 再 emit('update:modelValue', null)，
        // 若此处无条件重置，会把 handlePanelClear 刚置位的 suppressCloseChange 中和掉，
        // 关闭面板时仍会重复 emit change(null)
        if (value !== null) suppressCloseChange = false
        options.emit('update:modelValue', value)
    }

    function handlePanelConfirm(value: Date | null) {
        displayValue.value = value
        options.emit('update:modelValue', value)
        options.emit('change', value)
        suppressCloseChange = true
        open.value = false
    }

    function handlePanelClear() {
        displayValue.value = null
        options.emit('update:modelValue', null)
        options.emit('change', null)
        // 已在此处 emit change(null)，面板随后关闭时不再重复 emit
        // （否则 displayValue(null) 与父组件尚未同步的旧 modelValue 的差异会触发重复 change）
        suppressCloseChange = true
    }

    function handleClearClick(event: Event) {
        event.stopPropagation()
        displayValue.value = null
        options.emit('update:modelValue', null)
        options.emit('change', null)
        suppressCloseChange = true
    }

    function handleTriggerKeydown(event: KeyboardEvent) {
        // 键盘激活移交 reka-ui PopoverTrigger 原生处理（Enter/Space 打开）；
        // 此处仅拦截 disabled/readonly 场景的 Enter/Space，避免打开后由 open setter 拒绝造成状态回弹；
        // 其余按键（如 Tab）不拦截，防止 readonly 聚焦时形成键盘焦点陷阱
        if (
            (toValue(options.disabled) || toValue(options.readonly))
            && (event.key === 'Enter' || event.key === ' ')
        ) {
            event.preventDefault()
        }
    }

    return {
        open,
        displayValue,
        formattedDisplay,
        handlePanelUpdate,
        handlePanelConfirm,
        handlePanelClear,
        handleClearClick,
        handleTriggerKeydown,
    }
}
