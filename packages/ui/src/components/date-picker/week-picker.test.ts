import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import WeekPicker from './WeekPicker.vue'
import WeekPickerPanel from './WeekPickerPanel.vue'
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

describe('WeekPicker', () => {
    it('renders trigger with combobox role', () => {
        wrapper = mount(WeekPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.exists()).toBe(true)
    })

    it('applies custom class', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { class: 'custom-week-picker' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('custom-week-picker')
    })

    it('shows default placeholder text', () => {
        wrapper = mount(WeekPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Select week')
    })

    it('shows custom placeholder text', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { placeholder: 'Choose week...' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Choose week...')
    })

    it('shows formatted week when modelValue set', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 26) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toMatch(/2026-2\d/)
    })

    it('respects custom displayFormat', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 26),
                displayFormat: 'YYYY/MM/DD',
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toMatch(/2026\/06\/\d{2}/)
    })

    it('applies muted foreground class when no value', () => {
        wrapper = mount(WeekPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('text-brutal-muted-foreground')
    })

    it('does not apply muted foreground class when value set', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 26) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).not.toContain('text-brutal-muted-foreground')
    })

    it('has aria-expanded attribute', () => {
        wrapper = mount(WeekPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-expanded')).toBeDefined()
    })

    it('has aria-haspopup dialog', () => {
        wrapper = mount(WeekPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    })

    it('is disabled when disabled prop is true', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('disabled')).toBeDefined()
    })

    it('applies size sm classes', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { size: 'sm' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-9')
    })

    it('applies size lg classes', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { size: 'lg' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-14')
    })

    it('applies default size classes', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { size: 'default' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-11')
    })

    it('applies error variant border class', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { variant: 'error' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-destructive')
    })

    it('applies success variant border class', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { variant: 'success' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('border-brutal-success')
    })

    it('shows clear button when clearable and value set', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 26),
                clearable: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(true)
    })

    it('does not show clear button when no value', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when not clearable', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 5, 26) },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when disabled', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 26),
                clearable: true,
                disabled: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('does not show clear button when readonly', () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 26),
                clearable: true,
                readonly: true,
            },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('emits update:modelValue null when clear clicked', async () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 26),
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
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 26),
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
        wrapper = mount(WeekPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
    })

    it('emits open event when panel opens', async () => {
        wrapper = mount(WeekPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('emits close event when panel closes', async () => {
        wrapper = mount(WeekPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('click')
        await nextTick()
        expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('opens panel on Enter key', async () => {
        wrapper = mount(WeekPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: 'Enter' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('opens panel on Space key', async () => {
        wrapper = mount(WeekPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: ' ' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('does not open on Enter when disabled', async () => {
        wrapper = mount(WeekPicker, {
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
        wrapper = mount(WeekPicker, {
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
        wrapper = mount(WeekPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        const svg = trigger.find('svg')
        expect(svg.exists()).toBe(true)
    })

    it('renders confirm button in panel when clearable', async () => {
        wrapper = mount(WeekPicker, {
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
        wrapper = mount(WeekPicker, {
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
        wrapper = mount(WeekPicker, {
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
            { label: 'This week', value: today },
        ]
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const listbox = document.body.querySelector('[role="listbox"]')
        expect(listbox).not.toBeNull()
        const options = document.body.querySelectorAll('[role="option"]')
        expect(options.length).toBeGreaterThan(0)
        expect(options[0].textContent?.trim()).toBe('This week')
    })

    it('syncs displayValue when modelValue changes', async () => {
        wrapper = mount(WeekPicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5) },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toMatch(/2026/)
        await wrapper.setProps({ modelValue: new Date(2026, 5, 26) })
        expect(trigger.text()).toMatch(/2026-2\d/)
    })

    it('passes minDate and maxDate to panel', async () => {
        wrapper = mount(WeekPicker, {
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

describe('WeekPickerPanel', () => {
    it('renders dialog with aria-modal', () => {
        wrapper = mount(WeekPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.exists()).toBe(true)
        expect(dialog.attributes('aria-modal')).toBe('true')
    })

    it('uses custom aria-label when provided', () => {
        wrapper = mount(WeekPickerPanel, {
            ...localeProvide,
            props: { ariaLabel: 'Custom week' },
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Custom week')
    })

    it('uses default aria-label when not provided', () => {
        wrapper = mount(WeekPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const dialog = wrapper.find('[role="dialog"]')
        expect(dialog.attributes('aria-label')).toBe('Select week')
    })

    it('renders confirm button when clearable', () => {
        wrapper = mount(WeekPickerPanel, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const texts = buttons.map((b) => b.text().trim())
        expect(texts).toContain('Confirm')
    })

    it('renders clear button when clearable', () => {
        wrapper = mount(WeekPickerPanel, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        const texts = buttons.map((b) => b.text().trim())
        expect(texts).toContain('Clear')
    })

    it('does not render footer when not clearable', () => {
        wrapper = mount(WeekPickerPanel, {
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
            { label: 'This week', value: new Date(2026, 5, 26) },
        ]
        wrapper = mount(WeekPickerPanel, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        const listbox = wrapper.find('[role="listbox"]')
        expect(listbox.exists()).toBe(true)
        const options = wrapper.findAll('[role="option"]')
        expect(options).toHaveLength(1)
        expect(options[0].text()).toBe('This week')
    })

    it('does not render shortcuts listbox when no shortcuts', () => {
        wrapper = mount(WeekPickerPanel, {
            ...localeProvide,
            attachTo: document.body,
        })
        const listbox = wrapper.find('[role="listbox"]')
        expect(listbox.exists()).toBe(false)
    })

    it('emits update:modelValue when shortcut clicked', async () => {
        const today = new Date(2026, 5, 26)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'This week', value: today },
        ]
        wrapper = mount(WeekPickerPanel, {
            ...localeProvide,
            props: { shortcuts },
            attachTo: document.body,
        })
        const option = wrapper.find('[role="option"]')
        await option.trigger('click')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const value = emitted![0][0] as Date
        expect(value.getDay()).toBe(1)
    })

    it('marks active shortcut with aria-selected', () => {
        const today = new Date(2026, 5, 26)
        const shortcuts: DatePickerShortcut[] = [
            { label: 'This week', value: today },
        ]
        wrapper = mount(WeekPickerPanel, {
            ...localeProvide,
            props: {
                modelValue: today,
                shortcuts,
                weekStartsOn: 1,
            },
            attachTo: document.body,
        })
        const option = wrapper.find('[role="option"]')
        expect(option.attributes('aria-selected')).toBe('true')
    })

    it('emits confirm event with modelValue', async () => {
        const value = new Date(2026, 5, 26)
        wrapper = mount(WeekPickerPanel, {
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
        wrapper = mount(WeekPickerPanel, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 5, 26),
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
})
