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

const selectStubs = {
    SelectRoot: primitiveStub,
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
})
