import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ColorPicker from './ColorPicker.vue'
import ColorPickerSwatch from './ColorPickerSwatch.vue'
import ColorPickerInput from './ColorPickerInput.vue'
import ColorPickerPanel from './ColorPickerPanel.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { normalizePresets } from './types'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
    if (wrapper) {
        wrapper.unmount()
        wrapper = null
    }
    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.clear === 'function') {
        localStorage.clear()
    }
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

    it('shows rgb format in trigger when format is rgb', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { modelValue: '#ff0000', format: 'rgb' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('rgb(255, 0, 0)')
        expect(trigger.text()).not.toContain('#ff0000')
    })

    it('shows hsl format in trigger when format is hsl', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { modelValue: '#ff0000', format: 'hsl' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('hsl(0, 100%, 50%)')
        expect(trigger.text()).not.toContain('#ff0000')
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
        const clearBtn = wrapper.find('[role="button"][aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(true)
    })

    it('does not show clear button when no value', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('[role="button"][aria-label="Clear"]')
        expect(clearBtn.exists()).toBe(false)
    })

    it('emits update:modelValue null when clear clicked', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { modelValue: '#ff0000', clearable: true },
            attachTo: document.body,
        })
        const clearBtn = wrapper.find('[role="button"][aria-label="Clear"]')
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
        const clearBtn = wrapper.find('[role="button"][aria-label="Clear"]')
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
        const presetsGroup = document.body.querySelector('[role="group"][aria-label="Presets"]')
        expect(presetsGroup).not.toBeNull()
        const swatches = presetsGroup!.querySelectorAll('button[aria-pressed]')
        expect(swatches.length).toBeGreaterThan(0)
    })

    it('renders custom presets when provided', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { presets: ['#ff0000', '#00ff00', '#0000ff'] },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const presetsGroup = document.body.querySelector('[role="group"][aria-label="Presets"]')
        expect(presetsGroup!.querySelectorAll('button[aria-pressed]').length).toBe(3)
    })

    it('does not render presets when showPresets false', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { showPresets: false },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const presetsGroup = document.body.querySelector('[role="group"][aria-label="Presets"]')
        expect(presetsGroup).toBeNull()
    })

    it('emits update:modelValue when preset selected', async () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { presets: ['#ff0000', '#00ff00'] },
            attachTo: document.body,
        })
        await openPanel(wrapper)
        const presetsGroup = document.body.querySelector('[role="group"][aria-label="Presets"]')
        const firstSwatch = presetsGroup!.querySelector('button[aria-pressed]') as HTMLElement
        firstSwatch.click()
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
        // 历史区用 aria-labelledby，预设区用 aria-label，据此区分
        const historyGroup = document.body.querySelector('[role="group"][aria-labelledby]')
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

    it('renders a hidden input for form submission when name is set', () => {
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { name: 'color', modelValue: '#ff0000' },
            attachTo: document.body,
        })
        const hidden = wrapper.find('input[type="hidden"]')
        expect(hidden.exists()).toBe(true)
        expect(hidden.attributes('name')).toBe('color')
        expect(hidden.attributes('value')).toBe('#ff0000')
    })

    it('does not render a hidden input without name', () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        expect(wrapper.find('input[type="hidden"]').exists()).toBe(false)
    })

    it('sets disabled on the hidden input when disabled', () => {
        // 原生语义：disabled 表单控件不随表单提交，隐藏 input 应继承 disabled 状态
        wrapper = mount(ColorPicker, {
            ...localeProvide,
            props: { name: 'color', modelValue: '#ff0000', disabled: true },
            attachTo: document.body,
        })
        const hidden = wrapper.find('input[type="hidden"]')
        expect(hidden.attributes('disabled')).toBeDefined()
    })

    it('points aria-controls to the rendered content id', async () => {
        wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        await openPanel(wrapper)
        const trigger = document.body.querySelector('[role="combobox"]')
        const controls = trigger!.getAttribute('aria-controls')
        expect(controls).toBeTruthy()
        // aria-controls 引用的元素真实存在（reka 内部将同一 contentId 落到内容元素）
        expect(document.body.querySelector(`#${controls}`)).not.toBeNull()
    })

    it('normalizes mixed presets per element', () => {
        // 运行时混合数组来自未类型化的 JS 消费方；as any 模拟该输入
        const mixed = ['#ff0000', { label: 'Green', value: '#00ff00' }] as any
        expect(normalizePresets(mixed)).toEqual([
            { label: '#ff0000', value: '#ff0000' },
            { label: 'Green', value: '#00ff00' },
        ])
    })
})

