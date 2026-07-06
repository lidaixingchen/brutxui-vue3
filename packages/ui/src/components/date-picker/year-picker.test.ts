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
        await trigger.trigger('keydown', { key: 'Enter' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('opens panel on Space key', async () => {
        wrapper = mount(YearPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: ' ' })
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
    it('renders dialog with aria-modal', () => {
        wrapper = mount(YearPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.exists()).toBe(true)
        expect(dialog.attributes('aria-modal')).toBe('true')
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
        expect(wrapper.text()).toContain('2010')
        expect(wrapper.text()).toContain('2021')
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
        expect(wrapper.text()).toContain('2030')
        expect(wrapper.text()).toContain('2041')
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
})
