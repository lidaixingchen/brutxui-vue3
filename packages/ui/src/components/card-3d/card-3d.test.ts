import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import Card3D from './Card3D.vue'

vi.mock('../../composables/useReducedMotion', () => ({
    useReducedMotion: () => ref(false)
}))

function createPointerEvent(type: string, props: PointerEventInit = {}): PointerEvent {
    return new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        ...props,
    })
}

describe('Card3D', () => {
    it('renders with default variant classes', () => {
        const wrapper = mount(Card3D)
        const card = wrapper.find('[role="group"]').find('div')
        expect(card.classes()).toContain('border-3')
        expect(card.classes()).toContain('border-brutal')
        expect(card.classes()).toContain('rounded-brutal')
    })

    it('renders slot content', () => {
        const wrapper = mount(Card3D, {
            slots: { default: 'Hello 3D' },
        })
        expect(wrapper.text()).toContain('Hello 3D')
    })

    it('merges custom class prop', () => {
        const wrapper = mount(Card3D, {
            props: { class: 'custom-class' },
        })
        expect(wrapper.classes()).toContain('custom-class')
    })

    it('resets rotation on pointer leave', async () => {
        const wrapper = mount(Card3D)
        const card = wrapper.find('[role="group"] > div:first-child')

        card.element.dispatchEvent(createPointerEvent('pointermove', { clientX: 100, clientY: 100 }))
        await wrapper.vm.$nextTick()

        card.element.dispatchEvent(createPointerEvent('pointerleave'))
        await wrapper.vm.$nextTick()

        const style = card.attributes('style') || ''
        expect(style).toContain('rotateX(0deg)')
        expect(style).toContain('rotateY(0deg)')
    })

    it('disables 3D effect when disabled prop is true', async () => {
        const wrapper = mount(Card3D, {
            props: { disabled: true },
        })
        const card = wrapper.find('[role="group"] > div:first-child')

        card.element.dispatchEvent(createPointerEvent('pointermove', { clientX: 100, clientY: 100 }))
        await wrapper.vm.$nextTick()

        const style = card.attributes('style') || ''
        expect(style).toBe('')
    })

    it('respects prefers-reduced-motion', async () => {
        const wrapper = mount(Card3D, {
            props: { disabled: true },
        })
        const card = wrapper.find('[role="group"] > div:first-child')

        card.element.dispatchEvent(createPointerEvent('pointermove', { clientX: 100, clientY: 100 }))
        await wrapper.vm.$nextTick()

        const style = card.attributes('style') || ''
        expect(style).not.toContain('rotateX')
        expect(style).not.toContain('rotateY')
    })

    it('applies shadow variant classes', () => {
        const wrapper = mount(Card3D, {
            props: { shadow: 'lg' },
        })
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.classes()).not.toContain('shadow-brutal-lg')
    })
})

describe('Card3D variant', () => {
    it('renders default variant with bg-brutal-bg', () => {
        const wrapper = mount(Card3D)
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.classes()).toContain('bg-brutal-bg')
        expect(card.classes()).toContain('text-brutal-fg')
    })

    it('renders primary variant', () => {
        const wrapper = mount(Card3D, { props: { variant: 'primary' } })
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.classes()).toContain('bg-brutal-primary')
        expect(card.classes()).toContain('text-brutal-primary-foreground')
    })

    it('renders accent variant', () => {
        const wrapper = mount(Card3D, { props: { variant: 'accent' } })
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.classes()).toContain('bg-brutal-accent')
        expect(card.classes()).toContain('text-brutal-accent-foreground')
    })

    it('renders muted variant', () => {
        const wrapper = mount(Card3D, { props: { variant: 'muted' } })
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.classes()).toContain('bg-brutal-muted')
        expect(card.classes()).toContain('text-brutal-muted-foreground')
    })
})