describe('ColorPickerSwatch', () => {
    it('renders with background color', () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: '#ff0000' },
            attachTo: document.body,
        })
        const swatch = wrapper.find('button[aria-pressed]')
        expect(swatch.exists()).toBe(true)
        expect(swatch.attributes('style')).toContain('background-color')
    })

    it('emits select with value on click', async () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: '#ff0000' },
            attachTo: document.body,
        })
        await wrapper.find('button[aria-pressed]').trigger('click')
        expect(wrapper.emitted('select')).toBeTruthy()
        expect(wrapper.emitted('select')![0]).toEqual(['#ff0000'])
    })

    it('does not emit select when disabled', async () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: '#ff0000', disabled: true },
            attachTo: document.body,
        })
        await wrapper.find('button[aria-pressed]').trigger('click')
        expect(wrapper.emitted('select')).toBeFalsy()
    })

    it('applies selected ring class when selected', () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: '#ff0000', selected: true },
            attachTo: document.body,
        })
        const swatch = wrapper.find('button[aria-pressed]')
        expect(swatch.classes()).toContain('ring-brutal-ring')
    })

    it('sets aria-pressed attribute', () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: '#ff0000', selected: true },
            attachTo: document.body,
        })
        const swatch = wrapper.find('button[aria-pressed]')
        expect(swatch.attributes('aria-pressed')).toBe('true')
    })

    it('renders transparent and does not emit select for invalid value', async () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: 'not-a-color' },
            attachTo: document.body,
        })
        const swatch = wrapper.find('button[aria-pressed]')
        expect(swatch.attributes('style')).toContain('transparent')
        await swatch.trigger('click')
        expect(wrapper.emitted('select')).toBeFalsy()
    })

    it('marks invalid color swatch as disabled', () => {
        // 非法色值是不可交互数据：置为 disabled，避免「看似可点击实则无效」的可聚焦元素
        wrapper = mount(ColorPickerSwatch, {
            props: { value: 'not-a-color' },
            attachTo: document.body,
        })
        const swatch = wrapper.find('button[aria-pressed]')
        expect(swatch.attributes('disabled')).toBeDefined()
    })

    it('has focus-visible ring class', () => {
        wrapper = mount(ColorPickerSwatch, {
            props: { value: '#ff0000' },
            attachTo: document.body,
        })
        const swatch = wrapper.find('button[aria-pressed]')
        expect(swatch.classes()).toContain('focus-visible:ring-2')
        expect(swatch.classes()).toContain('focus-visible:ring-brutal-ring')
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

    it('displays RGB format when format is rgb', () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000', format: 'rgb' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        expect((input.element as HTMLInputElement).value).toBe('rgb(255, 0, 0)')
    })

    it('displays HSL format when format is hsl', () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000', format: 'hsl' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        expect((input.element as HTMLInputElement).value).toBe('hsl(0, 100%, 50%)')
    })

    it('emits update:modelValue in RGB format when format is rgb', async () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000', format: 'rgb' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        await input.setValue('#00ff00')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        expect(emitted![0]).toEqual(['rgb(0, 255, 0)'])
    })

    it('emits update:modelValue in HSL format when format is hsl', async () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000', format: 'hsl' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        await input.setValue('#00ff00')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        expect(emitted![0]).toEqual(['hsl(120, 100%, 50%)'])
    })

    it('emits update:modelValue null when input is cleared', async () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        await input.setValue('')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        expect(emitted![0]).toEqual([null])
    })

    it('confirms once when Enter is pressed then blurred', async () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        await input.setValue('#00ff00')
        await input.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('confirm')?.length).toBe(1)
        // Enter 已确认，随后的原生 blur 不再重复 confirm
        await input.trigger('blur')
        expect(wrapper.emitted('confirm')?.length).toBe(1)
    })

    it('keeps the user-typed text when the parent echoes the same normalized value', async () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        await input.setValue('#FF0000')
        // 父级回写归一化后的同值，不得把输入框覆盖回小写（避免光标跳动）
        await wrapper.setProps({ modelValue: '#ff0000' })
        expect((input.element as HTMLInputElement).value).toBe('#FF0000')
    })

    it('re-syncs when an externally written value equals a previously emitted value', async () => {
        wrapper = mount(ColorPickerInput, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        // 用户输入有效色并 emit，父级未回写（lastEmitted 残留）
        await input.setValue('#00ff00')
        // 外部先写其他值：走同步分支
        await wrapper.setProps({ modelValue: '#0000ff' })
        expect((input.element as HTMLInputElement).value).toBe('#0000ff')
        // 外部再写回等于先前 emit 的旧值：应同步，而非被误判为「自回写」跳过
        await wrapper.setProps({ modelValue: '#00ff00' })
        expect((input.element as HTMLInputElement).value).toBe('#00ff00')
    })
})

