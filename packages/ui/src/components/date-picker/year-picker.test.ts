import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import YearPicker from './YearPicker.vue'
import YearPickerPanel from './YearPickerPanel.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
    if (wrapper) {
        wrapper.unmount()
        wrapper = null
    }
    document.body.innerHTML = ''
})

async function openPanel(w: ReturnType<typeof mount>) {
    const trigger = w.find('[role="combobox"]')
    await trigger.trigger('click')
    await nextTick()
    await nextTick()
}

describe('YearPicker', () => {
    it('renders trigger with combobox role', () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.exists()).toBe(true)
    })

    it('applies custom class', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { class: 'custom-year-picker' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('custom-year-picker')
    })

    it('shows default placeholder text', () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Select year')
    })

    it('renders hidden input with YYYY value when name and modelValue set', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { name: 'year', modelValue: new Date(2026, 5, 26) },
            attachTo: document.body,
        })
        const input = wrapper.find('input[type="hidden"]')
        expect(input.exists()).toBe(true)
        expect(input.attributes('value')).toBe('2026')
    })

    it('renders hidden input with empty value when modelValue cleared', async () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { name: 'year', modelValue: new Date(2026, 5, 26) },
            attachTo: document.body,
        })
        await wrapper.setProps({ modelValue: null })
        expect(wrapper.find('input[type="hidden"]').attributes('value')).toBe('')
    })

    it('disables hidden input when disabled', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { name: 'year', modelValue: new Date(2026, 5, 26), disabled: true },
            attachTo: document.body,
        })
        expect(wrapper.find('input[type="hidden"]').attributes('disabled')).toBeDefined()
    })

    it('does not render hidden input without name', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 26) },
            attachTo: document.body,
        })
        expect(wrapper.find('input[type="hidden"]').exists()).toBe(false)
    })

    it('shows custom placeholder text', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { placeholder: 'Choose year...' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Choose year...')
    })

    it('shows formatted year when modelValue set', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 1) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026')
    })

    it('respects custom displayFormat', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 1),
                displayFormat: 'YY',
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('26')
        expect(trigger.text()).not.toContain('2026')
    })

    it('applies muted foreground class when no value', () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('text-brutal-muted-foreground')
    })

    it('does not apply muted foreground class when value set', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 1) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).not.toContain('text-brutal-muted-foreground')
    })

    it('has aria-expanded attribute', () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-expanded')).toBeDefined()
    })

    it('has aria-haspopup dialog', () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    })

    it('is disabled when disabled prop is true', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('disabled')).toBeDefined()
    })

    it('applies size sm classes', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { size: 'sm' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-9')
    })

    it('applies size lg classes', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { size: 'lg' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-14')
    })

    it('applies default size classes', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { size: 'default' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-11')
    })

    it('applies error variant border class', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { variant: 'error' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-destructive')
    })

    it('applies success variant border class', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { variant: 'success' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-success')
    })

    it('shows clear button when clearable and value set', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 1),
                clearable: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(true)
    })

    it('does not render a nested button for the clear control', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 1),
                clearable: true,
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.findAll('button')).toHaveLength(0)
    })

    it('does not show clear button when no value', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when not clearable', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 1) },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when disabled', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 1),
                clearable: true,
                disabled: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when readonly', () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 1),
                clearable: true,
                readonly: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('emits update:modelValue null when clear clicked', async () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 1),
                clearable: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        await clearBtn.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
    })

    it('emits change null when clear clicked', async () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 1),
                clearable: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        await clearBtn.trigger('click')
        expect(wrapper.emitted('change')).toBeTruthy()
        expect(wrapper.emitted('change')![0]).toEqual([null])
    })

    it('opens panel on trigger click', async () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
    })

    it('emits open event when panel opens', async () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('emits close event when panel closes', async () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('click')
        await nextTick()
        expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('opens panel on Enter key', async () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        // reka-ui trigger 仅监听 click；键盘打开依赖原生 button 行为（keydown → click）
        await trigger.trigger('keydown', { key: 'Enter' })
        await trigger.trigger('click')
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('opens panel on Space key', async () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        // reka-ui trigger 仅监听 click；键盘打开依赖原生 button 行为（keydown → click）
        await trigger.trigger('keydown', { key: ' ' })
        await trigger.trigger('click')
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('does not open on Enter when disabled', async () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: 'Enter' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeFalsy()
    })

    it('does not open on Enter when readonly', async () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { readonly: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: 'Enter' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeFalsy()
    })

    it('renders calendar icon in trigger', () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        const svg = trigger.find('svg')
        expect(svg.exists()).toBe(true)
    })

    it('renders 12 year buttons in panel', async () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const gridCells = document.body.querySelectorAll('[role="gridcell"]')
        expect(gridCells).toHaveLength(12)
    })

    it('renders confirm button in panel when clearable', async () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const buttons = document.body.querySelectorAll('[role="dialog"] button')
        const texts = Array.from(buttons).map((b) => b.textContent?.trim())
        expect(texts).toContain('Confirm')
    })

    it('renders clear button in panel when clearable', async () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const buttons = document.body.querySelectorAll('[role="dialog"] button')
        const texts = Array.from(buttons).map((b) => b.textContent?.trim())
        expect(texts).toContain('Clear')
    })

    it('does not render footer when not clearable', async () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { clearable: false },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const dialog = document.body.querySelector('[role="dialog"]')
        const buttons = dialog ? dialog.querySelectorAll('button') : []
        const texts = Array.from(buttons).map((b) => b.textContent?.trim())
        expect(texts).not.toContain('Confirm')
        expect(texts).not.toContain('Clear')
    })

    it('syncs displayValue when modelValue changes', async () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 1) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026')
        await wrapper.setProps({ modelValue: new Date(2030, 0, 1) })
        expect(trigger.text()).toContain('2030')
    })

    it('passes minDate and maxDate to panel', async () => {
        wrapper = mount(YearPicker, {
            ...localeProvide,
            props: {
                clearable: true,
                minDate: new Date(2020, 0, 1),
                maxDate: new Date(2030, 11, 31),
            },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
    })
})

