import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DatePickerRange from './DatePickerRange.vue'
import DatePickerRangePanel from './DatePickerRangePanel.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { type DatePickerRangeShortcut } from './types'

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

describe('DatePickerRange', () => {
    it('renders trigger with combobox role', () => {
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.exists()).toBe(true)
    })

    it('applies custom class', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { class: 'custom-range-picker' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('custom-range-picker')
    })

    it('shows default start and end placeholders', () => {
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Start date')
        expect(trigger.text()).toContain('End date')
    })

    it('shows custom start and end placeholders', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: {
                startPlaceholder: 'From...',
                endPlaceholder: 'To...',
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('From...')
        expect(trigger.text()).toContain('To...')
    })

    it('shows default separator', () => {
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('to')
    })

    it('shows custom separator', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { separator: '—' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('—')
    })

    it('shows formatted dates when modelValue set', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: {
                modelValue: [new Date(2026, 0, 5), new Date(2026, 0, 10)],
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026-01-05')
        expect(trigger.text()).toContain('2026-01-10')
    })

    it('respects custom displayFormat', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: {
                modelValue: [new Date(2026, 0, 5), new Date(2026, 0, 10)],
                displayFormat: 'YYYY/MM/DD',
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026/01/05')
        expect(trigger.text()).toContain('2026/01/10')
    })

    it('applies muted foreground class when no value', () => {
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('text-brutal-muted-foreground')
    })

    it('does not apply muted foreground class when value set', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: {
                modelValue: [new Date(2026, 0, 5), new Date(2026, 0, 10)],
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).not.toContain('text-brutal-muted-foreground')
    })

    it('has aria-expanded attribute', () => {
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-expanded')).toBeDefined()
    })

    it('has aria-haspopup dialog', () => {
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    })

    it('is disabled when disabled prop is true', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('disabled')).toBeDefined()
    })

    it('applies size sm classes', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { size: 'sm' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-9')
    })

    it('applies size lg classes', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { size: 'lg' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-14')
    })

    it('applies default size classes', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { size: 'default' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-11')
    })

    it('applies error variant border class', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { variant: 'error' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-destructive')
    })

    it('applies success variant border class', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { variant: 'success' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-success')
    })

    it('shows clear button when clearable and value set', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: {
                modelValue: [new Date(2026, 0, 5), new Date(2026, 0, 10)],
                clearable: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(true)
    })

    it('does not render a nested button for the clear control', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: {
                modelValue: [new Date(2026, 0, 5), new Date(2026, 0, 10)],
                clearable: true,
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.findAll('button')).toHaveLength(0)
    })

    it('does not show clear button when no value', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when not clearable', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: {
                modelValue: [new Date(2026, 0, 5), new Date(2026, 0, 10)],
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when disabled', () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: {
                modelValue: [new Date(2026, 0, 5), new Date(2026, 0, 10)],
                clearable: true,
                disabled: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('emits update:modelValue null when clear clicked', async () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: {
                modelValue: [new Date(2026, 0, 5), new Date(2026, 0, 10)],
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
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: {
                modelValue: [new Date(2026, 0, 5), new Date(2026, 0, 10)],
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
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
    })

    it('emits open event when panel opens', async () => {
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('emits close event when panel closes', async () => {
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('click')
        await nextTick()
        expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('opens panel on Enter key', async () => {
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: 'Enter' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('opens panel on Space key', async () => {
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: ' ' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('does not open on Enter when disabled', async () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: 'Enter' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeFalsy()
    })

    it('renders calendar icon in trigger', () => {
        wrapper = mount(DatePickerRange, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        const svg = trigger.find('svg')
        expect(svg.exists()).toBe(true)
    })

    it('renders confirm button in panel when clearable', async () => {
        wrapper = mount(DatePickerRange, {
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
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const buttons = document.body.querySelectorAll('[role="dialog"] button')
        const texts = Array.from(buttons).map((b) => b.textContent?.trim())
        expect(texts).toContain('Clear')
    })

    it('renders shortcuts in panel when provided', async () => {
        const shortcuts: DatePickerRangeShortcut[] = [
            {
                label: 'Last 7 days',
                value: () => {
                    const end = new Date(2026, 0, 10)
                    const start = new Date(2026, 0, 4)
                    return [start, end]
                },
            },
        ]
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const options = document.body.querySelectorAll('[role="option"]')
        expect(options.length).toBeGreaterThan(0)
        expect(options[0].textContent).toContain('Last 7 days')
    })

    it('passes minDate and maxDate to panel', async () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: {
                minDate: new Date(2026, 0, 1),
                maxDate: new Date(2026, 11, 31),
            },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
    })

    it('syncs displayValue when modelValue changes', async () => {
        wrapper = mount(DatePickerRange, {
            ...localeProvide,
            props: { modelValue: null },
            attachTo: document.body,
        })
        await wrapper.setProps({
            modelValue: [new Date(2026, 0, 5), new Date(2026, 0, 10)],
        })
        await nextTick()
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026-01-05')
        expect(trigger.text()).toContain('2026-01-10')
    })
})

describe('DatePickerRangePanel', () => {
    it('renders with dialog role', () => {
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.exists()).toBe(true)
    })

    it('renders with aria-modal true', () => {
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-modal')).toBe('true')
    })

    it('uses custom aria-label when provided', () => {
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            props: { ariaLabel: 'Select date range' },
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Select date range')
    })

    it('uses default aria-label when not provided', () => {
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Start date')
    })

    it('renders confirm button when clearable', () => {
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const texts = buttons.map((b) => b.text().trim())
        expect(texts).toContain('Confirm')
    })

    it('renders clear button when clearable', () => {
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const texts = buttons.map((b) => b.text().trim())
        expect(texts).toContain('Clear')
    })

    it('does not render footer buttons when not clearable', () => {
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            props: { clearable: false },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const texts = buttons.map((b) => b.text().trim())
        expect(texts).not.toContain('Confirm')
        expect(texts).not.toContain('Clear')
    })

    it('renders shortcuts listbox when shortcuts provided', () => {
        const shortcuts: DatePickerRangeShortcut[] = [
            {
                label: 'This week',
                value: () => {
                    const end = new Date(2026, 0, 7)
                    const start = new Date(2026, 0, 1)
                    return [start, end]
                },
            },
        ]
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        const listbox = wrapper.find('[role="listbox"]')
        expect(listbox.exists()).toBe(true)
        const options = wrapper.findAll('[role="option"]')
        expect(options).toHaveLength(1)
    })

    it('does not render shortcuts listbox when no shortcuts', () => {
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            props: { shortcuts: [] },
            attachTo: document.body,
        })
        const listbox = wrapper.find('[role="listbox"]')
        expect(listbox.exists()).toBe(false)
    })

    it('emits confirm with current modelValue', async () => {
        const modelValue: [Date, Date] = [new Date(2026, 0, 5), new Date(2026, 0, 10)]
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            props: { modelValue, clearable: true },
            attachTo: document.body,
        })
        const confirmBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Confirm')
        await confirmBtn!.trigger('click')
        expect(wrapper.emitted('confirm')).toBeTruthy()
        expect(wrapper.emitted('confirm')![0]).toEqual([modelValue])
    })

    it('emits clear and update:modelValue null', async () => {
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            props: {
                modelValue: [new Date(2026, 0, 5), new Date(2026, 0, 10)],
                clearable: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Clear')
        await clearBtn!.trigger('click')
        expect(wrapper.emitted('clear')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
    })

    it('marks shortcut as active when modelValue matches', () => {
        const start = new Date(2026, 0, 1)
        const end = new Date(2026, 0, 7)
        const shortcuts: DatePickerRangeShortcut[] = [
            { label: 'First week', value: [start, end] },
        ]
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            props: { modelValue: [start, end], shortcuts },
            attachTo: document.body,
        })
        const option = wrapper.find('[role="option"]')
        expect(option.attributes('aria-selected')).toBe('true')
    })

    it('emits update:modelValue when shortcut clicked', async () => {
        const start = new Date(2026, 0, 1)
        const end = new Date(2026, 0, 7)
        const shortcuts: DatePickerRangeShortcut[] = [
            { label: 'First week', value: [start, end] },
        ]
        wrapper = mount(DatePickerRangePanel, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        const option = wrapper.find('[role="option"]')
        await option.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([[start, end]])
    })
})