describe('ColorPickerPanel pointer interaction', () => {
    it('emits update:modelValue when sv pad is clicked', async () => {
        wrapper = mount(ColorPickerPanel, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        await nextTick()

        const svSlider = wrapper.find('[aria-label="Saturation"]')
        expect(svSlider.exists()).toBe(true)

        await svSlider.trigger('pointerdown', {
            pointerId: 1,
            pointerType: 'mouse',
            clientX: 0,
            clientY: 0,
        })
        await nextTick()

        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
    })

    it('emits update:modelValue when hue slider is clicked', async () => {
        wrapper = mount(ColorPickerPanel, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        await nextTick()

        const hueSlider = wrapper.find('[aria-label="Hue"]')
        expect(hueSlider.exists()).toBe(true)

        await hueSlider.trigger('pointerdown', {
            pointerId: 2,
            pointerType: 'mouse',
            clientX: 50,
            clientY: 0,
        })
        await nextTick()

        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
    })

    it('emits update:modelValue when alpha slider is clicked', async () => {
        wrapper = mount(ColorPickerPanel, {
            ...localeProvide,
            props: { modelValue: '#ff0000', showAlpha: true },
            attachTo: document.body,
        })
        await nextTick()

        const alphaSlider = wrapper.find('[aria-label="Alpha"]')
        expect(alphaSlider.exists()).toBe(true)

        await alphaSlider.trigger('pointerdown', {
            pointerId: 3,
            pointerType: 'mouse',
            clientX: 50,
            clientY: 0,
        })
        await nextTick()

        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
    })

    it('stops dragging after pointercancel', async () => {
        wrapper = mount(ColorPickerPanel, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        await nextTick()

        const svSlider = wrapper.find('[aria-label="Saturation"]')
        await svSlider.trigger('pointerdown', {
            pointerId: 1,
            pointerType: 'mouse',
            clientX: 0,
            clientY: 0,
        })
        const countAfterDown = wrapper.emitted('update:modelValue')?.length ?? 0
        // 指针被系统取消后，悬停移动不再驱动滑块
        await svSlider.trigger('pointercancel', { pointerId: 1 })
        await svSlider.trigger('pointermove', {
            pointerId: 1,
            pointerType: 'mouse',
            clientX: 50,
            clientY: 0,
        })
        expect(wrapper.emitted('update:modelValue')?.length ?? 0).toBe(countAfterDown)
    })

    it('keeps the correct drag session per pointerId under multi-touch', async () => {
        wrapper = mount(ColorPickerPanel, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        await nextTick()

        const svSlider = wrapper.find('[aria-label="Saturation"]')
        const hueSlider = wrapper.find('[aria-label="Hue"]')
        await svSlider.trigger('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 0, clientY: 0 })
        await hueSlider.trigger('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 50, clientY: 0 })
        const count = wrapper.emitted('update:modelValue')?.length ?? 0
        // 释放 sv 会话（id1），hue（id2）仍在拖拽，其 move 继续生效
        await svSlider.trigger('pointerup', { pointerId: 1 })
        await hueSlider.trigger('pointermove', { pointerId: 2, pointerType: 'touch', clientX: 60, clientY: 0 })
        expect(wrapper.emitted('update:modelValue')?.length ?? 0).toBeGreaterThan(count)
    })

    it('confirms only when the last active drag session ends under multi-touch', async () => {
        wrapper = mount(ColorPickerPanel, {
            ...localeProvide,
            props: { modelValue: '#ff0000' },
            attachTo: document.body,
        })
        await nextTick()

        const svSlider = wrapper.find('[aria-label="Saturation"]')
        const hueSlider = wrapper.find('[aria-label="Hue"]')
        await svSlider.trigger('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 0, clientY: 0 })
        await hueSlider.trigger('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 50, clientY: 0 })

        // 释放第一个会话（sv）：hue 仍在拖拽，手势未结束，不应提前 confirm 中间态颜色
        await svSlider.trigger('pointerup', { pointerId: 1 })
        expect(wrapper.emitted('confirm')).toBeUndefined()

        // 释放最后一个会话（hue）：整个手势结束，才确认一次
        await hueSlider.trigger('pointerup', { pointerId: 2 })
        expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('re-syncs hsv when an externally written value equals a previously emitted value', async () => {
        wrapper = mount(ColorPickerPanel, {
            ...localeProvide,
            props: { modelValue: '#ff0000', presets: ['#00ff00'], showHistory: false },
            attachTo: document.body,
        })
        await nextTick()
        // 选择预设触发 emit（父级不回声，lastEmittedPanel 残留为 #00ff00）
        await wrapper.find('button[title="#00ff00"]').trigger('click')
        await nextTick()
        // 外部先写其他值：走同步分支并清空残留标记
        await wrapper.setProps({ modelValue: '#0000ff' })
        await nextTick()
        await nextTick()
        // 外部再写回等于先前 emit 的值：应同步 hsv，输入框显示该色而非残留旧态
        await wrapper.setProps({ modelValue: '#00ff00' })
        await nextTick()
        await nextTick()
        const input = wrapper.find('input')
        expect((input.element as HTMLInputElement).value).toBe('#00ff00')
    })
})

describe('ColorPicker programmatic control (defineExpose)', () => {
    it('exposes open as a readable boolean', () => {
        const wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        expect(wrapper.vm.open).toBe(false)
        wrapper.unmount()
    })

    it('setting open to true programmatically opens the panel and emits open', async () => {
        const wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
        ;(wrapper as any).vm.open = true
        await nextTick()
        await nextTick()
        expect(wrapper.emitted('open')).toBeTruthy()
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
        wrapper.unmount()
    })

    it('setting open to false programmatically closes the panel and emits close', async () => {
        const wrapper = mount(ColorPicker, { ...localeProvide, attachTo: document.body })
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
