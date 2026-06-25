import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ColorPicker from './ColorPicker.vue'
import ColorPickerSwatch from './ColorPickerSwatch.vue'
import ColorPickerInput from './ColorPickerInput.vue'
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
    localStorage.clear()
})

async function openPanel(w: ReturnType<typeof mount>) {
    const trigger = w.find('[role="combobox"]')
    await trigger.trigger('click')
    await nextTick()
    await nextTick()
}

describe('ColorPicker', () => {
    it('renders trigger with combobox role', () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.exists()).toBe(true)
    })

    it('applies custom class', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { class: 'custom-color-picker' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('custom-color-picker')
    })

    it('shows default placeholder text', () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Pick a color')
    })

    it('shows custom placeholder text', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { placeholder: 'Choose hue...' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Choose hue...')
    })

    it('shows normalized hex value when modelValue set', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { modelValue: '#FF6B6B' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('#ff6b6b')
    })

    it('applies muted foreground class when no value', () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('text-brutal-muted-foreground')
    })

    it('does not apply muted foreground class when value set', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).not.toContain('text-brutal-muted-foreground')
    })

    it('has aria-expanded attribute', () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-expanded')).toBeDefined()
    })

    it('has aria-haspopup dialog', () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    })

    it('is disabled when disabled prop is true', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('disabled')).toBeDefined()
    })

    it('applies size sm classes', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { size: 'sm' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-9')
    })

    it('applies size lg classes', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { size: 'lg' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('h-14')
    })

    it('shows clear button when clearable and value set', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { modelValue: '#ff0000', clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(true)
    })

    it('does not show clear button when no value', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('emits update:modelValue null when clear clicked', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { modelValue: '#ff0000', clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        await clearBtn.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
    })

    it('emits change null when clear clicked', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { modelValue: '#ff0000', clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('button[aria-label="Clear"]')
        await clearBtn.trigger('click')
        expect(wrapper.emitted('change')).toBeTruthy()
        expect(wrapper.emitted('change')![0]).toEqual([null])
    })

    it('opens panel on trigger click', async () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
    })

    it('emits open event when panel opens', async () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('renders SV pad slider in panel', async () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const svSlider = document.body.querySelector('[aria-label="Saturation"]')
        expect(svSlider).not.toBeNull()
    })

    it('renders hue slider in panel', async () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const hueSlider = document.body.querySelector('[aria-label="Hue"]')
        expect(hueSlider).not.toBeNull()
    })

    it('does not render alpha slider when showAlpha false', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { showAlpha: false },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const alphaSlider = document.body.querySelector('[aria-label="Alpha"]')
        expect(alphaSlider).toBeNull()
    })

    it('renders alpha slider when showAlpha true', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { showAlpha: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const alphaSlider = document.body.querySelector('[aria-label="Alpha"]')
        expect(alphaSlider).not.toBeNull()
    })

    it('renders default presets in panel', async () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const listbox = document.body.querySelector('[role="listbox"]')
        expect(listbox).not.toBeNull()
        const options = document.body.querySelectorAll('[role="option"]')
        expect(options.length).toBeGreaterThan(0)
    })

    it('renders custom presets when provided', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { presets: ['#ff0000', '#00ff00', '#0000ff'] },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const options = document.body.querySelectorAll('[role="option"]')
        expect(options.length).toBe(3)
    })

    it('does not render presets when showPresets false', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { showPresets: false },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const listbox = document.body.querySelector('[role="listbox"]')
        expect(listbox).toBeNull()
    })

    it('emits update:modelValue when preset selected', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { presets: ['#ff0000', '#00ff00'] },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const options = document.body.querySelectorAll('[role="option"]')
        const firstOption = options[0] as HTMLElement
        firstOption.click()
        await nextTick()
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('does not render history when showHistory false', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { showHistory: false },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const historyGroup = document.body.querySelector('[role="group"]')
        expect(historyGroup).toBeNull()
    })

    it('renders confirm and clear buttons in panel', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const buttons = document.body.querySelectorAll('[role="dialog"] button')
        const texts = Array.from(buttons).map((b) => b.textContent?.trim())
        expect(texts).toContain('Confirm')
        expect(texts).toContain('Clear')
    })

    it('opens panel on Enter key', async () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: 'Enter' })
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
    })
})

describe('ColorPickerSwatch', () => {
    it('renders with background color', () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: '#ff0000' },
            attachTo: document.body,
        })
        const swatch = wrapper.find('[role="option"]')
        expect(swatch.exists()).toBe(true)
        expect(swatch.attributes('style')).toContain('background-color')
    })

    it('emits select with value on click', async () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: '#ff0000' },
            attachTo: document.body,
        })
        await wrapper.find('[role="option"]').trigger('click')
        expect(wrapper.emitted('select')).toBeTruthy()
        expect(wrapper.emitted('select')![0]).toEqual(['#ff0000'])
    })

    it('does not emit select when disabled', async () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: '#ff0000', disabled: true },
            attachTo: document.body,
        })
        await wrapper.find('[role="option"]').trigger('click')
        expect(wrapper.emitted('select')).toBeFalsy()
    })

    it('applies selected ring class when selected', () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: '#ff0000', selected: true },
            attachTo: document.body,
        })
        const swatch = wrapper.find('[role="option"]')
        expect(swatch.classes()).toContain('ring-2')
    })

    it('sets aria-selected attribute', () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: '#ff0000', selected: true },
            attachTo: document.body,
        })
        const swatch = wrapper.find('[role="option"]')
        expect(swatch.attributes('aria-selected')).toBe('true')
    })
})

describe('ColorPickerInput', () => {
    it('renders input element', () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        expect(input.exists()).toBe(true)
    })

    it('shows normalized hex value', () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#FF0000' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        expect((input.element as HTMLInputElement).value).toBe('#ff0000')
    })

    it('emits update:modelValue on valid input', async () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        await input.setValue('#00ff00')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        expect(emitted![0]).toEqual(['#00ff00'])
    })

    it('does not emit update:modelValue on invalid input', async () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        await input.setValue('not-a-color')
        expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('marks invalid when input is not a valid color', async () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        await input.setValue('zzz')
        expect(input.attributes('aria-invalid')).toBe('true')
    })

    it('emits confirm null when cleared and blurred', async () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        await input.setValue('')
        await input.trigger('blur')
        const emitted = wrapper.emitted('confirm')
        expect(emitted).toBeTruthy()
        expect(emitted![0]).toEqual([null])
    })
})
