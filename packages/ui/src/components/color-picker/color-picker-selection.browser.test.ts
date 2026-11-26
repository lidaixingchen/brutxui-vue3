import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { h, ref } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import ColorPicker from './ColorPicker.vue'
import ColorPickerPanel from './ColorPickerPanel.vue'

const HISTORY_KEY = 'color-picker-selection-browser'
const SECOND_HISTORY_KEY = 'color-picker-selection-secondary-browser'
const PREVIEW_COLOR = '#123456'
const PRESET_COLOR = '#00ff00'
const ORIGINAL_HISTORY = ['#0056ff', '#0057ff']
const historySelection = page.getByRole('group', { name: '历史记录' })
const trigger = page.getByRole('combobox')
const input = page.getByRole('textbox')
let wrapper: ReturnType<typeof mount> | undefined

afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    localStorage.removeItem(HISTORY_KEY)
    localStorage.removeItem(SECOND_HISTORY_KEY)
})

function readHistory(key = HISTORY_KEY) {
    return JSON.parse(localStorage.getItem(key) ?? '[]')
}

function mountPicker(props: Record<string, unknown> = {}, echo = true) {
    const model = ref<string | null>('#ff0000')
    const update = vi.fn((value: string | null) => {
        if (echo) model.value = value
    })
    const change = vi.fn()
    localStorage.setItem(HISTORY_KEY, JSON.stringify(ORIGINAL_HISTORY))
    wrapper = mount({ render: () => h(ColorPicker, {
        modelValue: model.value,
        historyStorageKey: HISTORY_KEY,
        presets: [PRESET_COLOR],
        clearable: true,
        'onUpdate:modelValue': update,
        onChange: change,
        ...props,
    }) })
    return { model, update, change }
}

async function previewInput() {
    await trigger.click()
    await input.fill(PREVIEW_COLOR)
}

