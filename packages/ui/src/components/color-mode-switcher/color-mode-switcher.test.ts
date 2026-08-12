import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ColorModeSwitcher from './ColorModeSwitcher.vue'
import type { ColorMode } from '@/composables/useTheme'

// Mock useTheme composable
const mockColorMode = ref<ColorMode>('light')
const mockResolvedColorMode = ref<'light' | 'dark'>('light')
const mockApplyColorMode = vi.fn()

vi.mock('../../composables/useTheme', () => ({
    useTheme: () => ({
        colorMode: mockColorMode,
        resolvedColorMode: mockResolvedColorMode,
        applyColorMode: mockApplyColorMode,
    }),
}))

// Stub reka-ui Select components
const primitiveStub = {
    template: '<div><slot /></div>',
}

// SelectRoot 暴露 model-value 供断言下拉展示值
const selectStubs = {
    SelectRoot: {
        name: 'SelectRoot',
        props: ['modelValue'],
        template: '<div data-test="select-root" :data-model-value="String(modelValue)"><slot /></div>',
    },
    SelectValue: primitiveStub,
    SelectTrigger: primitiveStub,
    SelectContent: primitiveStub,
    SelectItem: primitiveStub,
}

describe('ColorModeSwitcher', () => {
    beforeEach(() => {
        mockColorMode.value = 'light'
        mockResolvedColorMode.value = 'light'
        mockApplyColorMode.mockClear()
    })

    it('renders in icon display mode by default', () => {
        const wrapper = mount(ColorModeSwitcher, {
            global: { stubs: selectStubs },
        })
        // Should render a button with icon
        expect(wrapper.find('button').exists()).toBe(true)
    })

    it('renders in button display mode', () => {
        const wrapper = mount(ColorModeSwitcher, {
            props: { display: 'button' },
            global: { stubs: selectStubs },
        })
        expect(wrapper.find('button').exists()).toBe(true)
        expect(wrapper.text()).toContain('浅色')
    })

    it('renders in select display mode', () => {
        const wrapper = mount(ColorModeSwitcher, {
            props: { display: 'select' },
            global: { stubs: selectStubs },
        })
        // Select mode renders select trigger
        expect(wrapper.exists()).toBe(true)
    })

    it('calls applyColorMode on icon click', async () => {
        const wrapper = mount(ColorModeSwitcher, {
            props: { display: 'icon' },
            global: { stubs: selectStubs },
        })
        await wrapper.find('button').trigger('click')
        expect(mockApplyColorMode).toHaveBeenCalled()
    })

    it('cycles through modes excluding system when showSystem=false', async () => {
        mockColorMode.value = 'light'
        const wrapper = mount(ColorModeSwitcher, {
            props: { display: 'icon', showSystem: false },
            global: { stubs: selectStubs },
        })
        await wrapper.find('button').trigger('click')
        // With showSystem=false, only light/dark cycle
        expect(mockApplyColorMode).toHaveBeenCalledWith('dark')
    })

    it('keeps current mode when showSystem=false and colorMode is system', async () => {
        mockColorMode.value = 'system'
        const wrapper = mount(ColorModeSwitcher, {
            props: { display: 'icon', showSystem: false },
            global: { stubs: selectStubs },
        })
        await wrapper.find('button').trigger('click')
        // 当前模式不在可选列表（system 被隐藏），保持现状，不得跳转
        expect(mockApplyColorMode).not.toHaveBeenCalled()
    })

    it('normalizes select model-value when colorMode is system but system is hidden', () => {
        mockColorMode.value = 'system'
        const wrapper = mount(ColorModeSwitcher, {
            props: { display: 'select', showSystem: false },
            global: { stubs: selectStubs },
        })
        const root = wrapper.find('[data-test="select-root"]')
        expect(root.attributes('data-model-value')).toBe('light')
    })

    it('shows resolved dark theme when colorMode is system but system is hidden', () => {
        mockColorMode.value = 'system'
        mockResolvedColorMode.value = 'dark'
        const wrapper = mount(ColorModeSwitcher, {
            props: { display: 'select', showSystem: false },
            global: { stubs: selectStubs },
        })
        const root = wrapper.find('[data-test="select-root"]')
        // 边界状态回退展示为实际亮暗（暗色），避免"页面为暗色而下拉框显示浅色"的感知偏差
        expect(root.attributes('data-model-value')).toBe('dark')
    })

    it('rejects programmatic system value when system is hidden', async () => {
        const wrapper = mount(ColorModeSwitcher, {
            props: { display: 'select', showSystem: false },
            global: { stubs: selectStubs },
        })
        const selectRoot = wrapper.findComponent({ name: 'SelectRoot' })
        selectRoot.vm.$emit('update:modelValue', 'system')
        expect(mockApplyColorMode).not.toHaveBeenCalled()
        selectRoot.vm.$emit('update:modelValue', 'dark')
        expect(mockApplyColorMode).toHaveBeenCalledWith('dark')
    })
})
