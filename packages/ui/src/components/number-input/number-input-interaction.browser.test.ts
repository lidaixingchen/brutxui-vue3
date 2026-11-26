import { afterEach, expect, it, vi } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import { h, nextTick, ref } from 'vue'
import { mount } from '@/test/browser-mount'
import NumberInput from './NumberInput.vue'

const name = 'quantity'
let wrapper: ReturnType<typeof mount> | undefined

afterEach(() => wrapper?.unmount())

function mountField(props: InstanceType<typeof NumberInput>['$props']) {
    const submitted = vi.fn()
    wrapper = mount({
        render: () => h('form', {
            onSubmit(event: Event) {
                event.preventDefault()
                submitted(new FormData(event.target as HTMLFormElement).get(name))
            },
        }, [
            h(NumberInput, { name, ...props }),
            h('button', { type: 'submit' }, '提交'),
        ]),
    })
    const form = wrapper.element as HTMLFormElement
    return {
        form,
        input: form.querySelector<HTMLInputElement>('[role="spinbutton"]')!,
        field: page.getByRole('spinbutton'),
        increment: page.getByRole('button', { name: '增加数值' }),
        decrement: page.getByRole('button', { name: '减少数值' }),
        formValue: () => new FormData(form).get(name),
        submitted,
    }
}

it.each(['接受', '拒绝', '忽略', '非受控'] as const)('确认清空后保持数值、文本和原生表单一致（%s）', async (mode) => {
    const initialValue = 5
    const defaultValue = 3
    const model = ref<number | null>(initialValue)
    const update = vi.fn((value: number | null) => {
        if (mode === '接受') model.value = value
        if (mode === '拒绝') model.value = initialValue
    })
    const { form, field, formValue, submitted } = mountField({
        required: true,
        defaultValue,
        get modelValue() { return mode === '非受控' ? undefined : model.value },
        'onUpdate:modelValue': mode === '忽略' ? undefined : update,
    })

    await field.fill('')
    await userEvent.keyboard('{Enter}{Tab}')

    const acceptsEmpty = mode === '接受' || mode === '非受控'
    const afterClear = acceptsEmpty ? '' : String(initialValue)
    await expect.element(field).toHaveValue(afterClear)
    expect(formValue()).toBe(afterClear)
    expect(form.checkValidity()).toBe(!acceptsEmpty)
    expect(model.value).toBe(mode === '接受' ? null : initialValue)
    if (mode !== '忽略') expect(update).toHaveBeenCalledExactlyOnceWith(null)
    if (acceptsEmpty) expect(submitted).not.toHaveBeenCalled()
    else expect(submitted).toHaveBeenCalledExactlyOnceWith(afterClear)

    form.reset()
    const reset = mode === '非受控' ? String(defaultValue) : afterClear
    expect(formValue()).toBe(reset)
    await expect.element(field).toHaveValue(reset)
    if (mode !== '忽略') expect(update).toHaveBeenCalledTimes(1)
})

it('离开输入框时提交清空，后续输入仍按当前语言解析', async () => {
    const update = vi.fn()
    const { field, formValue } = mountField({ defaultValue: 5, stepSnapping: false, locale: 'de-DE', 'onUpdate:modelValue': update })
    await field.fill('')
    await userEvent.keyboard('{Tab}')
    expect(update).toHaveBeenCalledExactlyOnceWith(null)
    expect(formValue()).toBe('')

    await field.fill('1.234,5')
    await userEvent.keyboard('{Tab}')
    expect(update).toHaveBeenLastCalledWith(1234.5)
    await expect.element(field).toHaveValue('1.234,5')
    expect(formValue()).toBe('1234.5')
})

it.each(['readonly', 'disabled'] as const)('%s 禁止按键和步进按钮改值', async (lock) => {
    const update = vi.fn()
    const value = 5
    const { field, input, increment, decrement, formValue } = mountField({
        [lock]: true,
        min: 0, max: 10, defaultValue: value, 'onUpdate:modelValue': update,
    })
    input.focus()
    await userEvent.keyboard('{Home}{End}{ArrowUp}{ArrowDown}{PageUp}{PageDown}{Enter}')
    const wheel = new WheelEvent('wheel', { deltaY: 1, cancelable: true })
    input.dispatchEvent(wheel)
    expect(wheel.defaultPrevented).toBe(false)
    await expect.element(increment).toBeDisabled()
    await expect.element(decrement).toBeDisabled()
    await expect.element(field).toHaveValue(String(value))
    expect(update).not.toHaveBeenCalled()
    expect(formValue()).toBe(lock === 'readonly' ? String(value) : null)
})

