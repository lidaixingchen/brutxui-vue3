import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MonthPicker from './MonthPicker.vue'
import MonthPickerPanel from './MonthPickerPanel.vue'
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

describe('MonthPicker', () => {
    it('renders trigger with combobox role', () => {
        wrapper = mount(MonthPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.exists()).toBe(true)
    })

    it('applies custom class', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { class: 'custom-month-picker' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('custom-month-picker')
    })

    it('shows default placeholder text', () => {
        wrapper = mount(MonthPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Select month')
    })

    it('shows custom placeholder text', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { placeholder: 'Choose month...' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Choose month...')
    })

    it('shows formatted month when modelValue set', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 1) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026-06')
    })

    it('respects custom displayFormat', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 1),
                displayFormat: 'YYYY/MM',
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026/06')
    })

    it('applies muted foreground class when no value', () => {
        wrapper = mount(MonthPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('text-brutal-muted-foreground')
    })

    it('does not apply muted foreground class when value set', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 1) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).not.toContain('text-brutal-muted-foreground')
    })

    it('has aria-expanded attribute', () => {
        wrapper = mount(MonthPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-expanded')).toBeDefined()
    })

    it('has aria-haspopup dialog', () => {
        wrapper = mount(MonthPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    })

    it('is disabled when disabled prop is true', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('disabled')).toBeDefined()
    })

    it('applies size sm classes', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { size: 'sm' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-9')
    })

    it('applies size lg classes', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { size: 'lg' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-14')
    })

    it('applies default size classes', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { size: 'default' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-11')
    })

    it('applies error variant border class', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { variant: 'error' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-destructive')
    })

    it('applies success variant border class', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { variant: 'success' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-success')
    })

    it('shows clear button when clearable and value set', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 1),
                clearable: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(true)
    })

    it('does not render a nested button for the clear control', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 1),
                clearable: true,
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.findAll('button')).toHaveLength(0)
    })

    it('does not show clear button when no value', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when not clearable', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 1) },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when disabled', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 1),
                clearable: true,
                disabled: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when readonly', () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 1),
                clearable: true,
                readonly: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('emits update:modelValue null when clear clicked', async () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 1),
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
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 1),
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
        wrapper = mount(MonthPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
    })

    it('emits open event when panel opens', async () => {
        wrapper = mount(MonthPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('emits close event when panel closes', async () => {
        wrapper = mount(MonthPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('click')
        await nextTick()
        expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('opens panel on Enter key', async () => {
        wrapper = mount(MonthPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: 'Enter' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('opens panel on Space key', async () => {
        wrapper = mount(MonthPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: ' ' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('does not open on Enter when disabled', async () => {
        wrapper = mount(MonthPicker, {
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
        wrapper = mount(MonthPicker, {
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
        wrapper = mount(MonthPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        const svg = trigger.find('svg')
        expect(svg.exists()).toBe(true)
    })

    it('renders 12 month buttons in panel', async () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const gridCells = document.body.querySelectorAll('[role="gridcell"]')
        expect(gridCells).toHaveLength(12)
    })

    it('renders confirm button in panel when clearable', async () => {
        wrapper = mount(MonthPicker, {
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
        wrapper = mount(MonthPicker, {
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
        wrapper = mount(MonthPicker, {
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
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 1) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026-01')
        await wrapper.setProps({ modelValue: new Date(2026, 5, 1) })
        expect(trigger.text()).toContain('2026-06')
    })

    it('passes minDate and maxDate to panel', async () => {
        wrapper = mount(MonthPicker, {
            ...localeProvide,
            props: {
                clearable: true,
                minDate: new Date(2026, 0, 1),
                maxDate: new Date(2026, 11, 31),
            },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
    })
})

describe('MonthPickerPanel', () => {
    it('renders dialog with aria-modal', () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.exists()).toBe(true)
        expect(dialog.attributes('aria-modal')).toBe('true')
    })

    it('uses custom aria-label when provided', () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            props: { ariaLabel: 'Custom month' },
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Custom month')
    })

    it('uses default aria-label when not provided', () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Select month')
    })

    it('renders 12 month grid cells', () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        expect(gridCells).toHaveLength(12)
    })

    it('renders month names', () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        expect(wrapper.text()).toContain('Jan')
        expect(wrapper.text()).toContain('Jun')
        expect(wrapper.text()).toContain('Dec')
    })

    it('shows current year in header', () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 1) },
            attachTo: document.body,
        })
        expect(wrapper.text()).toContain('2026')
    })

    it('marks active month with aria-selected', () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 1) },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        expect(gridCells[5].attributes('aria-selected')).toBe('true')
        expect(gridCells[0].attributes('aria-selected')).toBe('false')
    })

    it('emits update:modelValue when month clicked', async () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        await gridCells[2].trigger('click')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const value = emitted![0][0] as Date
        expect(value.getMonth()).toBe(2)
        expect(value.getDate()).toBe(1)
    })

    it('emits confirm with modelValue when confirm clicked', async () => {
        const value = new Date(2026, 5, 1)
        wrapper = mount(MonthPickerPanel, {
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
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 1),
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
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            props: { clearable: false },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const texts = buttons.map((b) => b.text().trim())
        expect(texts).not.toContain('Confirm')
        expect(texts).not.toContain('Clear')
    })

    it('navigates to previous year on prev button click', async () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 1) },
            attachTo: document.body,
        })
        expect(wrapper.text()).toContain('2026')
        const prevBtn = wrapper.find('button[aria-label="Previous year"]')
        await prevBtn.trigger('click')
        expect(wrapper.text()).toContain('2025')
    })

    it('navigates to next year on next button click', async () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 1) },
            attachTo: document.body,
        })
        expect(wrapper.text()).toContain('2026')
        const nextBtn = wrapper.find('button[aria-label="Next year"]')
        await nextBtn.trigger('click')
        expect(wrapper.text()).toContain('2027')
    })

    it('disables months before minDate', () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            props: {
                minDate: new Date(2026, 5, 15),
                modelValue: new Date(2026, 5, 1),
            },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        expect(gridCells[0].attributes('disabled')).toBeDefined()
        expect(gridCells[5].attributes('disabled')).toBeUndefined()
    })

    it('disables months after maxDate', () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            props: {
                maxDate: new Date(2026, 5, 15),
                modelValue: new Date(2026, 5, 1),
            },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        expect(gridCells[11].attributes('disabled')).toBeDefined()
        expect(gridCells[5].attributes('disabled')).toBeUndefined()
    })

    it('does not emit when disabled month clicked', async () => {
        wrapper = mount(MonthPickerPanel, {
            ...localeProvide,
            props: {
                minDate: new Date(2026, 5, 15),
                modelValue: new Date(2026, 5, 1),
            },
            attachTo: document.body,
        })
        const gridCells = wrapper.findAll('[role="gridcell"]')
        await gridCells[0].trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })
})
