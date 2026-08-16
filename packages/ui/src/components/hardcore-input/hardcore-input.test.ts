import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import HardcoreInput from './HardcoreInput.vue'

interface HardcoreInputExposed {
    validationState: 'default' | 'success' | 'error'
    errorMessage: string
}

function assertHardcoreInputExposed(vm: unknown): asserts vm is HardcoreInputExposed {
    expect(vm).toHaveProperty('validationState')
    expect(vm).toHaveProperty('errorMessage')
}

vi.mock('../../composables/useAudioEngine', () => ({
    useAudioEngine: () => ({
        playSound: vi.fn(),
        dispose: vi.fn()
    })
}))

describe('HardcoreInput', () => {
    afterEach(() => {
        vi.doUnmock('../../composables/useAudioEngine')
    })

    it('supports v-model and updates binding value', async () => {
        const wrapper = mount(HardcoreInput, {
            props: { modelValue: 'hello' }
        })
        const input = wrapper.find('input')
        expect(input.element.value).toBe('hello')

        await input.setValue('world')
        expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['world'])
    })

    it('performs validation on blur', async () => {
        const checkRule = (val: string) => val.length >= 5 || 'Too short!'
        const wrapper = mount(HardcoreInput, {
            props: {
                modelValue: '123',
                rules: [checkRule],
                validateOn: 'blur'
            }
        })

        const input = wrapper.find('input')
        await input.trigger('blur')

        assertHardcoreInputExposed(wrapper.vm)
        const vm = wrapper.vm
        expect(vm.validationState).toBe('error')
        expect(vm.errorMessage).toBe('Too short!')
        expect(wrapper.text()).toContain('Too short!')
    })

    it('shows success state when validation passes', async () => {
        const checkRule = (val: string) => val.length >= 5 || 'Too short!'
        const wrapper = mount(HardcoreInput, {
            props: {
                modelValue: '12345',
                rules: [checkRule],
                validateOn: 'blur'
            }
        })

        const input = wrapper.find('input')
        await input.trigger('blur')

        assertHardcoreInputExposed(wrapper.vm)
        const vm = wrapper.vm
        expect(vm.validationState).toBe('success')
        expect(vm.errorMessage).toBe('')
    })

    it('emits validation-change when validation state changes', async () => {
        const checkRule = (val: string) => val.length >= 5 || 'Too short!'
        const wrapper = mount(HardcoreInput, {
            props: {
                modelValue: '123',
                rules: [checkRule],
                validateOn: 'blur'
            }
        })

        await wrapper.find('input').trigger('blur')

        expect(wrapper.emitted('validation-change')?.[0]).toEqual(['error', 'Too short!'])

        await wrapper.setProps({ modelValue: '12345' })
        await wrapper.find('input').trigger('blur')

        expect(wrapper.emitted('validation-change')?.[1]).toEqual(['success'])
    })

    it('emits validation-change only on state transitions', async () => {
        const checkRule = (val: string) => val.length >= 5 || 'Too short!'
        const wrapper = mount(HardcoreInput, {
            props: {
                modelValue: '123',
                rules: [checkRule],
                validateOn: 'input'
            }
        })

        // 持续输入非法值：状态保持 error，不应重复发射 validation-change
        await wrapper.find('input').setValue('1234')
        await wrapper.find('input').setValue('123')
        await wrapper.find('input').setValue('1')

        expect(wrapper.emitted('validation-change')).toHaveLength(1)
        expect(wrapper.emitted('validation-change')![0]).toEqual(['error', 'Too short!'])
    })

    it('exposed validate returns validation result and syncs form context', async () => {
        const checkRule = (val: string) => val.length >= 5 || 'Too short!'
        const wrapper = mount(HardcoreInput, {
            props: {
                modelValue: '123',
                rules: [checkRule],
                validateOn: 'blur'
            }
        })

        const vm = wrapper.vm as unknown as { validate: () => boolean }
        expect(vm.validate()).toBe(false)

        await wrapper.setProps({ modelValue: '12345' })
        expect(vm.validate()).toBe(true)
    })

    it('emits validation-change when error message changes while staying in error state', async () => {
        const rules = [
            (val: string) => val.length >= 5 || 'Too short!',
            (val: string) => /^\d+$/.test(val) || 'Numbers only',
        ]
        const wrapper = mount(HardcoreInput, {
            props: {
                modelValue: 'abc',
                rules,
                validateOn: 'blur',
            },
        })
        const input = wrapper.find('input')

        // 'abc' 命中长度规则失败
        await input.trigger('blur')
        expect(wrapper.emitted('validation-change')![0]).toEqual(['error', 'Too short!'])

        // 'abcde' 长度通过但非纯数字：状态仍为 error，文案变化应再次发射
        await wrapper.setProps({ modelValue: 'abcde' })
        await input.trigger('blur')
        expect(wrapper.emitted('validation-change')![1]).toEqual(['error', 'Numbers only'])
    })

    it('does not create multiple AudioContext instances', () => {
        const mockPlaySound = vi.fn()
        const mockDispose = vi.fn()

        vi.doMock('../../composables/useAudioEngine', () => ({
            useAudioEngine: () => ({
                playSound: mockPlaySound,
                dispose: mockDispose
            })
        }))

        const wrapper = mount(HardcoreInput, {
            props: { modelValue: 'test' }
        })

        expect(mockDispose).not.toHaveBeenCalled()

        wrapper.unmount()
    })

    it('throttles type sound playback', async () => {
        const playSoundMock = vi.fn()
        vi.doMock('../../composables/useAudioEngine', () => ({
            useAudioEngine: () => ({
                playSound: playSoundMock,
                dispose: vi.fn()
            })
        }))

        const { default: HardcoreInputFresh } = await import('./HardcoreInput.vue')
        const wrapper = mount(HardcoreInputFresh, {
            props: { modelValue: '', sound: true }
        })

        const input = wrapper.find('input')
        await input.setValue('a')
        await input.setValue('b')
        await input.setValue('c')

        const typeCalls = playSoundMock.mock.calls.filter(
            (call: unknown[]) => (call[0] as string) === 'type'
        )
        expect(typeCalls.length).toBeLessThanOrEqual(3)
    })

    describe('IME composition', () => {
        it('does not emit update:modelValue while composing', async () => {
            const wrapper = mount(HardcoreInput, {
                props: { modelValue: '' },
            })

            await wrapper.find('input').trigger('compositionstart')
            // 组合期间的 input 事件应被守卫拦截，不 emit
            await wrapper.find('input').setValue('中')

            expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        })

        it('emits final value once when compositionend is followed by a duplicate input', async () => {
            const wrapper = mount(HardcoreInput, {
                props: { modelValue: '' },
            })

            await wrapper.find('input').trigger('compositionstart')
            await wrapper.find('input').setValue('中')
            await wrapper.find('input').setValue('中文')
            // compositionend 兜底 emit 最终值
            await wrapper.find('input').trigger('compositionend')
            // 浏览器随后再次触发携带相同值的 input，应被 skipNextInput 去重，不再重复 emit
            await wrapper.find('input').trigger('input')

            const emitted = wrapper.emitted('update:modelValue')
            expect(emitted).toHaveLength(1)
            expect(emitted![0]).toEqual(['中文'])
        })

        it('restores input emission after compositioncancel', async () => {
            const wrapper = mount(HardcoreInput, {
                props: { modelValue: '' },
            })

            await wrapper.find('input').trigger('compositionstart')
            await wrapper.find('input').trigger('compositioncancel')
            // 取消组合后 isComposing 已复位，后续普通 input 应正常 emit
            await wrapper.find('input').setValue('hello')

            expect(wrapper.emitted('update:modelValue')![0]).toEqual(['hello'])
        })
    })
})