describe('ColorPicker final selection', () => {
    it('keeps a typed value live and commits only the clicked preset', async () => {
        const { model, update, change } = mountPicker()
        await previewInput()
        await page.getByRole('button', { name: PRESET_COLOR, exact: true }).click()

        await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
        expect(update.mock.calls).toEqual([[PREVIEW_COLOR], [PRESET_COLOR]])
        expect(change.mock.calls).toEqual([[PRESET_COLOR]])
        expect(model.value).toBe(PRESET_COLOR)
        expect(readHistory()).toEqual([PRESET_COLOR, ...ORIGINAL_HISTORY])
    })

    it('keeps the panel open on Tab and commits the history swatch activated by Enter', async () => {
        const { update, change } = mountPicker()
        await previewInput()
        await userEvent.keyboard('{Tab}')
        await expect.element(trigger).toHaveAttribute('aria-expanded', 'true')
        expect(change).not.toHaveBeenCalled()
        const selected = ORIGINAL_HISTORY[1]
        const swatch = page.getByRole('button', { name: selected, exact: true }).element() as HTMLButtonElement
        swatch.focus()
        await userEvent.keyboard('{Enter}')

        await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
        expect(update.mock.calls).toEqual([[PREVIEW_COLOR], [selected]])
        expect(change.mock.calls).toEqual([[selected]])
        expect(readHistory()).toEqual([selected, ORIGINAL_HISTORY[0]])
    })

    it.each([
        { echo: true, expectedDisplay: PREVIEW_COLOR },
        { echo: false, expectedDisplay: '#ff0000' },
    ])('cancels without committing after an input update (parent echo: $echo)', async ({ echo, expectedDisplay }) => {
        const { update, change } = mountPicker({}, echo)
        await previewInput()
        await userEvent.keyboard('{Escape}')

        await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
        await expect.element(trigger).toHaveTextContent(expectedDisplay)
        expect(update.mock.calls).toEqual([[PREVIEW_COLOR]])
        expect(change).not.toHaveBeenCalled()
        expect(readHistory()).toEqual(ORIGINAL_HISTORY)
    })

    it.each([
        { action: 'clear', expected: null },
        { action: 'confirm', expected: PREVIEW_COLOR },
        { action: 'enter', expected: PREVIEW_COLOR },
    ])('submits once with $action while editing', async ({ action, expected }) => {
        const { update, change } = mountPicker()
        await previewInput()
        if (action === 'enter') await userEvent.keyboard('{Enter}')
        else await page.getByText(action === 'clear' ? '清除' : '确认', { exact: true }).click()

        await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
        expect(update.mock.calls).toEqual(expected === null ? [[PREVIEW_COLOR], [null]] : [[PREVIEW_COLOR]])
        expect(change.mock.calls).toEqual([[expected]])
        expect(readHistory()).toEqual(expected === null ? ORIGINAL_HISTORY : [expected, ...ORIGINAL_HISTORY])
    })

    it('round-trips a translucent RGB selection through confirmation and history', async () => {
        const { change } = mountPicker({ modelValue: '#0081ff80', format: 'rgb', showAlpha: true })
        const formatted = `rgba(0, 129, 255, ${128 / 255})`
        await trigger.click()
        await expect.element(input).toHaveValue(formatted)
        await page.getByText('确认', { exact: true }).click()

        await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
        expect(change.mock.calls).toEqual([[formatted]])
        expect(readHistory()).toEqual(['#0081ff80', ...ORIGINAL_HISTORY])
    })

    it('commits keyboard slider changes when the text input is hidden', async () => {
        const { update, change } = mountPicker({ showInput: false, clearable: false })
        await trigger.click()
        const hue = page.getByRole('slider', { name: '色相' }).element() as HTMLElement
        hue.focus()
        await userEvent.keyboard('{ArrowRight}{Enter}')

        await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
        expect(update.mock.calls).toEqual([['#ff0400']])
        expect(change.mock.calls).toEqual([['#ff0400']])
        expect(readHistory()).toEqual(['#ff0400', ...ORIGINAL_HISTORY])
    })

    it('retains an uncontrolled commit across open and cancel', async () => {
        const { update, change } = mountPicker({ modelValue: undefined })
        await trigger.click()
        await page.getByRole('button', { name: PRESET_COLOR, exact: true }).click()
        await expect.element(trigger).toHaveTextContent(PRESET_COLOR)
        await previewInput()
        await userEvent.keyboard('{Escape}')

        await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
        await expect.element(trigger).toHaveTextContent(PRESET_COLOR)
        expect(update.mock.calls).toEqual([[PRESET_COLOR], [PREVIEW_COLOR]])
        expect(change.mock.calls).toEqual([[PRESET_COLOR]])
    })

    it('retains stored history when the root disables history', async () => {
        const { change } = mountPicker({ showHistory: false })
        await trigger.click()
        await page.getByRole('button', { name: PRESET_COLOR, exact: true }).click()

        await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
        expect(change.mock.calls).toEqual([[PRESET_COLOR]])
        expect(readHistory()).toEqual(ORIGINAL_HISTORY)
    })

    it('requests the value on each standalone selection when the parent does not echo', async () => {
        const update = vi.fn()
        const confirm = vi.fn()
        wrapper = mount(ColorPickerPanel, {
            props: {
                modelValue: '#ff0000',
                presets: [PRESET_COLOR],
                showHistory: false,
                'onUpdate:modelValue': update,
                onConfirm: confirm,
            },
        })
        const swatch = page.getByRole('button', { name: PRESET_COLOR, exact: true })
        await swatch.click()
        await swatch.click()

        expect(update.mock.calls).toEqual([[PRESET_COLOR], [PRESET_COLOR]])
        expect(confirm.mock.calls).toEqual([[PRESET_COLOR], [PRESET_COLOR]])
    })

    it.each([false, true])('uses the effective swatch identity and color (showAlpha: %s)', async (showAlpha) => {
        const opaque = '#ff0000'
        const translucent = '#ff000080'
        const expected = showAlpha ? translucent : opaque
        const confirm = vi.fn()
        localStorage.setItem(HISTORY_KEY, JSON.stringify([opaque, translucent]))
        wrapper = mount(ColorPickerPanel, {
            props: {
                presets: [opaque, translucent],
                showAlpha,
                historyStorageKey: HISTORY_KEY,
                onConfirm: confirm,
            },
        })
        const presets = page.getByRole('group', { name: '预设颜色' })
        const opaquePreset = presets.getByRole('button', { name: opaque, exact: true })
        const translucentPreset = presets.getByRole('button', { name: translucent, exact: true })

        await translucentPreset.click()
        await expect.element(opaquePreset).toHaveAttribute('aria-pressed', String(!showAlpha))
        await expect.element(translucentPreset).toHaveAttribute('aria-pressed', 'true')
        const sameBackground = getComputedStyle(opaquePreset.element()).backgroundColor
            === getComputedStyle(translucentPreset.element()).backgroundColor
        expect(sameBackground).toBe(!showAlpha)
        await expect.element(historySelection.getByRole('button', { name: expected, exact: true })).toHaveAttribute('aria-pressed', 'true')
        const translucentHistory = historySelection.getByRole('button', { name: translucent, exact: true })
        if (!showAlpha) await expect.element(translucentHistory).not.toBeInTheDocument()
        expect(confirm.mock.calls).toEqual([[expected]])
    })

    it('keeps the history cleared when a second mounted panel selects a new color', async () => {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(ORIGINAL_HISTORY))
        wrapper = mount({
            render: () => h('main', ['第一面板', '第二面板'].map(label => h('section', { 'aria-label': label }, [
                h(ColorPickerPanel, { presets: [PRESET_COLOR], historyStorageKey: HISTORY_KEY }),
            ]))),
        })
        const first = page.getByRole('region', { name: '第一面板' })
        const second = page.getByRole('region', { name: '第二面板' })

        await first.getByRole('button', { name: '清空历史' }).click()
        expect(readHistory()).toEqual([])
        await second.getByRole('group', { name: '预设颜色' }).getByRole('button', { name: PRESET_COLOR }).click()

        expect(readHistory()).toEqual([PRESET_COLOR])
        await expect.element(second.getByRole('button', { name: ORIGINAL_HISTORY[0], exact: true })).not.toBeInTheDocument()
    })

    it('reacts to an independently mounted panel history key, limit and visibility', async () => {
        const key = ref(HISTORY_KEY)
        const limit = ref(2)
        const enabled = ref(true)
        const secondHistory = ['#00aaff', '#00aaff80']
        localStorage.setItem(HISTORY_KEY, JSON.stringify(ORIGINAL_HISTORY))
        localStorage.setItem(SECOND_HISTORY_KEY, JSON.stringify(secondHistory))
        wrapper = mount({ render: () => h(ColorPickerPanel, {
            modelValue: '#ff0000',
            presets: ['#F00', '#ff0000', PRESET_COLOR],
            historyStorageKey: key.value,
            historyMax: limit.value,
            showHistory: enabled.value,
        }) })
        for (const color of ['#F00', '#ff0000']) {
            await expect.element(page.getByRole('button', { name: color, exact: true })).toHaveAttribute('aria-pressed', 'true')
        }
        await expect.element(historySelection.getByRole('button', { name: ORIGINAL_HISTORY[0], exact: true })).toBeVisible()

        key.value = SECOND_HISTORY_KEY
        limit.value = 1
        await expect.element(historySelection.getByRole('button', { name: secondHistory[0], exact: true })).toBeVisible()
        await expect.element(historySelection.getByRole('button', { name: secondHistory[1], exact: true })).not.toBeInTheDocument()
        await expect.element(historySelection.getByRole('button', { name: ORIGINAL_HISTORY[0], exact: true })).not.toBeInTheDocument()

        enabled.value = false
        await expect.element(historySelection).not.toBeInTheDocument()
        await page.getByRole('button', { name: PRESET_COLOR, exact: true }).click()
        expect(readHistory(SECOND_HISTORY_KEY)).toEqual(secondHistory)

        enabled.value = true
        await expect.element(historySelection.getByRole('button', { name: secondHistory[0], exact: true })).toBeVisible()
        await page.getByRole('button', { name: '#F00', exact: true }).click()
        expect(readHistory(SECOND_HISTORY_KEY)).toEqual(['#ff0000'])
        expect(readHistory()).toEqual(ORIGINAL_HISTORY)
    })
})
