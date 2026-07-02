import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DatePicker from './DatePicker.vue'
import DatePickerPanel from './DatePickerPanel.vue'
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

describe('DatePicker', () => {
    it('renders trigger with combobox role', () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.exists()).toBe(true)
    })

    it('applies custom class', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { class: 'custom-date-picker' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('custom-date-picker')
    })

    it('shows default placeholder text', () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Pick a date')
    })

    it('shows custom placeholder text', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { placeholder: 'Choose a date...' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Choose a date...')
    })

    it('shows formatted date when modelValue set', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026-01-05')
    })

    it('respects custom displayFormat', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5),
                displayFormat: 'YYYY/MM/DD',
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026/01/05')
    })

    it('applies muted foreground class when no value', () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('text-brutal-muted-foreground')
    })

    it('does not apply muted foreground class when value set', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).not.toContain('text-brutal-muted-foreground')
    })

    it('has aria-expanded attribute', () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-expanded')).toBeDefined()
    })

    it('has aria-haspopup dialog', () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    })

    it('is disabled when disabled prop is true', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('disabled')).toBeDefined()
    })

    it('applies size sm classes', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { size: 'sm' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-9')
    })

    it('applies size lg classes', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { size: 'lg' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-14')
    })

    it('applies default size classes', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { size: 'default' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-11')
    })

    it('applies error variant border class', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { variant: 'error' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-destructive')
    })

    it('applies success variant border class', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { variant: 'success' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-success')
    })

    it('shows clear button when clearable and value set', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5), clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('[role="button"][aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(true)
    })

    it('does not show clear button when no value', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('[role="button"][aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when not clearable', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5) },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('[role="button"][aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when disabled', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5),
                clearable: true,
                disabled: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('[role="button"][aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when readonly', () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5),
                clearable: true,
                readonly: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('[role="button"][aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('emits update:modelValue null when clear clicked', async () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5), clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('[role="button"][aria-label="Clear"]')
        await clearBtn.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
    })

    it('emits change null when clear clicked', async () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5), clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('[role="button"][aria-label="Clear"]')
        await clearBtn.trigger('click')
        expect(wrapper.emitted('change')).toBeTruthy()
        expect(wrapper.emitted('change')![0]).toEqual([null])
    })

    it('opens panel on trigger click', async () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
    })

    it('emits open event when panel opens', async () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('emits close event when panel closes', async () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('click')
        await nextTick()
        expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('opens panel on Enter key', async () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: 'Enter' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('opens panel on Space key', async () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: ' ' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('does not open on Enter when disabled', async () => {
        wrapper = mount(DatePicker, {
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
        wrapper = mount(DatePicker, {
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
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        const svg = trigger.find('svg')
        expect(svg.exists()).toBe(true)
    })

    it('renders confirm button in panel when clearable', async () => {
        wrapper = mount(DatePicker, {
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
        wrapper = mount(DatePicker, {
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
        wrapper = mount(DatePicker, {
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
        const today = new Date(2026, 5, 26)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: today },
        ]
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const listbox = document.body.querySelector('[role="listbox"]')
        expect(listbox).not.toBeNull()
        const options = document.body.querySelectorAll('[role="option"]')
        expect(options.length).toBe(1)
        expect(options[0].textContent).toContain('Today')
    })

    it('does not render shortcuts listbox when no shortcuts', async () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const listbox = document.body.querySelector('[role="listbox"]')
        expect(listbox).toBeNull()
    })

    it('emits update:modelValue when shortcut clicked', async () => {
        const today = new Date(2026, 5, 26)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: today },
        ]
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const option = document.body.querySelector('[role="option"]') as HTMLElement
        option.click()
        await nextTick()
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        const emitted = wrapper.emitted('update:modelValue')![0] as [Date | null]
        expect(emitted[0]).toBeInstanceOf(Date)
        expect((emitted[0] as Date).toDateString()).toBe(today.toDateString())
    })

    it('emits update:modelValue when panel emits update', async () => {
        wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const panel = wrapper.findComponent(DatePickerPanel)
        const newDate = new Date(2026, 5, 26)
        panel.vm.$emit('update:modelValue', newDate)
        await nextTick()
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([newDate])
    })

    it('emits change and closes panel on confirm', async () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const panel = wrapper.findComponent(DatePickerPanel)
        const newDate = new Date(2026, 5, 26)
        panel.vm.$emit('confirm', newDate)
        await nextTick()
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('change')).toBeTruthy()
        expect(wrapper.emitted('change')![0]).toEqual([newDate])
        expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits update:modelValue null and change null on panel clear', async () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5), clearable: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const panel = wrapper.findComponent(DatePickerPanel)
        panel.vm.$emit('clear')
        await nextTick()
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
        expect(wrapper.emitted('change')).toBeTruthy()
        expect(wrapper.emitted('change')![0]).toEqual([null])
    })

    it('passes minDate and maxDate to panel', async () => {
        const minDate = new Date(2026, 0, 1)
        const maxDate = new Date(2026, 11, 31)
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { minDate, maxDate },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const panel = wrapper.findComponent(DatePickerPanel)
        expect((panel as any).props('minDate')).toEqual(minDate)
        expect((panel as any).props('maxDate')).toEqual(maxDate)
    })

    it('passes shortcuts to panel', async () => {
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: new Date(2026, 5, 26) },
        ]
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const panel = wrapper.findComponent(DatePickerPanel)
        expect((panel as any).props('shortcuts')).toEqual(shortcuts)
    })

    it('passes clearable to panel', async () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const panel = wrapper.findComponent(DatePickerPanel)
        expect((panel as any).props('clearable')).toBe(true)
    })

    it('syncs displayValue when modelValue prop changes', async () => {
        wrapper = mount(DatePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5) },
            attachTo: document.body,
        })
        await wrapper.setProps({ modelValue: new Date(2026, 5, 26) })
        await nextTick()
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('2026-06-26')
    })
})