describe('Card3D clickable', () => {
    it('does not add cursor-pointer by default', () => {
        const wrapper = mount(Card3D)
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.classes()).not.toContain('cursor-pointer')
    })

    it('adds cursor-pointer when clickable is true', () => {
        const wrapper = mount(Card3D, { props: { clickable: true } })
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.classes()).toContain('cursor-pointer')
    })

    it('emits click event when clickable and clicked with a real mouse click', async () => {
        const wrapper = mount(Card3D, { props: { clickable: true } })
        const card = wrapper.find('[role="group"] > div:first-child')
        // 真实鼠标 click 的 detail >= 1；detail 为 0 的 click 是键盘激活的合成事件
        await card.trigger('click', { detail: 1 })
        expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('ignores keyboard-synthesized click (detail 0) to avoid duplicate emit', async () => {
        const wrapper = mount(Card3D, { props: { clickable: true } })
        const card = wrapper.find('[role="group"] > div:first-child')
        await card.trigger('click', { detail: 0 })
        expect(wrapper.emitted('click')).toBeUndefined()
    })

    it('does not emit click when not clickable', async () => {
        const wrapper = mount(Card3D)
        const card = wrapper.find('[role="group"] > div:first-child')
        await card.trigger('click', { detail: 1 })
        expect(wrapper.emitted('click')).toBeUndefined()
    })

    it('does not emit click when disabled even if clickable', async () => {
        const wrapper = mount(Card3D, { props: { clickable: true, disabled: true } })
        const card = wrapper.find('[role="group"] > div:first-child')
        await card.trigger('click', { detail: 1 })
        expect(wrapper.emitted('click')).toBeUndefined()
    })

    it('uses slot content as accessible name by default (no aria-label override)', () => {
        const wrapper = mount(Card3D, {
            props: { clickable: true },
            slots: { default: 'Product card' },
        })
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.attributes('aria-label')).toBeUndefined()
    })

    it('uses ariaLabel prop as the accessible name when provided', () => {
        const wrapper = mount(Card3D, {
            props: { clickable: true, ariaLabel: '展开详情' },
            slots: { default: 'Product card' },
        })
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.attributes('aria-label')).toBe('展开详情')
    })

    it('adds button role and tabindex when clickable', () => {
        const wrapper = mount(Card3D, { props: { clickable: true } })
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.attributes('role')).toBe('button')
        expect(card.attributes('tabindex')).toBe('0')
    })

    it('does not add button semantics when not clickable', () => {
        const wrapper = mount(Card3D)
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.attributes('role')).toBeUndefined()
        expect(card.attributes('tabindex')).toBeUndefined()
    })

    it('removes focusability and marks aria-disabled when disabled', () => {
        const wrapper = mount(Card3D, { props: { clickable: true, disabled: true } })
        const card = wrapper.find('[role="group"] > div:first-child')
        expect(card.attributes('role')).toBe('button')
        expect(card.attributes('tabindex')).toBe('-1')
        expect(card.attributes('aria-disabled')).toBe('true')
    })

    it('emits click on Enter keydown and Space keyup', async () => {
        const wrapper = mount(Card3D, { props: { clickable: true } })
        const card = wrapper.find('[role="group"] > div:first-child')

        await card.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('click')).toHaveLength(1)
        expect(wrapper.emitted('click')![0][0]).toBeInstanceOf(KeyboardEvent)

        // 空格激活移到 keyup（keydown 阶段仅阻止滚动）
        await card.trigger('keydown', { key: ' ' })
        expect(wrapper.emitted('click')).toHaveLength(1)

        await card.trigger('keyup', { key: ' ' })
        expect(wrapper.emitted('click')).toHaveLength(2)
    })

    it('does not double-emit when browser synthesizes a click after Enter keydown', async () => {
        const wrapper = mount(Card3D, { props: { clickable: true } })
        const card = wrapper.find('[role="group"] > div:first-child')

        await card.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('click')).toHaveLength(1)

        // 浏览器对 role="button" 合成 click（detail 恒为 0），不应重复 emit
        await card.trigger('click', { detail: 0 })
        expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('prevents default on repeated Enter keydown without re-emitting', () => {
        const wrapper = mount(Card3D, { props: { clickable: true } })
        const card = wrapper.find('[role="group"] > div:first-child')

        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, repeat: true })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
        card.element.dispatchEvent(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(wrapper.emitted('click')).toBeUndefined()
    })

    it('prevents default on repeated Space keydown to avoid page scroll', () => {
        const wrapper = mount(Card3D, { props: { clickable: true } })
        const card = wrapper.find('[role="group"] > div:first-child')

        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true, repeat: true })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
        card.element.dispatchEvent(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(wrapper.emitted('click')).toBeUndefined()
    })

    it('does not emit click on keyboard when disabled', async () => {
        const wrapper = mount(Card3D, { props: { clickable: true, disabled: true } })
        const card = wrapper.find('[role="group"] > div:first-child')
        await card.trigger('keydown', { key: 'Enter' })
        await card.trigger('keyup', { key: ' ' })
        expect(wrapper.emitted('click')).toBeUndefined()
    })
})

describe('Card3D hover state reset', () => {
    it('resets hover state when disabled toggles true while hovering', async () => {
        const wrapper = mount(Card3D)
        const card = wrapper.find('[role="group"] > div:first-child')

        vi.spyOn(card.element, 'getBoundingClientRect').mockReturnValue({
            width: 200,
            height: 200,
            left: 0,
            top: 0,
            right: 200,
            bottom: 200,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        } as DOMRect)

        card.element.dispatchEvent(createPointerEvent('pointermove', { clientX: 100, clientY: 100 }))
        await wrapper.vm.$nextTick()

        // 悬停过程中禁用 → 重置悬停状态
        await wrapper.setProps({ disabled: true })
        await wrapper.vm.$nextTick()

        // 恢复启用且指针仍停留（不再触发 pointermove）→ 不应残留旧的 transform
        await wrapper.setProps({ disabled: false })
        await wrapper.vm.$nextTick()

        const style = card.attributes('style') || ''
        expect(style).toContain('rotateX(0deg)')
        expect(style).toContain('rotateY(0deg)')
    })

    it('applies pointer-events-none to shadow layer', () => {
        const wrapper = mount(Card3D)
        const shadow = wrapper.find('[aria-hidden="true"]')
        expect(shadow.classes()).toContain('pointer-events-none')
    })
})
