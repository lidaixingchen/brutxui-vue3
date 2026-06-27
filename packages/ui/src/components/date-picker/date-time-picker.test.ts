import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DateTimePicker from './DateTimePicker.vue'
import DateTimePickerPanel from './DateTimePickerPanel.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { type DatePickerShortcut } from './types'

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

describe('DateTimePicker', () => {
    it('renders trigger with combobox role', () => {
        wrapper = mount(DateTimePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.exists()).toBe(true)
    })

    it('applies custom class', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { class: 'custom-dt-picker' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('custom-dt-picker')
    })

    it('shows default placeholder text', () => {
        wrapper = mount(DateTimePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Select date and time')
    })

    it('shows custom placeholder text', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { placeholder: 'Choose datetime...' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Choose datetime...')
    })

    it('shows formatted datetime when modelValue set', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5, 14, 30) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026-01-05 14:30')
    })

    it('includes seconds in default format when showSeconds is true', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5, 14, 30, 45),
                showSeconds: true,
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026-01-05 14:30:45')
    })

    it('respects custom displayFormat', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5, 14, 30),
                displayFormat: 'YYYY/MM/DD HH:mm',
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026/01/05 14:30')
    })

    it('applies muted foreground class when no value', () => {
        wrapper = mount(DateTimePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('text-brutal-muted-foreground')
    })

    it('does not apply muted foreground class when value set', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5, 14, 30) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).not.toContain('text-brutal-muted-foreground')
    })

    it('has aria-expanded attribute', () => {
        wrapper = mount(DateTimePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-expanded')).toBeDefined()
    })

    it('has aria-haspopup dialog', () => {
        wrapper = mount(DateTimePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    })

    it('is disabled when disabled prop is true', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('disabled')).toBeDefined()
    })

    it('applies size sm classes', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { size: 'sm' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-9')
    })

    it('applies size lg classes', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { size: 'lg' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-14')
    })

    it('applies default size classes', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { size: 'default' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-11')
    })

    it('applies error variant border class', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { variant: 'error' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-destructive')
    })

    it('applies success variant border class', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { variant: 'success' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-success')
    })

    it('shows clear button when clearable and value set', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5, 14, 30),
                clearable: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(true)
    })

    it('does not show clear button when no value', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when not clearable', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5, 14, 30) },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when disabled', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5, 14, 30),
                clearable: true,
                disabled: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when readonly', () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5, 14, 30),
                clearable: true,
                readonly: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('emits update:modelValue null when clear clicked', async () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5, 14, 30),
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
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5, 14, 30),
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
        wrapper = mount(DateTimePicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
    })

    it('emits open event when panel opens', async () => {
        wrapper = mount(DateTimePicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('emits close event when panel closes', async () => {
        wrapper = mount(DateTimePicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('click')
        await nextTick()
        expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('opens panel on Enter key', async () => {
        wrapper = mount(DateTimePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: 'Enter' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('opens panel on Space key', async () => {
        wrapper = mount(DateTimePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: ' ' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('does not open on Enter when disabled', async () => {
        wrapper = mount(DateTimePicker, {
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
        wrapper = mount(DateTimePicker, {
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
        wrapper = mount(DateTimePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        const svg = trigger.find('svg')
        expect(svg.exists()).toBe(true)
    })

    it('renders TimePicker inside panel when open', async () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const timeGroup = document.body.querySelector('[role="group"]')
        expect(timeGroup).not.toBeNull()
    })

    it('renders confirm button in panel when clearable', async () => {
        wrapper = mount(DateTimePicker, {
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
        wrapper = mount(DateTimePicker, {
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
        wrapper = mount(DateTimePicker, {
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

    it('renders shortcuts when provided', async () => {
        const today = new Date(2026, 5, 26, 0, 0, 0)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: today },
        ]
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const listbox = document.body.querySelector('[role="listbox"]')
        expect(listbox).not.toBeNull()
        const options = document.body.querySelectorAll('[role="option"]')
        expect(options.length).toBeGreaterThan(0)
        expect(options[0].textContent?.trim()).toBe('Today')
    })

    it('syncs displayValue when modelValue changes', async () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5, 10, 0) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026-01-05 10:00')
        await wrapper.setProps({ modelValue: new Date(2026, 1, 10, 15, 30) })
        expect(trigger.text()).toContain('2026-02-10 15:30')
    })

    it('renders hour and minute selects in panel', async () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const comboboxes = document.body.querySelectorAll('[role="dialog"] [role="combobox"]')
        expect(comboboxes.length).toBe(2)
    })

    it('renders second select in panel when showSeconds is true', async () => {
        wrapper = mount(DateTimePicker, {
            ...localeProvide,
            props: { clearable: true, showSeconds: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const comboboxes = document.body.querySelectorAll('[role="dialog"] [role="combobox"]')
        expect(comboboxes.length).toBe(3)
    })

    it('passes minDate and maxDate to panel', async () => {
        wrapper = mount(DateTimePicker, {
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

describe('DateTimePickerPanel', () => {
    it('renders dialog with aria-modal', () => {
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.exists()).toBe(true)
        expect(dialog.attributes('aria-modal')).toBe('true')
    })

    it('uses custom aria-label when provided', () => {
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            props: { ariaLabel: 'Custom datetime' },
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Custom datetime')
    })

    it('uses default aria-label when not provided', () => {
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Select date and time')
    })

    it('renders confirm button when clearable', () => {
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const texts = buttons.map((b) => b.text().trim())
        expect(texts).toContain('Confirm')
    })

    it('renders clear button when clearable', () => {
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const texts = buttons.map((b) => b.text().trim())
        expect(texts).toContain('Clear')
    })

    it('does not render footer when not clearable', () => {
        wrapper = mount(DateTimePickerPanel, {
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
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: new Date(2026, 5, 26) },
        ]
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        const listbox = wrapper.find('[role="listbox"]')
        expect(listbox.exists()).toBe(true)
        const options = wrapper.findAll('[role="option"]')
        expect(options).toHaveLength(1)
        expect(options[0].text()).toBe('Today')
    })

    it('does not render shortcuts listbox when no shortcuts', () => {
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const listbox = wrapper.find('[role="listbox"]')
        expect(listbox.exists()).toBe(false)
    })

    it('emits update:modelValue when shortcut clicked', async () => {
        const today = new Date(2026, 5, 26, 0, 0, 0)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: today },
        ]
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        const option = wrapper.find('[role="option"]')
        await option.trigger('click')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const value = emitted![0][0] as Date
        expect(value.toDateString()).toBe(today.toDateString())
    })

    it('marks active shortcut with aria-selected', () => {
        const today = new Date(2026, 5, 26, 0, 0, 0)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: today },
        ]
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 26, 14, 30),
                shortcuts,
            },
            attachTo: document.body,
        })
        const option = wrapper.find('[role="option"]')
        expect(option.attributes('aria-selected')).toBe('true')
    })

    it('emits confirm event with modelValue', async () => {
        const value = new Date(2026, 5, 26, 14, 30)
        wrapper = mount(DateTimePickerPanel, {
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

    it('emits clear event and update:modelValue null when clear clicked', async () => {
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 26, 14, 30),
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

    it('preserves time when shortcut clicked with existing modelValue', async () => {
        const today = new Date(2026, 5, 26, 0, 0, 0)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: today },
        ]
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 1, 14, 30, 45),
                shortcuts,
            },
            attachTo: document.body,
        })
        const option = wrapper.find('[role="option"]')
        await option.trigger('click')
        const emitted = wrapper.emitted('update:modelValue')
        const value = emitted![0][0] as Date
        expect(value.getHours()).toBe(14)
        expect(value.getMinutes()).toBe(30)
        expect(value.getSeconds()).toBe(45)
    })

    it('renders TimePicker component', () => {
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const group = wrapper.find('[role="group"]')
        expect(group.exists()).toBe(true)
    })

    it('passes showSeconds to TimePicker', () => {
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            props: { showSeconds: true },
            attachTo: document.body,
        })
        const comboboxes = wrapper.findAll('[role="group"] [role="combobox"]')
        expect(comboboxes).toHaveLength(3)
    })

    it('emits update:modelValue when time changes preserving date', async () => {
        wrapper = mount(DateTimePickerPanel, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 26, 10, 0, 0),
            },
            attachTo: document.body,
        })
        const timePicker = wrapper.findComponent({ name: 'TimePicker' })
        timePicker.vm.$emit('update:modelValue', new Date(2026, 5, 26, 15, 0, 0))
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const value = emitted![0][0] as Date
        expect(value.getHours()).toBe(15)
        expect(value.getFullYear()).toBe(2026)
        expect(value.getMonth()).toBe(5)
        expect(value.getDate()).toBe(26)
    })
})