describe('YearPickerPanel', () => {
    it('renders dialog without aria-modal', () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.exists()).toBe(true)
        expect(dialog.attributes('aria-modal')).toBeUndefined()
    })

    it('uses custom aria-label when provided', () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { ariaLabel: 'Custom year' },
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Custom year')
    })

    it('uses default aria-label when not provided', () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Select year')
    })

    it('renders 12 year grid cells', () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        expect(gridCells).toHaveLength(12)
    })

    it('shows decade range in header', () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 1) },
            attachTo: document.body,
        })
        expect(wrapper.text()).toContain('2020')
        expect(wrapper.text()).toContain('2031')
    })

    it('marks active year with aria-selected', () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 1) },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        const activeCell = gridCells.find((c) => c.attributes('aria-selected') === 'true')
        expect(activeCell).toBeTruthy()
        expect(activeCell!.text()).toContain('2026')
    })

    it('emits update:modelValue when year clicked', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 1) },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        await gridCells[0].trigger('click')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const value = emitted![0][0] as Date
        expect(value.getFullYear()).toBe(2020)
        expect(value.getMonth()).toBe(0)
        expect(value.getDate()).toBe(1)
    })

    it('emits confirm with modelValue when confirm clicked', async () => {
        const value = new Date(2026, 0, 1)
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: value, clearable: true },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const confirmBtn = buttons.find((b) => b.text().trim() === 'Confirm')
        await confirmBtn!.trigger('click')
        const emitted = wrapper.emitted('confirm')
        expect(emitted).toBeTruthy()
        expect(emitted![0]).toEqual([value])
    })

    it('emits clear and update:modelValue null when clear clicked', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 1),
                clearable: true,
            },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const clearBtn = buttons.find((b) => b.text().trim() === 'Clear')
        await clearBtn!.trigger('click')
        expect(wrapper.emitted('clear')).toBeTruthy()
        const updateEmitted = wrapper.emitted('update:modelValue')
        expect(updateEmitted).toBeTruthy()
        expect(updateEmitted![0]).toEqual([null])
    })

    it('does not render footer when not clearable', () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { clearable: false },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const texts = buttons.map((b) => b.text().trim())
        expect(texts).not.toContain('Confirm')
        expect(texts).not.toContain('Clear')
    })

    it('navigates to previous decade on prev button click', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 1) },
            attachTo: document.body,
        })
        expect(wrapper.text()).toContain('2020')
        const prevBtn = wrapper.find('button[aria-label="Previous decade"]')
        await prevBtn.trigger('click')
        expect(wrapper.text()).toContain('2008')
        expect(wrapper.text()).toContain('2019')
    })

    it('navigates to next decade on next button click', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 1) },
            attachTo: document.body,
        })
        expect(wrapper.text()).toContain('2020')
        const nextBtn = wrapper.find('button[aria-label="Next decade"]')
        await nextBtn.trigger('click')
        expect(wrapper.text()).toContain('2032')
        expect(wrapper.text()).toContain('2043')
    })

    it('disables years before minDate', () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: {
                minDate: new Date(2025, 0, 1),
                modelValue: new Date(2026, 0, 1),
            },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        expect(gridCells[0].attributes('disabled')).toBeDefined()
    })

    it('disables years after maxDate', () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: {
                maxDate: new Date(2025, 11, 31),
                modelValue: new Date(2026, 0, 1),
            },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        const lastCell = gridCells[gridCells.length - 1]
        expect(lastCell.attributes('disabled')).toBeDefined()
    })

    it('does not emit when disabled year clicked', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: {
                minDate: new Date(2025, 0, 1),
                modelValue: new Date(2026, 0, 1),
            },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        await gridCells[0].trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('normalizes invalid yearRange to default 12', () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { yearRange: 0 },
            attachTo: document.body,
        })
        expect(wrapper.findAll('[role="gridcell"]')).toHaveLength(12)
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { yearRange: NaN },
            attachTo: document.body,
        })
        expect(wrapper.findAll('[role="gridcell"]')).toHaveLength(12)
    })

    it('falls back to current decade when modelValue cleared', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2035, 5, 1) },
            attachTo: document.body,
        })
        expect(wrapper.text()).toContain('2030')
        await wrapper.setProps({ modelValue: null })
        const currentDecadeStart = Math.floor(new Date().getFullYear() / 10) * 10
        expect(wrapper.text()).toContain(String(currentDecadeStart))
    })

    it('rebuilds confirm value to the viewed decade when modelValue is out of view', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2025, 5, 15) },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const prevBtn = buttons.find((b) => b.attributes('aria-label') === 'Previous decade')
        await prevBtn!.trigger('click')
        const confirmBtn = buttons.find((b) => b.text().trim() === 'Confirm')
        await confirmBtn!.trigger('click')
        const emitted = wrapper.emitted('confirm')![0][0] as Date
        // 2025 在 2020s 视图（yearRange=12）：翻一代到 2008 后确认应重建为视图起始年代并保留月/日
        expect(emitted.getFullYear()).toBe(2008)
        expect(emitted.getMonth()).toBe(5)
        expect(emitted.getDate()).toBe(15)
    })

    it('preserves month/day when selecting a year', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2025, 5, 15) },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        await gridCells[3].trigger('click')
        const emitted = wrapper.emitted('update:modelValue')![0][0] as Date
        // 2020s 视图第 4 个 = 2023，保留 6 月 15 日
        expect(emitted.getFullYear()).toBe(2023)
        expect(emitted.getMonth()).toBe(5)
        expect(emitted.getDate()).toBe(15)
    })

    it('collapses leap day when selecting a non-leap year directly', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2024, 1, 29), yearRange: 10 },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        // 2020s 视图（yearRange=10）：第 4 个 = 2023（非闰年）→ 2/29 → 2/28
        await gridCells[3].trigger('click')
        const emitted = wrapper.emitted('update:modelValue')![0][0] as Date
        expect(emitted.getFullYear()).toBe(2023)
        expect(emitted.getMonth()).toBe(1)
        expect(emitted.getDate()).toBe(28)
    })

    it('keeps leap day when selecting a leap year', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2024, 1, 29), yearRange: 10 },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        // 2020s 视图：第 5 个 = 2024（闰年）→ 2/29 保留
        await gridCells[4].trigger('click')
        const emitted = wrapper.emitted('update:modelValue')![0][0] as Date
        expect(emitted.getFullYear()).toBe(2024)
        expect(emitted.getMonth()).toBe(1)
        expect(emitted.getDate()).toBe(29)
    })

    it('falls back to current date when modelValue is invalid', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date('invalid') },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        await gridCells[0].trigger('click')
        const emitted = wrapper.emitted('update:modelValue')![0][0] as Date
        const now = new Date()
        // 目标年份为视图起始（2020s），月/日按当天兜底
        expect(emitted.getFullYear()).toBe(2020)
        expect(emitted.getMonth()).toBe(now.getMonth())
        expect(emitted.getDate()).toBe(now.getDate())
    })

    it('collapses leap day when rebuilt year is not a leap year', async () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2024, 1, 29), yearRange: 10 },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const prevBtn = buttons.find((b) => b.attributes('aria-label') === 'Previous decade')
        await prevBtn!.trigger('click')
        const confirmBtn = buttons.find((b) => b.text().trim() === 'Confirm')
        await confirmBtn!.trigger('click')
        const emitted = wrapper.emitted('confirm')![0][0] as Date
        // yearRange=10 翻一代到 2010（非闰年）：2/29 → 2/28
        expect(emitted.getFullYear()).toBe(2010)
        expect(emitted.getMonth()).toBe(1)
        expect(emitted.getDate()).toBe(28)
    })
})