describe('DatePickerPanel', () => {
    it('renders with dialog role', () => {
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.exists()).toBe(true)
    })

    it('renders confirm button when clearable', () => {
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const texts = buttons.map((b) => b.text().trim())
        expect(texts).toContain('Confirm')
    })

    it('renders clear button when clearable', () => {
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const texts = buttons.map((b) => b.text().trim())
        expect(texts).toContain('Clear')
    })

    it('does not render footer when not clearable', () => {
        wrapper = mount(DatePickerPanel, {
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
            { label: 'Tomorrow', value: new Date(2026, 5, 27) },
        ]
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        const listbox = wrapper.find('[role="listbox"]')
        expect(listbox.exists()).toBe(true)
        const options = wrapper.findAll('[role="option"]')
        expect(options.length).toBe(2)
    })

    it('does not render shortcuts listbox when no shortcuts', () => {
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const listbox = wrapper.find('[role="listbox"]')
        expect(listbox.exists()).toBe(false)
    })

    it('emits update:modelValue when shortcut clicked', async () => {
        const today = new Date(2026, 5, 26)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: today },
        ]
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        const option = wrapper.find('[role="option"]')
        await option.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        const emitted = wrapper.emitted('update:modelValue')![0] as [Date | null]
        expect(emitted[0]).toBeInstanceOf(Date)
        expect((emitted[0] as Date).toDateString()).toBe(today.toDateString())
    })

    it('emits confirm with current modelValue when confirm clicked', async () => {
        const value = new Date(2026, 5, 26)
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            props: { modelValue: value, clearable: true },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const confirmBtn = buttons.find((b) => b.text().trim() === 'Confirm')
        await confirmBtn!.trigger('click')
        expect(wrapper.emitted('confirm')).toBeTruthy()
        expect(wrapper.emitted('confirm')![0]).toEqual([value])
    })

    it('emits clear and update:modelValue null when clear clicked', async () => {
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 26), clearable: true },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const clearBtn = buttons.find((b) => b.text().trim() === 'Clear')
        await clearBtn!.trigger('click')
        expect(wrapper.emitted('clear')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
    })

    it('marks shortcut as active when modelValue matches', () => {
        const today = new Date(2026, 5, 26)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: today },
        ]
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            props: { modelValue: today, shortcuts },
            attachTo: document.body,
        })
        const option = wrapper.find('[role="option"]')
        expect(option.attributes('aria-selected')).toBe('true')
    })

    it('does not mark shortcut as active when modelValue differs', () => {
        const today = new Date(2026, 5, 26)
        const other = new Date(2025, 0, 1)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: today },
        ]
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            props: { modelValue: other, shortcuts },
            attachTo: document.body,
        })
        const option = wrapper.find('[role="option"]')
        expect(option.attributes('aria-selected')).toBe('false')
    })

    it('supports function-based shortcut values', async () => {
        const today = new Date(2026, 5, 26)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'Today', value: () => today },
        ]
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        const option = wrapper.find('[role="option"]')
        await option.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        const emitted = wrapper.emitted('update:modelValue')![0] as [Date | null]
        expect((emitted[0] as Date).toDateString()).toBe(today.toDateString())
    })

    it('sets aria-modal true on dialog', () => {
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-modal')).toBe('true')
    })

    it('uses custom aria-label when provided', () => {
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            props: { ariaLabel: 'Select birthday' },
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Select birthday')
    })

    it('uses default placeholder aria-label when not provided', () => {
        wrapper = mount(DatePickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Pick a date')
    })
})

describe('DatePicker programmatic control (defineExpose)', () => {
    it('exposes open as a readable boolean', () => {
        const wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        expect(wrapper.vm.open).toBe(false)
        wrapper.unmount()
    })

    it('setting open to true programmatically opens the panel and emits open', async () => {
        const wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        ;(wrapper as any).vm.open = true
        await nextTick()
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
        wrapper.unmount()
    })

    it('setting open to false programmatically closes the panel and emits close', async () => {
        const wrapper = mount(DatePicker, { ...localeProvide, attachTo: document.body })
        ;(wrapper as any).vm.open = true
        await nextTick()
        await nextTick()
        ;(wrapper as any).vm.open = false
        await nextTick()
        await nextTick()
        expect(wrapper.emitted('close')).toBeTruthy()
        wrapper.unmount()
    })
})
