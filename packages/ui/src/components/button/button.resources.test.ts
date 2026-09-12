import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Button from './Button.vue'

interface MockMediaQuery extends MediaQueryList {
    trigger: (matches: boolean) => void
}

function createMockMediaQuery(matches: boolean): MockMediaQuery {
    const listeners = new Set<(event: MediaQueryListEvent) => void>()
    let currentMatches = matches
    return {
        get matches() {
            return currentMatches
        },
        addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
            listeners.add(listener)
        }),
        removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
            listeners.delete(listener)
        }),
        trigger(nextMatches: boolean) {
            currentMatches = nextMatches
            const event = { matches: nextMatches } as MediaQueryListEvent
            for (const listener of listeners) listener(event)
        },
    } as unknown as MockMediaQuery
}

describe('Button effect resources', () => {
    let originalMatchMedia: typeof window.matchMedia

    beforeEach(() => {
        vi.useFakeTimers()
        originalMatchMedia = window.matchMedia
    })

    afterEach(() => {
        window.matchMedia = originalMatchMedia
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('releases all effect resources when switching effect off', async () => {
        const query = createMockMediaQuery(false)
        window.matchMedia = vi.fn(() => query) as unknown as typeof window.matchMedia
        const intervalSpy = vi.spyOn(globalThis, 'setInterval')
        const timerCountBeforeMount = vi.getTimerCount()
        const wrapper = mount(Button, {
            props: { effect: 'none', glitchTrigger: 'autoplay', glitchInterval: 50 },
            slots: { default: 'Toggleable' },
        })

        expect(window.matchMedia).not.toHaveBeenCalled()
        expect(intervalSpy).not.toHaveBeenCalled()
        const timerCountAfterMount = vi.getTimerCount()
        expect(timerCountAfterMount).toBeGreaterThanOrEqual(timerCountBeforeMount)
        expect(wrapper.attributes('data-text')).toBeUndefined()

        await wrapper.setProps({ effect: 'glitch' })
        expect(window.matchMedia).toHaveBeenCalledTimes(1)
        expect(query.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
        expect(vi.getTimerCount()).toBe(timerCountAfterMount + 1)
        expect(wrapper.attributes('data-text')).toBe('Toggleable')

        ;(wrapper.vm as { play: () => void }).play()
        await nextTick()
        expect(wrapper.classes()).toContain('is-glitching')

        await wrapper.setProps({ effect: 'none' })
        expect(vi.getTimerCount()).toBe(timerCountAfterMount)
        expect(query.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
        expect(wrapper.classes()).not.toContain('is-glitching')
        expect(wrapper.attributes('data-text')).toBeUndefined()

        ;(wrapper.vm as { play: () => void }).play()
        await nextTick()
        expect(wrapper.classes()).not.toContain('is-glitching')

        wrapper.unmount()
        expect(vi.getTimerCount()).toBe(timerCountAfterMount)
    })

    it('stops and resumes autoplay around loading and disabled states', async () => {
        const query = createMockMediaQuery(false)
        window.matchMedia = vi.fn(() => query) as unknown as typeof window.matchMedia
        const timerCountBeforeMount = vi.getTimerCount()
        const wrapper = mount(Button, {
            props: {
                effect: 'glitch',
                glitchTrigger: 'autoplay',
                glitchInterval: 50,
                loading: true,
            },
            slots: { default: 'Submit' },
        })

        expect(vi.getTimerCount()).toBe(timerCountBeforeMount)
        await wrapper.setProps({ loading: false })
        expect(vi.getTimerCount()).toBe(timerCountBeforeMount + 1)
        await wrapper.setProps({ disabled: true })
        expect(vi.getTimerCount()).toBe(timerCountBeforeMount)
        await wrapper.setProps({ disabled: false })
        expect(vi.getTimerCount()).toBe(timerCountBeforeMount + 1)

        wrapper.unmount()
        expect(vi.getTimerCount()).toBe(timerCountBeforeMount)
        expect(query.removeEventListener).toHaveBeenCalledTimes(1)
    })

    it('stops autoplay while reduced motion is preferred and resumes after it clears', async () => {
        const query = createMockMediaQuery(false)
        window.matchMedia = vi.fn(() => query) as unknown as typeof window.matchMedia
        const timerCountBeforeMount = vi.getTimerCount()
        const wrapper = mount(Button, {
            props: { effect: 'glitch', glitchTrigger: 'autoplay', glitchInterval: 50 },
            slots: { default: 'Motion' },
        })

        expect(vi.getTimerCount()).toBe(timerCountBeforeMount + 1)
        query.trigger(true)
        await nextTick()
        expect(vi.getTimerCount()).toBe(timerCountBeforeMount)
        expect(wrapper.classes()).not.toContain('is-glitching')

        query.trigger(false)
        await nextTick()
        expect(vi.getTimerCount()).toBe(timerCountBeforeMount + 1)

        wrapper.unmount()
    })

    it('stops autoplay on KeepAlive deactivation and restarts on activation', async () => {
        const query = createMockMediaQuery(false)
        window.matchMedia = vi.fn(() => query) as unknown as typeof window.matchMedia
        const timerCountBeforeMount = vi.getTimerCount()
        const Harness = defineComponent({
            components: { ResourceButton: Button },
            setup() {
                const visible = ref(true)
                return { visible }
            },
            template: `<KeepAlive>
                <ResourceButton v-if="visible" effect="glitch" glitch-trigger="autoplay" :glitch-interval="50">Cached</ResourceButton>
            </KeepAlive>`,
        })
        const wrapper = mount(Harness)

        expect(vi.getTimerCount()).toBe(timerCountBeforeMount + 1)
        expect(query.addEventListener).toHaveBeenCalledTimes(1)
        wrapper.vm.visible = false
        await nextTick()
        expect(vi.getTimerCount()).toBe(timerCountBeforeMount)
        expect(query.removeEventListener).toHaveBeenCalledTimes(1)
        query.trigger(true)
        wrapper.vm.visible = true
        await nextTick()
        expect(query.addEventListener).toHaveBeenCalledTimes(2)
        expect(vi.getTimerCount()).toBe(timerCountBeforeMount)
        expect(wrapper.findComponent(Button).classes()).not.toContain('is-glitching')
        query.trigger(false)
        await nextTick()
        expect(vi.getTimerCount()).toBe(timerCountBeforeMount + 1)

        wrapper.unmount()
        expect(vi.getTimerCount()).toBe(timerCountBeforeMount)
        expect(query.removeEventListener).toHaveBeenCalledTimes(2)
    })

    it('keeps data-text synchronized for enabled reactive slot content', async () => {
        const query = createMockMediaQuery(false)
        window.matchMedia = vi.fn(() => query) as unknown as typeof window.matchMedia
        const Harness = defineComponent({
            components: { ResourceButton: Button },
            setup() {
                const label = ref('First')
                return { label }
            },
            template: '<ResourceButton effect="glitch" glitch-trigger="none">{{ label }}</ResourceButton>',
        })
        const wrapper = mount(Harness)

        expect(wrapper.find('button').attributes('data-text')).toBe('First')
        wrapper.vm.label = 'Second'
        await nextTick()
        expect(wrapper.find('button').text()).toBe('Second')
        expect(wrapper.find('button').attributes('data-text')).toBe('Second')

        wrapper.unmount()
    })
})