it.each(['按钮', '方向键', '键盘点击', '长按', '滚轮'] as const)('%s 使用相同的步进终点', async (method) => {
    const initial = method === '长按' ? 2 : 8
    const max = 10
    const update = vi.fn()
    const { field, input, increment, formValue } = mountField({
        defaultValue: initial, min: 0, max, step: 3, stepSnapping: false, 'onUpdate:modelValue': update,
    })
    await expect.element(increment).toBeEnabled()
    if (method === '按钮') await increment.click()
    if (method === '方向键') {
        input.focus()
        await userEvent.keyboard('{ArrowUp}')
    }
    if (method === '键盘点击') {
        (increment.element() as HTMLButtonElement).focus()
        await userEvent.keyboard('[Space]')
    }
    if (method === '长按') {
        await increment.hover()
        await commands.pressPrimaryPointer()
        try {
            await expect.element(field).toHaveValue(String(max))
        } finally {
            await commands.releasePrimaryPointer()
        }
    }
    if (method === '滚轮') {
        input.focus()
        input.dispatchEvent(new WheelEvent('wheel', { deltaY: 1, cancelable: true }))
        await nextTick()
    }
    await expect.element(field).toHaveValue(String(max))
    await expect.element(increment).toBeDisabled()
    expect(formValue()).toBe(String(max))
    expect(update.mock.calls.map(([value]) => value)).toEqual(method === '长按' ? [5, 8, max] : [max])
})

it('允许最后一个对齐步距并在其后禁用增加按钮', async () => {
    const { field, increment, formValue } = mountField({ defaultValue: 8, min: 0, max: 10, step: 3 })
    await increment.click()
    await expect.element(field).toHaveValue('9')
    await expect.element(increment).toBeDisabled()
    expect(formValue()).toBe('9')
})

it('边界和步进保留实际小数值，即使本地化显示会四舍五入', async () => {
    const update = vi.fn()
    const min = 0.21
    const max = 0.27
    const { field, input, increment, decrement, formValue } = mountField({
        defaultValue: 0.23, min, max, step: 0.01, stepSnapping: false, locale: 'en-US',
        formatOptions: { maximumFractionDigits: 1 }, 'onUpdate:modelValue': update,
    })
    input.focus()
    await userEvent.keyboard('{End}')
    await expect.element(field).toHaveValue('0.3')
    await expect.element(field).toHaveAttribute('aria-valuenow', String(max))
    await expect.element(increment).toBeDisabled()
    expect(formValue()).toBe(String(max))
    await userEvent.keyboard('{ArrowDown}')
    expect(formValue()).toBe('0.26')
    await userEvent.keyboard('{Home}')
    await expect.element(decrement).toBeDisabled()
    expect(formValue()).toBe(String(min))
    expect(update.mock.calls.map(([value]) => value)).toEqual([max, 0.26, min])
})

it.each([
    { draft: '0.5', expected: -1, display: '-1', entry: '方向键', options: {} },
    { draft: '100', expected: 9, display: '9', entry: '按钮', options: { min: 0, max: 10, step: 3 } },
    {
        draft: '1,24', expected: 1.25, display: '1,3', entry: '滚轮',
        options: { step: 0.01, stepSnapping: false, locale: 'de-DE', formatOptions: { maximumFractionDigits: 1 } },
    },
    {
        draft: '($1.24)', expected: -1.25, display: '($1.3)', entry: '方向键',
        options: {
            step: 0.01, stepSnapping: false,
            formatOptions: {
                style: 'currency', currency: 'USD', currencySign: 'accounting', maximumFractionDigits: 1,
            } satisfies Intl.NumberFormatOptions,
        },
    },
])('$entry 从原始草稿 $draft 步进后提交 $expected', async ({ draft, expected, display, entry, options }) => {
    const update = vi.fn()
    const { field, form, input, decrement } = mountField({ defaultValue: 5, locale: 'en-US', ...options, 'onUpdate:modelValue': update })

    await field.fill(draft)
    if (entry === '方向键') await userEvent.keyboard('{ArrowDown}')
    if (entry === '按钮') await decrement.click()
    if (entry === '滚轮') input.dispatchEvent(new WheelEvent('wheel', { deltaY: 1, cancelable: true }))

    await expect.element(field).toHaveValue(display)
    await expect.element(field).toHaveAttribute('aria-valuenow', String(expected))
    expect(new FormData(form).getAll(name)).toEqual([String(expected)])
    expect(form.querySelectorAll('[role="group"]')).toHaveLength(1)
    expect(update).toHaveBeenCalledExactlyOnceWith(expected)
})
