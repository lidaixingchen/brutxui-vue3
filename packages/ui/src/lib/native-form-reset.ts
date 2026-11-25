import { computed, nextTick, onBeforeUnmount, shallowRef, triggerRef, watch, type ObjectDirective, type VNode } from 'vue'

export function useNativeFormReset<T>(controlledValue: () => T | undefined, initialValue: T, afterReset?: () => void) {
    const localValue = shallowRef(initialValue)
    const resetValue = computed(() => {
        const controlled = controlledValue()
        return controlled === undefined ? initialValue : controlled
    })
    const value = computed(() => {
        const controlled = controlledValue()
        return controlled === undefined ? localValue.value : controlled
    })
    const resetting = shallowRef(false)
    const pendingResets = shallowRef<Event[]>([])
    let anchor: HTMLElement | undefined
    let listenerRoot: Node | undefined

    function getOwner() {
        if (!anchor) return null
        if (anchor instanceof HTMLButtonElement || anchor instanceof HTMLInputElement) return anchor.form
        const formId = anchor.getAttribute('form')
        if (formId === null) return anchor.closest('form')
        const owner = (listenerRoot as Document | ShadowRoot | undefined)?.getElementById?.(formId)
        return owner instanceof HTMLFormElement ? owner : null
    }

    function onReset(event: Event) {
        if (event.target !== getOwner()) return
        pendingResets.value.push(event)
        triggerRef(pendingResets)
    }

    function finishReset(events: Event[]) {
        if (!anchor || events.every(event => event.defaultPrevented)) return
        resetting.value = true
        if (controlledValue() === undefined) localValue.value = initialValue
        afterReset?.()
        void nextTick(() => { resetting.value = false })
    }

    watch(pendingResets, pending => {
        const events = pending.splice(0)
        // 真实点击可以在 reset 仍处于派发阶段时运行微任务。
        if (events.some(event => event.eventPhase !== Event.NONE)) {
            setTimeout(() => finishReset(events))
        } else {
            finishReset(events)
        }
    })

    function bindFormReset(vnode: VNode) {
        anchor = vnode.el instanceof HTMLElement ? vnode.el : undefined
        const root = anchor?.getRootNode()
        if (root === listenerRoot) return
        listenerRoot?.removeEventListener('reset', onReset, true)
        root?.addEventListener('reset', onReset, true)
        listenerRoot = root
    }

    onBeforeUnmount(() => {
        listenerRoot?.removeEventListener('reset', onReset, true)
        anchor = undefined
    })

    function updateValue(next: T) {
        if (controlledValue() === undefined) localValue.value = next
    }

    return { value, resetValue, updateValue, bindFormReset, resetting: computed(() => resetting.value) }
}

type FieldValue = {
    current: boolean | string
    initial: boolean | string
    bubble?: boolean
    submittedValue?: string
    preserveCurrent?: boolean
}

// 浏览器通过默认属性同步重置表单，当前属性则继续反映 Vue 模型。
function applyFieldValue(input: HTMLInputElement, field: FieldValue) {
    if (typeof field.initial === 'boolean') {
        input.defaultChecked = field.initial
        input.checked = Boolean(field.current)
    } else {
        const current = field.preserveCurrent ? input.value : String(field.current)
        input.defaultValue = field.initial
        if (input.value !== current) input.value = current
    }
}

export const vNativeFormValue: ObjectDirective<HTMLInputElement, FieldValue> = {
    mounted(input, { value }) {
        applyFieldValue(input, value)
    },
    updated(input, { oldValue, value }) {
        applyFieldValue(input, value)
        if (!value.bubble || !input.form || !oldValue) return

        const previous = 'submittedValue' in oldValue ? oldValue.submittedValue : oldValue.current
        const current = 'submittedValue' in value ? value.submittedValue : value.current
        if (previous === undefined || current === undefined || previous === current) return

        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
    },
}

export function getFormValueEntries(name: string, value: unknown, required = false): [name: string, value: string][] {
    if (Array.isArray(value)) {
        if (value.length === 0 && required) return [[name, '']]
        return value.flatMap((item, index) => getFormValueEntries(`${name}[${index}]`, item))
    }
    if (value && typeof value === 'object') {
        return Object.entries(value).map(([key, item]) => [`${name}[${key}]`, String(item ?? '')])
    }
    return [[name, String(value ?? '')]]
}
